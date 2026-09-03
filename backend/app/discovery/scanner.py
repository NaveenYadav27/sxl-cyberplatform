import asyncio
import socket
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy import select
from app.database import async_session_maker, AssetModel
from app.websocket.event_bus import event_bus

COMMON_LAB_PORTS = [21, 22, 53, 80, 88, 135, 139, 389, 443, 445, 1433, 3000, 3389, 5985, 5986, 8000, 8006, 8088]

class ActiveHostScanner:
    """Active TCP port scanner for cyber-range hosts."""

    async def scan_host_ports(self, ip_address: str, timeout: float = 0.5) -> List[int]:
        """Scans common cyber range ports on a given IP address."""
        open_ports = []
        loop = asyncio.get_running_loop()

        async def check_port(port: int):
            try:
                conn = asyncio.open_connection(ip_address, port)
                reader, writer = await asyncio.wait_for(conn, timeout=timeout)
                writer.close()
                await writer.wait_closed()
                return port
            except Exception:
                return None

        tasks = [check_port(p) for p in COMMON_LAB_PORTS]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for res in results:
            if isinstance(res, int):
                open_ports.append(res)

        return sorted(open_ports)

    async def scan_and_update_asset(self, asset_id: str) -> Dict[str, Any]:
        """Performs a live port scan on an asset and updates its database profile."""
        async with async_session_maker() as session:
            res = await session.execute(select(AssetModel).where(AssetModel.asset_id == asset_id))
            asset = res.scalars().first()
            if not asset:
                return {"status": "error", "message": "Asset not found"}

            target_ip = asset.ip_address or "127.0.0.1"
            discovered_ports = await self.scan_host_ports(target_ip)

            asset.open_ports = discovered_ports
            asset.last_seen = datetime.utcnow()
            asset.status = "ACTIVE"
            await session.commit()

            # Broadcast update
            await event_bus.broadcast("ASSET_SCANNED", {
                "asset_id": asset_id,
                "hostname": asset.hostname,
                "ip": target_ip,
                "open_ports": discovered_ports,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            })

            return {
                "status": "completed",
                "asset_id": asset_id,
                "hostname": asset.hostname,
                "ip": target_ip,
                "open_ports": discovered_ports,
                "ports_count": len(discovered_ports)
            }

active_scanner = ActiveHostScanner()
