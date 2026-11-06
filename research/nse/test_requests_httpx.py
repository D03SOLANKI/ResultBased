import requests
import httpx

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
}

print("Testing requests on /api/event-calendar:")
try:
    r = requests.get("https://www.nseindia.com/api/event-calendar", headers=headers, timeout=5)
    print(f"requests: status {r.status_code}")
except Exception as e:
    print(f"requests exception: {e}")

print("Testing httpx on /api/event-calendar:")
try:
    client = httpx.Client(headers=headers, http2=True, timeout=5)
    r2 = client.get("https://www.nseindia.com/api/event-calendar")
    print(f"httpx: status {r2.status_code}")
except Exception as e:
    print(f"httpx exception: {e}")
