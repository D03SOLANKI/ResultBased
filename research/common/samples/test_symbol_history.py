from curl_cffi import requests
from datetime import datetime, timedelta

# 1. Test NSE Symbol-specific historical query
print("=== Testing NSE Symbol Specific Query ===")
nse_headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.nseindia.com/companies-listing/corporate-filings-announcements"
}
s_nse = requests.Session(impersonate="chrome120")
s_nse.get("https://www.nseindia.com", headers=nse_headers)

for symbol in ["TCS", "INFY", "RELIANCE"]:
    url = f"https://www.nseindia.com/api/corporate-announcements?index=equities&symbol={symbol}&from_date=01-01-2023&to_date=31-12-2023"
    r = s_nse.get(url, headers=nse_headers, timeout=15)
    print(f"NSE {symbol} (Full Year 2023): Status {r.status_code}, Records: {len(r.json()) if r.status_code == 200 else 'N/A'}")

# 2. Test BSE Announcements headers and exact endpoint
print("\n=== Testing BSE Announcements Endpoints ===")
bse_headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://www.bseindia.com/",
    "Origin": "https://www.bseindia.com"
}
s_bse = requests.Session(impersonate="chrome120")

# First let's check what headers work for api.bseindia.com
# Test ScripData again to see what headers worked before
r1 = s_bse.get("https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w?Group=&Scripcode=&industry=&segment=Equity&status=Active", headers=bse_headers, timeout=10)
print("BSE ScripData status:", r1.status_code)

# Let's test AnnGetData or AnnSubCategoryGetData with scripcode
test_bse_urls = [
    "https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w?pageno=1&strCat=-1&strPrevDate=20240101&strScrip=500325&strSearch=P&strToDate=20240131&strType=C&subcategory=",
    "https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w?pageno=1&strCat=-1&strPrevDate=20240101&strScrip=500325&strSearch=P&strToDate=20240131&strType=C",
    "https://api.bseindia.com/BseIndiaAPI/api/CorporateAnnouncement/w?scripcode=500325",
    "https://api.bseindia.com/BseIndiaAPI/api/BoardMeeting/w?scripcode=500325&fromdate=20240101&todate=20241231"
]

for u in test_bse_urls:
    r = s_bse.get(u, headers=bse_headers, timeout=10)
    print(f"URL: {u.split('?')[0]}?{u.split('?')[1][:40]}... -> Status {r.status_code}, Length {len(r.content)}")
    if r.status_code == 200:
        print("Response sample:", r.text[:200])
