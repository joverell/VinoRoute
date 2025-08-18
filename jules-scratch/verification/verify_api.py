import requests
import json

def verify_api():
    url = "http://localhost:3000/api/admin/find-new-locations"
    headers = {
        "Authorization": "Bearer test-admin-api-script",
        "Content-Type": "application/json"
    }
    data = {
        "regionName": "Hunter Valley, NSW, Australia"
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        response.raise_for_status()  # Raise an exception for bad status codes

        print("API call successful.")
        print("Response:")
        print(response.json())

    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")
        if e.response:
            print(f"Response content: {e.response.text}")

if __name__ == "__main__":
    verify_api()
