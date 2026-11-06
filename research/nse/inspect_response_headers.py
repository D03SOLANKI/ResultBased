import requests

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
}

s = requests.Session()
s.headers.update(headers)
r = s.get("https://www.nseindia.com/api/event-calendar")
print("Response headers:", dict(r.headers))
print("Session cookies:", dict(s.cookies))
