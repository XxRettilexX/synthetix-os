import asyncio
import httpx
import websockets
import json
import uvicorn
from multiprocessing import Process
import time
import sys

# Configuration
BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/api/ws/devices"

async def test_flow():
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # 1. Healthcheck
        print("🔍 Testing Healthcheck...")
        resp = await client.get("/api/health")
        assert resp.status_code == 200, f"Healthcheck failed: {resp.text}"
        print("✅ Healthcheck OK")

        # 2. Register/Login
        print("\n🔐 Testing Auth...")
        email = f"test_{int(time.time())}@example.com"
        password = "password123"
        
        # Register
        resp = await client.post("/api/auth/register", json={
            "email": email, 
            "password": password,
            "username": "tester",
            "full_name": "Test User"
        })
        # Supabase auth might fail if SMTP is not set up or configured to confirm email
        # But for dev environment often it returns 200 or we can sign in if confirmation is off
        # If it requires confirmation, we might need to Mock supabase client.
        # However, let's assume we can proceed or handle the error.
        
        if resp.status_code not in [200, 201]:
             print(f"⚠️ Registration warning: {resp.text}")
             # Try login anyway, maybe user exists
        
        # Login
        resp = await client.post("/api/auth/login", json={"email": email, "password": password})
        if resp.status_code != 200:
            print(f"❌ Login failed: {resp.text}")
            return
            
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Login OK")

        # 3. WebSocket Connection
        print("\n🔌 Testing WebSocket...")
        async with websockets.connect(WS_URL) as ws:
            print("✅ WebSocket Connected")
            
            # 4. Create Device
            print("\n📱 Creating Device...")
            device_data = {
                "name": "Test Lamp",
                "device_type": "virtual_light",
                "state": {"on": False, "brightness": 0}
            }
            resp = await client.post("/api/devices/", json=device_data, headers=headers)
            assert resp.status_code == 201, f"Create device failed: {resp.text}"
            device = resp.json()
            device_id = device["id"]
            print(f"✅ Device Created: {device_id}")
            
            # 5. Send Command
            print("\n📡 Sending Command...")
            command = {
                "command": "set_state",
                "params": {"on": True, "brightness": 80}
            }
            resp = await client.post(f"/api/devices/{device_id}/command", json=command, headers=headers)
            assert resp.status_code == 200, f"Command failed: {resp.text}"
            print("✅ Command Sent")
            
            # 6. Verify WebSocket Update
            print("⏳ Waiting for WebSocket update...")
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
                data = json.loads(msg)
                print(f"📨 Received WS Message: {data}")
                
                assert data["event"] == "device_update"
                assert data["device_id"] == device_id
                assert data["state"]["on"] == True
                assert data["state"]["brightness"] == 80
                print("✅ WebSocket Update Verified")
            except asyncio.TimeoutError:
                print("❌ WebSocket Timeout - No message received")

if __name__ == "__main__":
    try:
        asyncio.run(test_flow())
    except Exception as e:
        print(f"❌ Test Failed: {e}")
        sys.exit(1)
