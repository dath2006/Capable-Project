import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_papers_router_registered():
    response = client.get("/api/papers")
    # Expected 401 Unauthorized because we didn't pass a JWT token
    assert response.status_code == 401
    
    print("Testing FastAPI Route Registration...")
    print("SUCCESS: /api/papers is mounted and correctly guarded by Auth!")

if __name__ == "__main__":
    test_papers_router_registered()
