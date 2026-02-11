from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from app.core.ws_manager import manager as ws_manager
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/devices")
async def websocket_device_feed(
    websocket: WebSocket,
    token: Optional[str] = None
):
    """
    WebSocket endpoint for real-time device updates.
    """
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # In un caso reale, qui valideresti il token JWT tramite Supabase
    # Per semplicità lo accettiamo se presente, o simula validazione
    
    await ws_manager.connect(websocket)
    try:
        while True:
            # Heartbeat from client
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)
