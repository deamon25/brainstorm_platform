"""
Test script for hesitation detection endpoint
"""
import requests
import json
import time

# Wait for server to start
print("Waiting 3 seconds for server to start...")
time.sleep(3)

# Test data
test_data = {
    "delFreq": 10,
    "leftFreq": 5,
    "TotTime": 15000
}

print(f"\nTesting hesitation detection with data:")
print(json.dumps(test_data, indent=2))

# Make request
url = "http://localhost:8005/api/v1/detect-hesitation"
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, json=test_data, headers=headers)
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response Body:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"\nError: {e}")
