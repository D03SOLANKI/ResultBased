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
    'Referer': 'https://www.nseindia.com/',
}

print("=== 1. Investigating SME / Emerge Equities ===")
# Let's inspect SME_EQUITY_L.csv
import requests
r_sme_csv = requests.get("https://nsearchives.nseindia.com/content/equities/SME_EQUITY_L.csv", headers=headers)
print("SME_EQUITY_L.csv content:")
print(r_sme_csv.text)

# Let's check other potential SME files / endpoints
sme_candidates = [
    "https://nsearchives.nseindia.com/emerge/content/equities/EQUITY_L.csv",
    "https://nsearchives.nseindia.com/emerge/content/equities/SME_EQUITY_L.csv",
    "https://nsearchives.nseindia.com/emerge/corporates/content/emerge_equity_list.csv",
    "https://www.nseindia.com/api/live-analysis-emerge",
    "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20SME%20EMERGE",
]
for sc in sme_candidates:
    try:
        r = session.get(sc, headers=api_headers, timeout=5)
        print(f"Candidate {sc} -> Status: {r.status_code}, Length: {len(r.content)}")
    except Exception as e:
        print(f"Candidate {sc} -> {e}")

# Check all series in EQUITY_L.csv
r_eq = requests.get("https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv", headers=headers)
lines = r_eq.text.strip().splitlines()
header = [h.strip() for h in lines[0].split(',')]
series_idx = header.index("SERIES")
symbol_idx = header.index("SYMBOL")
series_counts = {}
for line in lines[1:]:
    parts = [p.strip() for p in line.split(',')]
    if len(parts) > series_idx:
        s = parts[series_idx]
        series_counts[s] = series_counts.get(s, 0) + 1
print(f"EQUITY_L.csv total symbols: {len(lines)-1}")
print(f"Series distribution in EQUITY_L.csv: {series_counts}")
# Notice series SM or ST are SME series! Let's check if SM / ST are in EQUITY_L.csv!
if 'SM' in series_counts:
    print(f"  -> Found 'SM' (SME Emerge) series with {series_counts['SM']} symbols directly in EQUITY_L.csv!")
if 'ST' in series_counts:
    print(f"  -> Found 'ST' (SME Emerge Trade for Trade) series with {series_counts['ST']} symbols directly in EQUITY_L.csv!")

print("\n=== 2. Investigating /api/event-calendar ===")
# Let's inspect the event calendar in detail
resp_cal = session.get("https://www.nseindia.com/api/event-calendar", headers=api_headers, timeout=10)
if resp_cal.status_code == 200:
    events = resp_cal.json()
    print(f"Total events in event-calendar: {len(events)}")
    purposes = {}
    dates = []
    for ev in events:
        p = ev.get('purpose', 'Unknown')
        purposes[p] = purposes.get(p, 0) + 1
        d = ev.get('date')
        if d:
            dates.append(d)
    print("Top purposes in event-calendar:")
    for p, c in sorted(purposes.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  - {p}: {c}")
    print(f"Date range in event-calendar: from {dates[0] if dates else 'N/A'} to {dates[-1] if dates else 'N/A'}")
    # Check if there are parameters for event-calendar (e.g. index)
    for p_test in ["?index=equities", "?index=sme"]:
        r_cal_p = session.get(f"https://www.nseindia.com/api/event-calendar{p_test}", headers=api_headers, timeout=10)
        print(f"event-calendar{p_test} -> Status: {r_cal_p.status_code}, Length: {len(r_cal_p.content)}, Items: {len(r_cal_p.json()) if r_cal_p.status_code==200 else 'err'}")

print("\n=== 3. Investigating /api/corporate-board-meetings parameters ===")
# Test date parameters and symbol parameters
today = datetime.now()
from_d = (today - timedelta(days=7)).strftime("%d-%m-%Y")
to_d = (today + timedelta(days=14)).strftime("%d-%m-%Y")

bm_urls = [
    f"/api/corporate-board-meetings?index=equities&from_date={from_d}&to_date={to_d}",
    f"/api/corporate-board-meetings?index=equities&symbol=RELIANCE",
    f"/api/corporate-board-meetings?index=equities&symbol=TCS",
    f"/api/corporate-board-meetings?index=sme&from_date={from_d}&to_date={to_d}",
]
for bm_u in bm_urls:
    r_bm = session.get(f"https://www.nseindia.com{bm_u}", headers=api_headers, timeout=10)
    print(f"{bm_u} -> Status: {r_bm.status_code}, Items: {len(r_bm.json()) if r_bm.status_code==200 and isinstance(r_bm.json(), list) else 'non-list'}")

print("\n=== 4. Investigating /api/corporate-announcements parameters ===")
ann_urls = [
    f"/api/corporate-announcements?index=equities&from_date={from_d}&to_date={to_d}",
    f"/api/corporate-announcements?index=equities&symbol=RELIANCE",
    f"/api/corporate-announcements?index=equities&symbol=INFY",
]
for ann_u in ann_urls:
    r_ann = session.get(f"https://www.nseindia.com{ann_u}", headers=api_headers, timeout=10)
    print(f"{ann_u} -> Status: {r_ann.status_code}, Items: {len(r_ann.json()) if r_ann.status_code==200 and isinstance(r_ann.json(), list) else 'non-list'}")

print("\n=== 5. Investigating /api/corporates-financial-results ===")
# Why was it empty? Let's check parameters
# Let's test with symbol or date range or period
fr_urls = [
    f"/api/corporates-financial-results?index=equities&symbol=RELIANCE",
    f"/api/corporates-financial-results?index=equities&from_date={from_d}&to_date={to_d}",
    f"/api/corporates-financial-results?index=equities&period=Quarterly",
    f"/api/corporates-financial-results?symbol=RELIANCE",
    f"/api/financial-results?symbol=RELIANCE",
    f"/api/corporates-financial-results-pit?index=equities",
    f"/api/results-calendar",
]
for fr_u in fr_urls:
    r_fr = session.get(f"https://www.nseindia.com{fr_u}", headers=api_headers, timeout=10)
    print(f"{fr_u} -> Status: {r_fr.status_code}, Length: {len(r_fr.content)}")
    if r_fr.status_code == 200:
        try:
            d = r_fr.json()
            if isinstance(d, list):
                print(f"   -> List of {len(d)} items")
            elif isinstance(d, dict):
                print(f"   -> Dict keys: {list(d.keys())}")
        except:
            print(f"   -> Text: {r_fr.text[:100]}")
