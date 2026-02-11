from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.core.ws_manager import manager as ws_manager
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/devices")
async def websocket_device_feed(websocket: WebSocket):
    """
    WebSocket endpoint for real-time device updates.
    Clients connect to receive push notifications about device state changes.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # Mantieni la connessione attiva, attendi messaggi dummy dal client per heartbeat
            data = await websocket.receive_text()
            # Echo o ignore
            pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)
