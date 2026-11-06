from curl_cffi import requests

nse_headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Referer": "https://www.nseindia.com/companies-listing/corporate-filings-announcements"
}
s_nse = requests.Session(impersonate="chrome120")
s_nse.get("https://www.nseindia.com", headers=nse_headers)

bse_headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://www.bseindia.com/",
}
s_bse = requests.Session(impersonate="chrome120")

# Test NSE Board Meetings historical
print("--- NSE Board Meetings for RELIANCE ---")
for yr in [2024, 2022, 2020, 2018]:
    url = f"https://www.nseindia.com/api/corporate-board-meetings?index=equities&symbol=RELIANCE&from_date=01-01-{yr}&to_date=31-12-{yr}"
    try:
        r = s_nse.get(url, headers=nse_headers, timeout=10)
        cnt = len(r.json()) if r.status_code == 200 and isinstance(r.json(), list) else "err"
        print(f"NSE BM {yr}: Status {r.status_code}, Records: {cnt}")
    except Exception as e:
        print(f"NSE BM {yr}: Error {e}")

print("--- BSE Board Meetings for RELIANCE (500325) ---")
for yr in [2024, 2022, 2020, 2018]:
    url = f"https://api.bseindia.com/BseIndiaAPI/api/BoardMeeting/w?scripcode=500325&fromdate={yr}0101&todate={yr}1231"
    try:
        r = s_bse.get(url, headers=bse_headers, timeout=10)
        cnt = len(r.json().get("Table", [])) if r.status_code == 200 else "err"
        print(f"BSE BM {yr}: Status {r.status_code}, Records: {cnt}")
    except Exception as e:
        print(f"BSE BM {yr}: Error {e}")
