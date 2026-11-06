import json
from curl_cffi import requests
from datetime import datetime, timedelta

# Test NSE Announcements and Board Meetings
print("Testing NSE endpoints...")

nse_headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.nseindia.com/companies-listing/corporate-filings-announcements"
}

session_nse = requests.Session(impersonate="chrome120")
# Prime NSE cookies by visiting homepage first
try:
    r_home = session_nse.get("https://www.nseindia.com", headers=nse_headers, timeout=10)
    print("NSE home session status:", r_home.status_code)
except Exception as e:
    print("NSE home error:", e)

# Test corporate-announcements
today = datetime.now()
d_to = today.strftime("%d-%m-%Y")

test_windows = [
    ("7 Days", (today - timedelta(days=7)).strftime("%d-%m-%Y"), d_to),
    ("1 Month", (today - timedelta(days=30)).strftime("%d-%m-%Y"), d_to),
    ("3 Months", (today - timedelta(days=90)).strftime("%d-%m-%Y"), d_to),
    ("6 Months", (today - timedelta(days=180)).strftime("%d-%m-%Y"), d_to),
    ("1 Year", (today - timedelta(days=365)).strftime("%d-%m-%Y"), d_to),
    ("Historical 2024", "01-01-2024", "31-01-2024")
]

for label, f_date, t_date in test_windows:
    url = f"https://www.nseindia.com/api/corporate-announcements?index=equities&from_date={f_date}&to_date={t_date}"
    try:
        r = session_nse.get(url, headers=nse_headers, timeout=10)
        status = r.status_code
        length = len(r.content)
        data_count = 0
        if status == 200:
            try:
                js = r.json()
                if isinstance(js, list):
                    data_count = len(js)
                elif isinstance(js, dict) and "data" in js:
                    data_count = len(js["data"])
            except:
                pass
        print(f"NSE Announcements [{label}] ({f_date} to {t_date}): Status {status}, Length {length}, Records: {data_count}")
    except Exception as e:
        print(f"NSE Announcements [{label}] Error: {e}")

# Test board meetings
url_bm = f"https://www.nseindia.com/api/corporate-board-meetings?index=equities&from_date={(today - timedelta(days=30)).strftime('%d-%m-%Y')}&to_date={d_to}"
try:
    r_bm = session_nse.get(url_bm, headers=nse_headers, timeout=10)
    print("NSE Board Meetings (30d): Status", r_bm.status_code, "Length", len(r_bm.content))
except Exception as e:
    print("NSE Board Meetings Error:", e)

print("\n--- Testing BSE Endpoints ---")
bse_headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://www.bseindia.com/corporates/ann.html"
}

session_bse = requests.Session(impersonate="chrome120")

# BSE AnnSubCategoryGetData
# date format in BSE API: YYYYMMDD
d_bse_to = today.strftime("%Y%m%d")
bse_windows = [
    ("7 Days", (today - timedelta(days=7)).strftime("%Y%m%d"), d_bse_to),
    ("1 Month", (today - timedelta(days=30)).strftime("%Y%m%d"), d_bse_to),
    ("3 Months", (today - timedelta(days=90)).strftime("%Y%m%d"), d_bse_to),
    ("6 Months", (today - timedelta(days=180)).strftime("%Y%m%d"), d_bse_to),
    ("Historical 2024 (1 mo)", "20240101", "20240131"),
    ("Historical 2020 (1 mo)", "20200101", "20200131")
]

for label, f_date, t_date in bse_windows:
    # strType: 'C' (Company), strSearch: 'P' (Period)
    url_bse = f"https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w?pageno=1&strCat=-1&strPrevDate={f_date}&strScrip=&strSearch=P&strToDate={t_date}&strType=C&subcategory="
    try:
        r = session_bse.get(url_bse, headers=bse_headers, timeout=10)
        status = r.status_code
        length = len(r.content)
        cnt = "N/A"
        if status == 200:
            try:
                js = r.json()
                if "Table" in js:
                    cnt = len(js["Table"])
                elif "TotalPageCnt" in js:
                    cnt = f"TotalPageCnt={js['TotalPageCnt']}"
            except:
                pass
        print(f"BSE Announcements [{label}] ({f_date} to {t_date}): Status {status}, Length {length}, Records: {cnt}")
    except Exception as e:
        print(f"BSE Announcements [{label}] Error: {e}")

# BSE Board Meeting endpoint
url_bse_bm = f"https://api.bseindia.com/BseIndiaAPI/api/BoardMeeting/w?scripcode=&fromdate={(today - timedelta(days=30)).strftime('%Y%m%d')}&todate={d_bse_to}"
try:
    r_bbm = session_bse.get(url_bse_bm, headers=bse_headers, timeout=10)
    print("BSE Board Meeting status:", r_bbm.status_code, "Length:", len(r_bbm.content))
except Exception as e:
    print("BSE Board Meeting error:", e)
