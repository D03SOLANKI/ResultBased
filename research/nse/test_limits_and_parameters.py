import json
import time
from datetime import datetime, timedelta
from curl_cffi import requests as cffi_requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}
session = cffi_requests.Session(impersonate="chrome120")
session.get("https://www.nseindia.com", headers=headers, timeout=10)

api_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/companies-listing/corporate-filings-board-meetings',
}

print("=== 1. Testing date range spans on corporate-board-meetings ===")
today = datetime.now()
spans = [7, 30, 90, 180, 365]
for days in spans:
    f_d = (today - timedelta(days=days)).strftime("%d-%m-%Y")
    t_d = today.strftime("%d-%m-%Y")
    url = f"https://www.nseindia.com/api/corporate-board-meetings?index=equities&from_date={f_d}&to_date={t_d}"
    r = session.get(url, headers=api_headers, timeout=10)
    print(f"Span {days} days ({f_d} to {t_d}): Status {r.status_code}, Length {len(r.content)}")
    if r.status_code == 200:
        try:
            items = r.json()
            print(f"   Items returned: {len(items) if isinstance(items, list) else 'dict'}")
        except:
            print(f"   Response text preview: {r.text[:100]}")
    else:
        print(f"   Error: {r.text[:100]}")
    time.sleep(0.5)

print("\n=== 2. Testing future date ranges on corporate-board-meetings ===")
future_spans = [7, 14, 30, 60]
for days in future_spans:
    f_d = today.strftime("%d-%m-%Y")
    t_d = (today + timedelta(days=days)).strftime("%d-%m-%Y")
    url = f"https://www.nseindia.com/api/corporate-board-meetings?index=equities&from_date={f_d}&to_date={t_d}"
    r = session.get(url, headers=api_headers, timeout=10)
    print(f"Future Span +{days} days ({f_d} to {t_d}): Status {r.status_code}, Length {len(r.content)}")
    if r.status_code == 200:
        try:
            items = r.json()
            print(f"   Items returned: {len(items) if isinstance(items, list) else 'dict'}")
        except:
            print(f"   Response text preview: {r.text[:100]}")
    time.sleep(0.5)

print("\n=== 3. Testing date range spans on corporate-announcements ===")
for days in [7, 30, 90, 180]:
    f_d = (today - timedelta(days=days)).strftime("%d-%m-%Y")
    t_d = today.strftime("%d-%m-%Y")
    url = f"https://www.nseindia.com/api/corporate-announcements?index=equities&from_date={f_d}&to_date={t_d}"
    r = session.get(url, headers=api_headers, timeout=10)
    print(f"Announcements Span {days} days: Status {r.status_code}, Length {len(r.content)}")
    if r.status_code == 200:
        try:
            items = r.json()
            print(f"   Items returned: {len(items) if isinstance(items, list) else 'dict'}")
        except:
            print(f"   Response text preview: {r.text[:100]}")
    time.sleep(0.5)

print("\n=== 4. Testing period values on corporates-financial-results ===")
periods = ["Quarterly", "Half-Yearly", "Annual", "Audited", "Unaudited"]
for p in periods:
    url = f"https://www.nseindia.com/api/corporates-financial-results?index=equities&period={p}"
    r = session.get(url, headers=api_headers, timeout=10)
    print(f"Financial results period='{p}': Status {r.status_code}, Length {len(r.content)}")
    if r.status_code == 200:
        try:
            items = r.json()
            print(f"   Items: {len(items) if isinstance(items, list) else 'dict'}")
        except:
            print(f"   Response text: {r.text[:100]}")
    time.sleep(0.5)

print("\n=== 5. Testing rate limits (burst test) ===")
# Send 10 rapid requests to check if NSE throttles or blocks
success_count = 0
start_t = time.time()
for i in range(10):
    url = "https://www.nseindia.com/api/event-calendar"
    r = session.get(url, headers=api_headers, timeout=5)
    if r.status_code == 200:
        success_count += 1
    else:
        print(f"Burst req {i} failed with status {r.status_code}")
duration = time.time() - start_t
print(f"Burst test: {success_count}/10 successful in {duration:.2f} seconds")
