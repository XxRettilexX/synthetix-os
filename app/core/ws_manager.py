from typing import List, Dict
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Gestisce le connessioni WebSocket attive"""
    
    def __init__(self):
        # Lista di connessioni attive
        self.active_connections: List[WebSocket] = []
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: Dict):
        """Invia un messaggio a tutti i client connessi"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending broadcast: {e}")
                disconnected.append(connection)
        
        # Rimuovi connessioni morte
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()            
