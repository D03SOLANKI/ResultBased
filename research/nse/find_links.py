import re
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
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/',
}

r_page = session.get("https://www.nseindia.com/market-data/securities-available-for-trading", headers=api_headers, timeout=10)
print(f"Securities page status: {r_page.status_code}")
if r_page.status_code == 200:
    # Find all csv and xls links
    csv_links = re.findall(r'href=[\'"]([^\'"]+\.(?:csv|xlsx|xls|pdf))[\'"]', r_page.text, re.IGNORECASE)
    print("Links on securities page:")
    for l in set(csv_links):
        print("  -", l)

# Let's also check the emerge page
r_emerge_page = session.get("https://www.nseindia.com/emerge", headers=api_headers, timeout=10)
print(f"Emerge page status: {r_emerge_page.status_code}")
if r_emerge_page.status_code == 200:
    csv_links2 = re.findall(r'href=[\'"]([^\'"]+\.(?:csv|xlsx|xls|pdf))[\'"]', r_emerge_page.text, re.IGNORECASE)
    print("Links on emerge page:")
    for l in set(csv_links2)[:10]:
        print("  -", l)
