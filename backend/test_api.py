import requests
import json
import uuid

base_url = "http://localhost:8000"

def test_api():
    # 1. Signup
    print("Signing up...")
    unique = str(uuid.uuid4())[:8]
    user_data = {
        "username": f"test_{unique}",
        "email": f"test_{unique}@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "study_field": "Computer Science"
    }
    res = requests.post(f"{base_url}/auth/signup", json=user_data)
    if res.status_code != 200 and res.status_code != 201:
        print("Signup failed:", res.text)
        return
    
    # 2. Login
    print("Logging in...")
    res = requests.post(f"{base_url}/auth/login", json={"username": user_data["username"], "password": user_data["password"]})
    if res.status_code != 200:
        print("Login failed:", res.text)
        return
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Generate flashcards
    print("Generating flashcards...")
    with open("test_flashcard.txt", "rb") as f:
        files = {"file": ("test_flashcard.txt", f, "text/plain")}
        res = requests.post(f"{base_url}/api/flashcards/generate", headers=headers, files=files)
        
    print(f"Status: {res.status_code}")
    if res.status_code == 200:
        print(json.dumps(res.json(), indent=2))
    else:
        print("Error:", res.text)
        
    # 4. List decks
    print("\nListing flashcards...")
    res = requests.get(f"{base_url}/api/flashcards", headers=headers)
    if res.status_code == 200:
        print(json.dumps(res.json(), indent=2))
    else:
        print("List failed:", res.text)

if __name__ == "__main__":
    test_api()
