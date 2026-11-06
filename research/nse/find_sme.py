import re
from curl_cffi import requests as cffi_requests
from bs4 import BeautifulSoup

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
    'Referer': 'https://www.nseindia.com/',
}

r = session.get("https://www.nseindia.com/market-data/securities-available-for-trading", headers=headers, timeout=10)
soup = BeautifulSoup(r.text, "html.parser")
for a in soup.find_all('a', href=True):
    txt = a.text.strip()
    href = a['href']
    if any(k in txt.lower() or k in href.lower() for k in ['sme', 'emerge', 'equity', 'securities']):
        print(f"Text: '{txt}' -> Href: '{href}'")
