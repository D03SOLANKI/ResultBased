import requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
}

s = requests.Session()
s.headers.update(headers)

test_urls = [
    "https://www.nseindia.com",
    "https://www.nseindia.com/api/event-calendar",
    "https://www.nseindia.com/api/corporate-board-meetings?index=equities",
    "https://www.nseindia.com/api/corporate-announcements?index=equities",
    "https://www.nseindia.com/api/corporates-financial-results?index=equities&period=Quarterly",
]

for url in test_urls:
    try:
        r = s.get(url, timeout=5)
        print(f"requests -> {url} : Status {r.status_code}, Length {len(r.content)}")
    except Exception as e:
        print(f"requests -> {url} : Error {e}")
