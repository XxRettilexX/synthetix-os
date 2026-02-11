import asyncio
from typing import Dict, Any, Optional

from app.core.device_manager import DeviceDriver
from app.models.device import DeviceLog

class VirtualLight(DeviceDriver):
    """
    Simula una lampadina smart con stato ON/OFF e Luminosità (0-100).
    Non ha connettività reale ma mantiene lo stato in memoria.
    """
    
    def __init__(self, device_id: str, config: Dict[str, Any]):
        super().__init__(device_id, config)
        self.state: Dict[str, Any] = {
            "on": False,
            "brightness": 100,
            "color": "white"
        }
    
    async def connect(self) -> bool:
        """Simula una connessione riuscita"""
        self.is_connected = True
        print(f"💡 Virtual Light {self.device_id} CONNECTED")
        return True

    async def disconnect(self):
        """Simula una disconnessione"""
        self.is_connected = False
        print(f"💡 Virtual Light {self.device_id} DISCONNECTED")

    async def get_state(self) -> Dict[str, Any]:
        """Restituisce lo stato attuale"""
        return self.state

    async def set_state(self, state: Dict[str, Any]) -> bool:
        """Aggiorna lo stato della lampadina virtuale"""
        if not self.is_connected:
            return False
            
        print(f"✨ Changing state for light {self.device_id}: {state}")
        
        # Aggiorna lo stato in base ai campi forniti
        if "on" in state:
            self.state["on"] = bool(state["on"])
            
        if "brightness" in state:
            try:
                val = int(state["brightness"])
                self.state["brightness"] =  max(0, min(100, val))
            except ValueError:
                pass
        
        # Simula latenza di rete
        await asyncio.sleep(0.1)
        
        return True
