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

years = [2024, 2022, 2020, 2018, 2015, 2012, 2008]

print("--- NSE Historical Depth for RELIANCE (month of January) ---")
for yr in years:
    f_date = f"01-01-{yr}"
    t_date = f"31-01-{yr}"
    url_nse = f"https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=RELIANCE&from_date={f_date}&to_date={t_date}"
    try:
        r = s_nse.get(url_nse, headers=nse_headers, timeout=10)
        cnt = len(r.json()) if r.status_code == 200 and isinstance(r.json(), list) else 0
        print(f"NSE {yr}: Status {r.status_code}, Records: {cnt}")
    except Exception as e:
        print(f"NSE {yr}: Error {e}")

print("\n--- BSE Historical Depth for RELIANCE (500325) (month of January) ---")
for yr in years:
    f_date = f"{yr}0101"
    t_date = f"{yr}0131"
    url_bse = f"https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w?pageno=1&strCat=-1&strPrevDate={f_date}&strScrip=500325&strSearch=P&strToDate={t_date}&strType=C&subcategory="
    try:
        r = s_bse.get(url_bse, headers=bse_headers, timeout=10)
        cnt = 0
        if r.status_code == 200:
            js = r.json()
            cnt = len(js.get("Table", []))
        print(f"BSE {yr}: Status {r.status_code}, Records: {cnt}")
    except Exception as e:
        print(f"BSE {yr}: Error {e}")
