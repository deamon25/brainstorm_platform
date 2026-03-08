"""Simple test script for the API"""
import requests
import json

BASE_URL = "http://127.0.0.1:8004/api/v1"

# Test health endpoint
print("=" * 60)
print("Testing Health Check")
print("=" * 60)
try:
    response = requests.get(f"{BASE_URL}/health")
    print("Health check:", json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Health check failed: {e}")

# Test hesitation detection
print("\n" + "=" * 60)
print("Testing Hesitation Detection")
print("=" * 60)
try:
    data = {
        "delFreq": 10,
        "leftFreq": 5,
        "TotTime": 15000
    }
    response = requests.post(
        f"{BASE_URL}/detect-hesitation",
        json=data,
        headers={"Content-Type": "application/json"}
    )
    print("Hesitation Detection Response:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Hesitation detection failed: {e}")

# Test with higher hesitation values
print("\n" + "=" * 60)
print("Testing High Hesitation Scenario")
print("=" * 60)
try:
    data = {
        "delFreq": 50,  # Many deletions
        "leftFreq": 30,  # Many corrections
        "TotTime": 45000  # Long time
    }
    response = requests.post(
        f"{BASE_URL}/detect-hesitation",
        json=data,
        headers={"Content-Type": "application/json"}
    )
    print("High Hesitation Test Response:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"High hesitation test failed: {e}")

# Test Entity-Preserving Rephrase (NEW /entity-preserving-rephrase endpoint)
print("\n" + "=" * 60)
print("Testing Entity-Preserving Rephrase (/entity-preserving-rephrase)")
print("=" * 60)
try:
    data = {
        "text": "I think maybe John could work with the Marketing team on the Q4 Sprint to implement the new Dashboard feature."
    }
    response = requests.post(
        f"{BASE_URL}/entity-preserving-rephrase",
        json=data,
        headers={"Content-Type": "application/json"}
    )
    print("Entity-Preserving Rephrase Response:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Entity-preserving rephrase failed: {e}")

# Test another example
print("\n" + "=" * 60)
print("Testing Entity-Preserving Rephrase - Example 2")
print("=" * 60)
try:
    data = {
        "text": "Perhaps we could potentially ask Sarah from the Engineering department to look into the payment gateway integration for the mobile app."
    }
    response = requests.post(
        f"{BASE_URL}/entity-preserving-rephrase",
        json=data,
        headers={"Content-Type": "application/json"}
    )
    print("Entity-Preserving Rephrase Response:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Entity-preserving rephrase failed: {e}")

# Test Entity Extraction
print("\n" + "=" * 60)
print("Testing Entity Extraction")
print("=" * 60)
try:
    data = {
        "text": "John from the Marketing team will work with Sarah on the Dashboard feature in Sprint 5."
    }
    response = requests.post(
        f"{BASE_URL}/extract-entities",
        json=data,
        headers={"Content-Type": "application/json"}
    )
    print("Entity Extraction Response:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Entity extraction failed: {e}")

# Test Storage - Create Session
print("\n" + "=" * 60)
print("Testing Storage - Create Session")
print("=" * 60)
try:
    data = {
        "session_name": "Test Sprint Planning Q1 2026",
        "description": "Testing session for Q1 sprint planning",
        "participant_ids": ["user_1", "user_2"]
    }
    response = requests.post(
        f"{BASE_URL}/sessions",
        json=data,
        headers={"Content-Type": "application/json"}
    )
    if response.status_code == 201:
        session_data = response.json()
        session_id = session_data["_id"]
        print("Session Created:")
        print(json.dumps(session_data, indent=2))
        
        # Test Storage - Create Idea
        print("\n" + "=" * 60)
        print("Testing Storage - Create Idea")
        print("=" * 60)
        idea_data = {
            "session_id": session_id,
            "participant_id": "user_1",
            "original_text": "I think we should add a new dashboard feature.",
            "rephrased_text": "We should add a new dashboard feature.",
            "entities": [{"text": "dashboard", "label": "FEATURE"}],
            "hesitation_score": -0.25,
            "is_hesitant": True,
            "is_approved": True,
            "tags": ["UI", "analytics"]
        }
        response = requests.post(
            f"{BASE_URL}/ideas",
            json=idea_data,
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 201:
            idea_response = response.json()
            print("Idea Created:")
            print(json.dumps(idea_response, indent=2))
            
            # Test Get Session Statistics
            print("\n" + "=" * 60)
            print("Testing Session Statistics")
            print("=" * 60)
            response = requests.get(f"{BASE_URL}/sessions/{session_id}/statistics")
            print("Session Statistics:")
            print(json.dumps(response.json(), indent=2))
            
            # Test Get Ideas for Session
            print("\n" + "=" * 60)
            print("Testing Get Ideas for Session")
            print("=" * 60)
            response = requests.get(f"{BASE_URL}/ideas?session_id={session_id}")
            print("Ideas List:")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Failed to create idea: {response.status_code}")
            print(response.text)
    else:
        print(f"Failed to create session: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"Storage test failed: {e}")
