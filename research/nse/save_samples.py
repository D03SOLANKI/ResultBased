import os
import json
from curl_cffi import requests as cffi_requests

samples_dir = r"c:\DEV\FFS\ResultBased Strategy\research\nse\samples"
os.makedirs(samples_dir, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
}

session = cffi_requests.Session(impersonate="chrome120")
# Visit homepage to establish proper cookies
session.get("https://www.nseindia.com", headers=headers, timeout=10)

targets = [
    {
        "url": "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv",
        "filename": "EQUITY_L.csv",
        "is_json": False,
        "desc": "Mainboard Equity List (CSV)"
    },
    {
        "url": "https://nsearchives.nseindia.com/emerge/corporates/content/SME_EQUITY_L.csv",
        "filename": "SME_EQUITY_L.csv",
        "is_json": False,
        "desc": "SME / Emerge Equity List (CSV)"
    },
    {
        "url": "https://nsearchives.nseindia.com/content/equities/List_of_Active_Securities_CM_DEBT.csv",
        "filename": "List_of_Active_Securities_CM_DEBT.csv",
        "is_json": False,
        "desc": "Master List of Active Securities CM & Debt (CSV)"
    },
    {
        "url": "https://www.nseindia.com/api/live-analysis-emerge",
        "filename": "live_analysis_emerge.json",
        "is_json": True,
        "desc": "SME / Emerge Live Market Data"
    },
    {
        "url": "https://www.nseindia.com/api/event-calendar",
        "filename": "event_calendar.json",
        "is_json": True,
        "desc": "Forthcoming Event Calendar (All Equities)"
    },
    {
        "url": "https://www.nseindia.com/api/event-calendar?index=sme",
        "filename": "event_calendar_sme.json",
        "is_json": True,
        "desc": "Forthcoming Event Calendar (SME)"
    },
    {
        "url": "https://www.nseindia.com/api/corporate-board-meetings?index=equities",
        "filename": "corporate_board_meetings_equities.json",
        "is_json": True,
        "desc": "Board Meeting Announcements (Mainboard Equities default 20 items)"
    },
    {
        "url": "https://www.nseindia.com/api/corporate-board-meetings?index=sme",
        "filename": "corporate_board_meetings_sme.json",
        "is_json": True,
        "desc": "Board Meeting Announcements (SME Equities default 20 items)"
    },
    {
        "url": "https://www.nseindia.com/api/corporate-board-meetings?index=equities&symbol=RELIANCE",
        "filename": "corporate_board_meetings_reliance.json",
        "is_json": True,
        "desc": "Board Meeting Announcements for specific symbol (RELIANCE)"
    },
    {
        "url": "https://www.nseindia.com/api/corporate-announcements?index=equities",
        "filename": "corporate_announcements_equities.json",
        "is_json": True,
        "desc": "Corporate Announcements (Mainboard Equities default 20 items)"
    },
    {
        "url": "https://www.nseindia.com/api/corporate-announcements?index=sme",
        "filename": "corporate_announcements_sme.json",
        "is_json": True,
        "desc": "Corporate Announcements (SME Equities default 20 items)"
    },
    {
        "url": "https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=RELIANCE",
        "filename": "corporate_announcements_reliance.json",
        "is_json": True,
        "desc": "Corporate Announcements for specific symbol (RELIANCE)"
    },
    {
        "url": "https://www.nseindia.com/api/corporates-financial-results?index=equities&period=Quarterly",
        "filename": "corporates_financial_results_quarterly.json",
        "is_json": True,
        "desc": "Financial Results Filings (Equities, Quarterly)"
    },
    {
        "url": "https://www.nseindia.com/api/corporates-financial-results?index=sme&period=Quarterly",
        "filename": "corporates_financial_results_sme_quarterly.json",
        "is_json": True,
        "desc": "Financial Results Filings (SME, Quarterly)"
    },
    {
        "url": "https://www.nseindia.com/api/corporates-financial-results?index=equities&symbol=RELIANCE",
        "filename": "corporates_financial_results_reliance.json",
        "is_json": True,
        "desc": "Financial Results Filings for specific symbol (RELIANCE)"
    },
]

for t in targets:
    out_path = os.path.join(samples_dir, t["filename"])
    print(f"Fetching {t['desc']} -> {t['url']}...", flush=True)
    try:
        r = session.get(t["url"], headers=headers, timeout=20)
        if r.status_code == 200:
            with open(out_path, "wb") as f:
                f.write(r.content)
            print(f"  [OK] Saved {os.path.basename(out_path)} ({len(r.content)} bytes)")
        else:
            print(f"  [FAIL] Status {r.status_code}")
    except Exception as e:
        print(f"  [ERROR] {e}")

print("All sample downloads completed.")
