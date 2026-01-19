#!/usr/bin/env python3
import requests
import base64
import json

# Create a test token (restaurant_id=1)
token = base64.b64encode(b"1.test").decode('utf-8')

# Test API endpoint
url = "http://localhost/QR-reservation/backend-php/api/stations"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
payload = {
    "nom": "Grill",
    "description": "Poste de grill",
    "couleur": "#FF5733"
}

print(f"Testing POST {url}")
print(f"Token: {token}")
print(f"Payload: {json.dumps(payload, indent=2)}")
print("-" * 60)

try:
    response = requests.post(url, json=payload, headers=headers, timeout=5)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    if response.status_code == 201:
        print("\n✅ SUCCESS - Station created!")
    else:
        print(f"\n❌ ERROR - Unexpected status code")
except Exception as e:
    print(f"❌ ERROR: {e}")
