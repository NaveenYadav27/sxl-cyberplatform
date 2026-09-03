from fastapi import APIRouter
from app.api import appliance, network, assets, telemetry, detections, cases, purple, connectors, edr, falcon, proxmox, agents, modules, compliance, tools, virtualbox, vpn

api_router = APIRouter()

api_router.include_router(appliance.router)
api_router.include_router(network.router)
api_router.include_router(assets.router)
api_router.include_router(telemetry.router)
api_router.include_router(detections.router)
api_router.include_router(cases.router)
api_router.include_router(purple.router)
api_router.include_router(connectors.router)
api_router.include_router(edr.router)
api_router.include_router(falcon.router)
api_router.include_router(proxmox.router)
api_router.include_router(virtualbox.router)
api_router.include_router(agents.router)
api_router.include_router(modules.router)
api_router.include_router(compliance.router)
api_router.include_router(tools.router)
api_router.include_router(vpn.router)


