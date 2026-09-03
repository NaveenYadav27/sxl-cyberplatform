import asyncio
import json
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select

from app.config import settings
from app.database import init_db, async_session_maker, EdgeAgentModel
from app.api.router import api_router
from app.websocket.event_bus import event_bus
from app.normalizer.canonical_normalizer import canonical_normalizer
from app.collectors.hec_receiver import hec_receiver
from app.health.system_health import system_health

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Appliance Boot Sequence - Zero Synthetic Data
    system_health.is_booting = True
    print(f"[*] Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # 1. Initialize persistent storage schema
    await init_db()
    print("[+] Database schema initialized on persistent storage volume.")
    
    system_health.is_booting = False
    print(f"[+] Control Plane operational at {settings.PUBLIC_BASE_URL}")
    yield
    
    print("[*] ShadowXLab Control Plane services shut down cleanly.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS configuration for public domain & reverse proxy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST API v1
app.include_router(api_router, prefix=settings.API_V1_STR)

# Splunk HEC Endpoint on default app port
@app.post("/services/collector/event")
@app.post("/services/collector")
async def splunk_hec_ingest(request: Request):
    """Splunk HEC compatible receiver."""
    body_text = (await request.body()).decode("utf-8", errors="ignore")
    return await hec_receiver.handle_hec_payload(body_text)

# Edge Agent Bidirectional Outbound WebSocket Tunnel
@app.websocket("/ws/agent")
async def edge_agent_tunnel(websocket: WebSocket):
    """
    Handles authenticated outbound WebSocket connections from ShadowXLab Edge Agents.
    Performs raw envelope ingestion, canonical 29-field normalization, and returns Server ACKs.
    """
    await websocket.accept()
    agent_id = None

    try:
        # 1. Handshake frame
        init_frame = await websocket.receive_json()
        agent_id = init_frame.get("agent_id")
        installation_id = init_frame.get("installation_id")

        # Verify agent registration and revocation status
        async with async_session_maker() as session:
            res = await session.execute(
                select(EdgeAgentModel).where(
                    (EdgeAgentModel.agent_id == agent_id) &
                    (EdgeAgentModel.installation_id == installation_id)
                )
            )
            agent_obj = res.scalars().first()
            if not agent_obj or agent_obj.is_revoked:
                await websocket.send_json({"type": "AUTH_ERROR", "message": "Agent authentication rejected or certificate revoked."})
                await websocket.close(code=4003)
                return

            agent_obj.last_heartbeat = datetime.utcnow()
            agent_obj.status = "CONNECTED"
            await session.commit()

        await websocket.send_json({
            "type": "AUTH_OK",
            "agent_id": agent_id,
            "server_time": datetime.utcnow().isoformat() + "Z"
        })

        # 2. Main processing loop for incoming raw envelopes
        while True:
            msg = await websocket.receive_text()
            data = json.loads(msg)
            msg_type = data.get("type", "EVENT_ENVELOPE")

            if msg_type == "HEARTBEAT":
                async with async_session_maker() as session:
                    res = await session.execute(select(EdgeAgentModel).where(EdgeAgentModel.agent_id == agent_id))
                    a = res.scalars().first()
                    if a:
                        a.last_heartbeat = datetime.utcnow()
                        a.status = "CONNECTED"
                        a.connectors_summary = data.get("connectors", {})
                        await session.commit()
                await websocket.send_json({"type": "HEARTBEAT_ACK", "server_time": datetime.utcnow().isoformat() + "Z"})

            elif msg_type == "EVENT_ENVELOPE":
                envelope = data.get("envelope", {})
                success, ack_payload = await canonical_normalizer.normalize_and_store(envelope, agent_id)
                # Send Server ACK back to Edge Agent for durable spool purging
                await websocket.send_json({
                    "type": "SERVER_ACK",
                    "ack": ack_payload
                })

            elif msg_type == "INFRA_DISCOVERY":
                # Handle dynamic VM/Asset discovery batch
                from app.api.assets import process_discovered_assets
                await process_discovered_assets(data.get("assets", []), agent_id)
                await websocket.send_json({"type": "DISCOVERY_ACK", "count": len(data.get("assets", []))})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[-] Edge Agent tunnel error for {agent_id}: {e}")
    finally:
        if agent_id:
            async with async_session_maker() as session:
                res = await session.execute(select(EdgeAgentModel).where(EdgeAgentModel.agent_id == agent_id))
                a = res.scalars().first()
                if a and not a.is_revoked:
                    a.status = "DISCONNECTED"
                    await session.commit()

# WebSocket Real-Time Event Bus Endpoint for Browser UI
@app.websocket("/ws/events")
async def websocket_event_stream(websocket: WebSocket):
    import httpx
    await event_bus.connect(websocket)
    initial_health = await system_health.evaluate_state()
    await websocket.send_json({
        "type": "INITIAL_HEALTH",
        "data": initial_health
    })
    try:
        async with httpx.AsyncClient(app=app, base_url="http://testserver") as client:
            while True:
                msg = await websocket.receive_text()
                try:
                    data = json.loads(msg)
                except Exception:
                    continue

                if data.get("type") == "RPC_REQUEST":
                    call_id = data.get("call_id")
                    method = data.get("method", "GET").upper()
                    path = data.get("path")
                    body = data.get("body")
                    headers = data.get("headers", {})

                    # Inject internal headers to avoid WSGI/ASGI session issues
                    headers["accept"] = "application/json"
                    headers["content-type"] = "application/json"

                    try:
                        if method == "GET":
                            response = await client.get(path, headers=headers)
                        elif method == "POST":
                            response = await client.post(path, json=body, headers=headers)
                        elif method == "DELETE":
                            response = await client.delete(path, headers=headers)
                        elif method == "PUT":
                            response = await client.put(path, json=body, headers=headers)
                        else:
                            raise ValueError(f"Method {method} not supported over WebSocket RPC")

                        res_body = response.json() if "application/json" in response.headers.get("content-type", "") else response.text
                        await websocket.send_json({
                            "type": "RPC_RESPONSE",
                            "call_id": call_id,
                            "status_code": response.status_code,
                            "body": res_body
                        })
                    except Exception as e:
                        await websocket.send_json({
                            "type": "RPC_RESPONSE",
                            "call_id": call_id,
                            "status_code": 500,
                            "body": {"detail": f"Local RPC Execution Failed: {str(e)}"}
                        })
    except WebSocketDisconnect:
        await event_bus.disconnect(websocket)
    except Exception:
        await event_bus.disconnect(websocket)

@app.get("/api/health")
@app.get("/api/v1/health")
async def health_check():
    """Global production health check endpoint."""
    state = await system_health.evaluate_state()
    return state

# ─── Static Web Console & Interactive Labs Mount ─────────────────────────────
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "dist"))
PUBLIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "public"))

if os.path.exists(DIST_DIR):
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/soc-interactive-labs.html")
    async def serve_labs_html():
        labs_dist = os.path.join(DIST_DIR, "soc-interactive-labs.html")
        if os.path.exists(labs_dist):
            return FileResponse(labs_dist)
        labs_public = os.path.join(PUBLIC_DIR, "soc-interactive-labs.html")
        if os.path.exists(labs_public):
            return FileResponse(labs_public)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(DIST_DIR, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

