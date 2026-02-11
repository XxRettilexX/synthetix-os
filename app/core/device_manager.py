from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

class DeviceDriver(ABC):
    """Abstract Base Class for all device drivers"""
    
    def __init__(self, device_id: str, config: Dict[str, Any]):
        self.device_id = device_id
        self.config = config
        self.is_connected = False

    @abstractmethod
    async def connect(self) -> bool:
        """Stabilisce la connessione con il dispositivo"""
        pass

    @abstractmethod
    async def disconnect(self):
        """Chiude la connessione"""
        pass

    @abstractmethod
    async def get_state(self) -> Dict[str, Any]:
        """Restituisce lo stato corrente del dispositivo"""
        pass

    @abstractmethod
    async def set_state(self, state: Dict[str, Any]) -> bool:
        """Imposta lo stato del dispositivo (es: accendi luce)"""
        pass
    
    @property
    def driver_type(self) -> str:
        """Restituisce il tipo di driver"""
        return self.__class__.__name__


class DeviceManager:
    """Singleton per la gestione dei driver attivi"""
    _instance = None
    
    def __init__(self):
        self.drivers: Dict[str, DeviceDriver] = {}
        self.device_types: Dict[str, type] = {}  # Registry dei driver supportati

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = DeviceManager()
        return cls._instance

    def register_device_type(self, type_name: str, driver_class: type):
        """Registra una classe driver per un tipo di dispositivo"""
        self.device_types[type_name] = driver_class
        logger.info(f"Registered driver type: {type_name}")

    async def load_device(self, device_id: str, device_type: str, config: Dict[str, Any]) -> bool:
        """Inizializza un driver per un dispositivo"""
        if device_type not in self.device_types:
            logger.error(f"Unknown device type: {device_type}")
            return False
            
        driver_cls = self.device_types[device_type]
        try:
            driver = driver_cls(device_id, config)
            connected = await driver.connect()
            if connected:
                self.drivers[device_id] = driver
                logger.info(f"Device loaded: {device_id} ({device_type})")
                return True
            else:
                logger.warning(f"Failed to connect to device: {device_id}")
                return False
        except Exception as e:
            logger.error(f"Error loading device {device_id}: {e}")
            return False

    async def unload_device(self, device_id: str):
        if device_id in self.drivers:
            await self.drivers[device_id].disconnect()
            del self.drivers[device_id]
            logger.info(f"Device unloaded: {device_id}")

    async def get_device_state(self, device_id: str) -> Optional[Dict[str, Any]]:
        if device_id in self.drivers:
            return await self.drivers[device_id].get_state()
        return None

    async def send_command(self, device_id: str, command: Dict[str, Any]) -> bool:
        if device_id in self.drivers:
            logger.info(f"Sending command to {device_id}: {command}")
            return await self.drivers[device_id].set_state(command)
        else:
            logger.warning(f"Device {device_id} not connected or driver not loaded")
            return False
