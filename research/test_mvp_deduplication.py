import json
import csv
import pandas as pd
from datetime import datetime

def load_data():
    print("Loading datasets...")
    # 1. NSE Master
    nse_master = {}
    with open("research/nse/samples/EQUITY_L.csv", mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            sym = row.get("SYMBOL", "").strip()
            isin = row.get(" ISIN NUMBER", "").strip()
            name = row.get("NAME OF COMPANY", "").strip()
            series = row.get(" SERIES", "").strip()
            if isin:
                nse_master[isin] = {"symbol": sym, "name": name, "series": series, "segment": "Mainboard"}

    # NSE SME Master
    with open("research/nse/samples/SME_EQUITY_L.csv", mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            sym = row.get("SYMBOL", "").strip()
            isin = row.get("ISIN_NUMBER", "").strip()
            name = row.get("NAME_OF_COMPANY", "").strip()
            series = row.get("SERIES", "").strip()
            if isin:
                nse_master[isin] = {"symbol": sym, "name": name, "series": series, "segment": "SME"}

    # 2. BSE Master
    bse_master = {}
    with open("research/bse/samples/ListofScripData.json", mode="r", encoding="utf-8") as f:
        data = json.load(f)
        for row in data:
            isin = row.get("ISIN_NUMBER", "").strip()
            code = row.get("SCRIP_CD", "").strip()
            name = row.get("Scrip_Name", "").strip()
            mcap = row.get("Mktcap", "")
            group = row.get("GROUP", "").strip()
            seg = "SME" if group in ["M", "MT"] else "Mainboard"
            if isin and isin != "NA":
                bse_master[isin] = {"code": code, "name": name, "mcap": mcap, "group": group, "segment": seg}

    # 3. AMFI Classification
    amfi_df = pd.read_excel("research/infra/samples/amfi_market_cap_30Jun2026.xlsx", sheet_name="FINAL", skiprows=1)
    amfi_map = {}
    for _, row in amfi_df.iterrows():
        isin = str(row.get("ISIN", "")).strip()
        cat = str(row.get("Categorization as per SEBI Circular Oct 6 2017", "")).strip()
        rank = row.get("Sr. No.", None)
        avg_mcap = row.get("Average of All Exchanges (Rs. Cr.)", None)
        if isin and isin != "nan":
            amfi_map[isin] = {"category": cat, "rank": rank, "avg_mcap": avg_mcap}

    print(f"Loaded: NSE {len(nse_master)} scrips, BSE {len(bse_master)} scrips, AMFI {len(amfi_map)} mappings.")

    # 4. NSE Calendar
    with open("research/nse/samples/event_calendar.json", mode="r", encoding="utf-8") as f:
        nse_cal = json.load(f)

    # 5. BSE Calendar
    with open("research/bse/samples/Corpforthresults.json", mode="r", encoding="utf-8") as f:
        bse_cal = json.load(f)

    print(f"Loaded upcoming events: NSE {len(nse_cal)}, BSE {len(bse_cal)}")
    return nse_master, bse_master, amfi_map, nse_cal, bse_cal

def normalize_date(d_str):
    if not d_str:
        return None
    d_str = d_str.strip()
    for fmt in ["%d-%b-%Y", "%d %b %Y", "%d-%m-%Y", "%Y-%m-%d"]:
        try:
            return datetime.strptime(d_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    return d_str

def match_and_deduplicate():
    nse_master, bse_master, amfi_map, nse_cal, bse_cal = load_data()

    # Invert NSE master: symbol -> isin
    sym_to_isin = {v["symbol"]: k for k, v in nse_master.items()}
    # Invert BSE master: code -> isin
    code_to_isin = {v["code"]: k for k, v in bse_master.items()}

    # Unified events keyed by (isin, normalized_date)
    unified_events = {}

    # Process NSE Events
    for ev in nse_cal:
        sym = ev.get("symbol", "").strip()
        purpose = ev.get("purpose", "")
        # Filter for financial results
        if "Financial Results" not in purpose:
            continue
        date_str = ev.get("date", "")
        norm_date = normalize_date(date_str)
        isin = sym_to_isin.get(sym)
        if not isin:
            continue

        key = (isin, norm_date)
        unified_events[key] = {
            "isin": isin,
            "company_name": ev.get("company", ""),
            "nse_symbol": sym,
            "bse_code": bse_master.get(isin, {}).get("code"),
            "board_meeting_date": norm_date,
            "purpose": purpose,
            "desc": ev.get("bm_desc", ""),
            "sources": ["NSE"],
            "verification_status": "Verified (NSE)"
        }

    # Process BSE Events
    for ev in bse_cal:
        code = str(ev.get("scrip_Code", "")).strip()
        date_str = ev.get("meeting_date", "")
        norm_date = normalize_date(date_str)
        isin = code_to_isin.get(code)
        if not isin:
            continue

        key = (isin, norm_date)
        if key in unified_events:
            unified_events[key]["sources"].append("BSE")
            unified_events[key]["bse_code"] = code
            unified_events[key]["verification_status"] = "Dual-Exchange Verified"
        else:
            unified_events[key] = {
                "isin": isin,
                "company_name": ev.get("Long_Name", "") or ev.get("short_name", ""),
                "nse_symbol": nse_master.get(isin, {}).get("symbol"),
                "bse_code": code,
                "board_meeting_date": norm_date,
                "purpose": "Financial Results",
                "desc": "Consideration of Financial Results",
                "sources": ["BSE"],
                "verification_status": "Verified (BSE)"
            }

    print(f"Total Unified Unique (ISIN, Date) Result Events: {len(unified_events)}")

    # Enrich with Market Cap & Category
    enriched = []
    for (isin, mdate), ev in unified_events.items():
        # AMFI classification
        amfi_info = amfi_map.get(isin)
        bse_info = bse_master.get(isin)
        mcap_val = None
        category = "Micro/Small Cap"

        if amfi_info:
            category = amfi_info["category"]
            mcap_val = amfi_info["avg_mcap"]
        elif bse_info and bse_info.get("mcap"):
            try:
                mcap_val = float(bse_info["mcap"])
                if mcap_val > 100000:
                    category = "Large Cap"
                elif mcap_val > 30000:
                    category = "Mid Cap"
                else:
                    category = "Small/Micro Cap"
            except:
                pass
        elif isin in nse_master and nse_master[isin]["segment"] == "SME":
            category = "SME"

        ev["category"] = category
        ev["market_cap_cr"] = round(mcap_val, 2) if mcap_val else None
        enriched.append(ev)

    # Filter Today (2026-11-02) and Tomorrow (2026-11-03)
    today_str = "2026-11-02"
    tomorrow_str = "2026-11-03"

    today_events = [e for e in enriched if e["board_meeting_date"] == today_str]
    tomorrow_events = [e for e in enriched if e["board_meeting_date"] == tomorrow_str]

    print(f"\nEvents for Today ({today_str}): {len(today_events)}")
    print(f"Events for Tomorrow ({tomorrow_str}): {len(tomorrow_events)}")

    # Print Sample Report Output
    print("\n" + "="*70)
    print("SAMPLE VERIFIED REPORT OUTPUT (BASED ON LIVE EXCHANGE DATA):")
    print("="*70)
    print(f"UPCOMING FINANCIAL RESULTS REPORT")
    print(f"Date: 02 November 2026 | Generated: 08:00 AM IST")
    print(f"Total Companies Scheduled Today: {len(today_events)}")
    print(f"Total Companies Scheduled Tomorrow: {len(tomorrow_events)}")
    print("\nTODAY'S RESULTS (Top 5 Samples):")
    for i, e in enumerate(today_events[:5], 1):
        print(f"\n{i}. {e['company_name']}")
        print(f"   ISIN: {e['isin']} | NSE: {e['nse_symbol'] or 'N/A'} | BSE: {e['bse_code'] or 'N/A'}")
        print(f"   Category: {e['category']} | MCap: INR {e['market_cap_cr'] or 'N/A'} Cr")
        print(f"   Meeting Date: {e['board_meeting_date']} | Status: {e['verification_status']}")
        print(f"   Sources: {', '.join(e['sources'])}")

    print("\nTOMORROW'S RESULTS (Top 5 Samples):")
    for i, e in enumerate(tomorrow_events[:5], 1):
        print(f"\n{i}. {e['company_name']}")
        print(f"   ISIN: {e['isin']} | NSE: {e['nse_symbol'] or 'N/A'} | BSE: {e['bse_code'] or 'N/A'}")
        print(f"   Category: {e['category']} | MCap: INR {e['market_cap_cr'] or 'N/A'} Cr")
        print(f"   Meeting Date: {e['board_meeting_date']} | Status: {e['verification_status']}")
        print(f"   Sources: {', '.join(e['sources'])}")

if __name__ == "__main__":
    match_and_deduplicate()
