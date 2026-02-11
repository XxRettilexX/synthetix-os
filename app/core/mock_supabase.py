from typing import Any, Dict, List, Optional
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class MockResult:
    def __init__(self, data):
        self.data = data

class MockUser:
    def __init__(self, id, email, user_metadata=None):
        self.id = id
        self.email = email
        self.user_metadata = user_metadata or {}
        self.app_metadata = {}

class MockSession:
    def __init__(self, access_token):
        self.access_token = access_token
        self.user = MockUser(access_token, "test@example.com") # User ID as token

class MockAuthResponse:
    def __init__(self, user, session):
        self.user = user
        self.session = session

class MockAuth:
    def __init__(self):
        # In-memory user store
        self.users = {}
        
    def sign_up(self, credentials: Dict):
        email = credentials.get("email")
        password = credentials.get("password")
        user_id = str(uuid.uuid4())
        
        user = MockUser(id=user_id, email=email, user_metadata=credentials.get("options", {}).get("data", {}))
        self.users[email] = {"user": user, "password": password}
        logger.info(f"MockAuth: Created user {email} ({user_id})")
        
        session = MockSession(access_token=user_id) # Using ID as token for simplicity
        session.user = user
        return MockAuthResponse(user=user, session=session)
        
    def sign_in_with_password(self, credentials: Dict):
        email = credentials.get("email")
        password = credentials.get("password")
        
        record = self.users.get(email)
        if not record:
            logger.warning(f"MockAuth: User {email} not found")
            return MockAuthResponse(user=None, session=None)
            
        if record["password"] != password:
            logger.warning(f"MockAuth: Invalid password for {email}")
            return MockAuthResponse(user=None, session=None)
            
        user = record["user"]
        session = MockSession(access_token=user.id)
        session.user = user
        logger.info(f"MockAuth: Logged in user {email}")
        return MockAuthResponse(user=user, session=session)

    def get_user(self, token: str):
        # Scan users to find by ID (since token is ID in this mock)
        for email, record in self.users.items():
            if record["user"].id == token:
                logger.info(f"MockAuth: Validated token for {email}")
                return MockAuthResponse(user=record["user"], session=None)
        
        if token == "mock-token":
             logger.info("MockAuth: Validated special 'mock-token'")
             return MockAuthResponse(user=MockUser(id="mock-user-id", email="demo@example.com"), session=None)

        # Fallback: Create a transient user if token looks like a UUID (for testing restart persistence)
        try:
             uuid.UUID(token)
             logger.info(f"MockAuth: Token looks like UUID, creating transient user for {token}")
             return MockAuthResponse(user=MockUser(id=token, email="transient@example.com"), session=None)
        except:
             logger.warning(f"MockAuth: Invalid token {token}")
             return None

class MockTableQuery:
    def __init__(self, data_list: List[Dict]):
        self.source_data = data_list
        self.current_data = list(data_list) # Work on copy initially? No, need to modify source for insert/update
        # Actually for query building we filter, for actions we modify source
        self.filters = []
        self.action = "select" # select, insert, update, delete
        self.payload = None

    def select(self, columns: str):
        self.action = "select"
        return self
        
    def insert(self, record: Dict):
        self.action = "insert"
        self.payload = record
        return self
        
    def update(self, record: Dict):
        self.action = "update"
        self.payload = record
        return self
    
    def delete(self):
        self.action = "delete"
        return self

    def eq(self, column: str, value: Any):
        self.filters.append((column, value))
        return self
        
    def limit(self, count: int):
        # Not fully implemented but safe to ignore for mock logic usually
        return self

    def execute(self):
        # Apply filters to find target rows
        target_indices = []
        for i, row in enumerate(self.source_data):
            match = True
            for col, val in self.filters:
                if row.get(col) != val:
                    match = False
                    break
            if match:
                target_indices.append(i)
        
        if self.action == "select":
            result_data = [self.source_data[i] for i in target_indices]
            # If no filters were applied (select *), return all? 
            if not self.filters:
                 result_data = list(self.source_data)
            return MockResult(result_data)

        elif self.action == "insert":
            record = self.payload.copy()
            if "id" not in record:
                record["id"] = str(uuid.uuid4())
            self.source_data.append(record)
            return MockResult([record])

        elif self.action == "update":
            updated_rows = []
            for i in target_indices:
                self.source_data[i].update(self.payload)
                updated_rows.append(self.source_data[i])
            return MockResult(updated_rows)

        elif self.action == "delete":
            # Remove in reverse order to keep indices valid
            for i in sorted(target_indices, reverse=True):
                self.source_data.pop(i)
            return MockResult([])
            
        return MockResult([])


class MockSupabaseClient:
    """Mock per Supabase Client per sviluppo locale"""
    
    # Static storage to persist across requests in same process
    _tables = {
        "devices": [],
        "files": [],
        "profiles": []
    }
    
    def __init__(self, supabase_url: str, supabase_key: str):
        self.auth = MockAuth()

    def table(self, table_name: str):
        if table_name not in self._tables:
            self._tables[table_name] = []
        return MockTableQuery(self._tables[table_name])
        
    def from_(self, table_name: str):
        return self.table(table_name)
