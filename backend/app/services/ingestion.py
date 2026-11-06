import os
import csv
import json
import hashlib
import re
from datetime import datetime
import pandas as pd
from backend.app.database import get_db, init_db

RESEARCH_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "research"))

def parse_date(date_str):
    if not date_str:
        return None
    date_str = str(date_str).strip()
    for fmt in ["%d-%b-%Y", "%d %b %Y", "%d-%m-%Y", "%Y-%m-%d", "%d/%m/%Y"]:
        try:
            return datetime.strptime(date_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    return None

def generate_event_id(isin, meeting_date, purpose=""):
    raw = f"{isin}_{meeting_date}_{purpose[:20]}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:16]

def extract_result_type(desc, purpose):
    combined = f"{purpose} {desc}".lower()
    is_audited = "audited" in combined and "unaudited" not in combined
    is_consolidated = "consolidated" in combined
    is_standalone = "standalone" in combined
    
    parts = []
    if is_audited:
        parts.append("Audited")
    else:
        parts.append("Unaudited")
        
    if is_consolidated and is_standalone:
        parts.append("Standalone & Consolidated")
    elif is_consolidated:
        parts.append("Consolidated")
    elif is_standalone:
        parts.append("Standalone")
        
    return " ".join(parts) if parts else "Unaudited Results"

def classify_financial_result(desc, purpose):
    """
    STRICT FILTER: ONLY tracks actual Financial Results & Performance announcements:
    1. Monthly Financial Results / Performance Updates
    2. Quarterly Results (Q1, Q2, Q3, Q4)
    3. Half-Yearly Results (6-month performance)
    4. Annual Financial Results (full-year performance)

    EXCLUDES:
    - Pure dividend declarations without results
    - Bonus shares
    - Stock splits
    - Acquisitions / Mergers
    - Order wins
    - Ordinary/General corporate meetings
    """
    combined = f"{purpose} {desc}".lower()

    # Must contain financial results keywords
    has_financial_signal = any(k in combined for k in [
        "result", "financial", "performance update", "sales update",
        "unaudited", "audited", "quarter ended", "half year", "half-year", "annual results"
    ])
    if not has_financial_signal:
        return None

    # Exclude if it's explicitly non-results
    if any(k in combined for k in [
        "only dividend", "consider dividend only", "allotment of shares",
        "preferential issue only", "esop", "alteration of memorandum"
    ]):
        return None

    # 1. Monthly Financial Results / Performance Updates
    if "monthly" in combined or "sales volume" in combined or "monthly performance" in combined:
        return (
            "Monthly Performance Update",
            "Monthly Performance / Business Update",
            "FY2026-27",
            "Performance Update"
        )

    # 2. Half-Yearly Results (6-month financial performance)
    if any(k in combined for k in ["half year", "half-year", "h1", "six month", "half yearly"]):
        return (
            "Half-Yearly Results",
            "Half-Yearly Financial Results (Ended 30-Sep-2026)",
            "FY2026-27",
            extract_result_type(desc, purpose)
        )

    # 3. Annual Financial Results (Full-Year Performance)
    if "annual audited" in combined or ("annual" in combined and "quarter" not in combined) or ("year ended" in combined and "half" not in combined):
        return (
            "Annual Financial Results",
            "Annual Audited Financial Results (FY26)",
            "FY2025-26",
            extract_result_type(desc, purpose)
        )

    # 4. Quarterly Results (Q1, Q2, Q3, Q4)
    if "sep" in combined or "september 30" in combined or "30-sep" in combined or "second quarter" in combined or "q2" in combined:
        return (
            "Quarterly Results",
            "Q2 Financial Results (Ended 30-Sep-2026)",
            "FY2026-27",
            extract_result_type(desc, purpose)
        )
    if "dec" in combined or "december 31" in combined or "31-dec" in combined or "third quarter" in combined or "q3" in combined:
        return (
            "Quarterly Results",
            "Q3 Financial Results (Ended 31-Dec-2026)",
            "FY2026-27",
            extract_result_type(desc, purpose)
        )
    if "jun" in combined or "june 30" in combined or "30-jun" in combined or "first quarter" in combined or "q1" in combined:
        return (
            "Quarterly Results",
            "Q1 Financial Results (Ended 30-Jun-2026)",
            "FY2026-27",
            extract_result_type(desc, purpose)
        )
    if "mar" in combined or "march 31" in combined or "31-mar" in combined or "fourth quarter" in combined or "q4" in combined:
        return (
            "Quarterly Results",
            "Q4 Financial Results (Ended 31-Mar-2026)",
            "FY2025-26",
            extract_result_type(desc, purpose)
        )

    # General Quarterly Result
    if "quarter" in combined or "financial results" in combined:
        return (
            "Quarterly Results",
            "Quarterly Financial Results",
            "FY2026-27",
            extract_result_type(desc, purpose)
        )

    return None

def sync_company_master():
    print("-> Syncing Company Master Database...")
    init_db()
    
    companies = {}  # isin -> dict

    # 1. NSE Mainboard
    nse_csv = os.path.join(RESEARCH_DIR, "nse", "samples", "EQUITY_L.csv")
    if os.path.exists(nse_csv):
        with open(nse_csv, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                sym = row.get("SYMBOL", "").strip()
                isin = row.get(" ISIN NUMBER", "").strip() or row.get("ISIN NUMBER", "").strip()
                name = row.get("NAME OF COMPANY", "").strip()
                series = row.get(" SERIES", "").strip() or row.get("SERIES", "").strip()
                if isin and len(isin) == 12:
                    companies[isin] = {
                        "isin": isin,
                        "company_name": name,
                        "nse_symbol": sym,
                        "nse_series": series,
                        "bse_code": None,
                        "bse_scrip_id": None,
                        "bse_group": None,
                        "listing_segment": "Mainboard",
                        "market_cap_cr": None,
                        "market_cap_category": "Small/Micro Cap",
                        "amfi_rank": None,
                        "industry": None,
                        "is_dual_listed": 0
                    }

    # 2. NSE SME Emerge
    sme_csv = os.path.join(RESEARCH_DIR, "nse", "samples", "SME_EQUITY_L.csv")
    if os.path.exists(sme_csv):
        with open(sme_csv, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                sym = row.get("SYMBOL", "").strip()
                isin = row.get("ISIN_NUMBER", "").strip()
                name = row.get("NAME_OF_COMPANY", "").strip()
                series = row.get("SERIES", "").strip()
                if isin and len(isin) == 12:
                    companies[isin] = {
                        "isin": isin,
                        "company_name": name,
                        "nse_symbol": sym,
                        "nse_series": series,
                        "bse_code": None,
                        "bse_scrip_id": None,
                        "bse_group": None,
                        "listing_segment": "SME",
                        "market_cap_cr": None,
                        "market_cap_category": "SME",
                        "amfi_rank": None,
                        "industry": None,
                        "is_dual_listed": 0
                    }

    # 3. BSE Master
    bse_json = os.path.join(RESEARCH_DIR, "bse", "samples", "ListofScripData.json")
    if os.path.exists(bse_json):
        with open(bse_json, mode="r", encoding="utf-8") as f:
            bse_data = json.load(f)
            for row in bse_data:
                isin = str(row.get("ISIN_NUMBER", "")).strip()
                code = str(row.get("SCRIP_CD", "")).strip()
                scrip_id = str(row.get("scrip_id", "")).strip()
                name = str(row.get("Scrip_Name", "")).strip()
                group = str(row.get("GROUP", "")).strip()
                mcap = row.get("Mktcap")
                seg = "SME" if group in ["M", "MT"] else "Mainboard"
                mcap_flt = None
                try:
                    if mcap:
                        mcap_flt = round(float(mcap), 2)
                except:
                    pass

                if isin and len(isin) == 12:
                    if isin in companies:
                        # Dual-listed
                        companies[isin]["bse_code"] = code
                        companies[isin]["bse_scrip_id"] = scrip_id
                        companies[isin]["bse_group"] = group
                        companies[isin]["is_dual_listed"] = 1
                        if mcap_flt and not companies[isin]["market_cap_cr"]:
                            companies[isin]["market_cap_cr"] = mcap_flt
                    else:
                        # BSE-only
                        companies[isin] = {
                            "isin": isin,
                            "company_name": name,
                            "nse_symbol": None,
                            "nse_series": None,
                            "bse_code": code,
                            "bse_scrip_id": scrip_id,
                            "bse_group": group,
                            "listing_segment": seg,
                            "market_cap_cr": mcap_flt,
                            "market_cap_category": "SME" if seg == "SME" else "Small/Micro Cap",
                            "amfi_rank": None,
                            "industry": row.get("INDUSTRY"),
                            "is_dual_listed": 0
                        }

    # 4. AMFI Categorization Enrichment
    amfi_file = os.path.join(RESEARCH_DIR, "infra", "samples", "amfi_market_cap_30Jun2026.xlsx")
    if os.path.exists(amfi_file):
        try:
            amfi_df = pd.read_excel(amfi_file, sheet_name="FINAL", skiprows=1)
            for _, row in amfi_df.iterrows():
                isin = str(row.get("ISIN", "")).strip()
                # Check potential column header variations
                cat = str(row.get("Categorization as per SEBI Circular dated Oct 6, 2017", row.get("Categorization as per SEBI Circular Oct 6 2017", ""))).strip()
                rank = row.get("Sr. No.")
                avg_mcap = row.get("Average of All Exchanges (Rs. Cr.)")
                if pd.isna(avg_mcap) or not avg_mcap:
                    # fallback to max of BSE/NSE avg
                    bse_avg = row.get("BSE 6 month Avg Total Market Cap in (Rs. Crs.)")
                    nse_avg = row.get("NSE 6 month Avg Total Market Cap (Rs. Crs.)")
                    vals = [float(v) for v in [bse_avg, nse_avg] if pd.notna(v) and str(v).replace('.', '', 1).isdigit()]
                    if vals:
                        avg_mcap = max(vals)
                
                if isin in companies:
                    if pd.notna(rank):
                        r_int = int(rank)
                        companies[isin]["amfi_rank"] = r_int
                        if r_int <= 100:
                            companies[isin]["market_cap_category"] = "Large Cap"
                        elif r_int <= 250:
                            companies[isin]["market_cap_category"] = "Mid Cap"
                        elif r_int <= 500:
                            companies[isin]["market_cap_category"] = "Small Cap"
                        else:
                            companies[isin]["market_cap_category"] = "Micro Cap"
                    elif cat and cat.lower() != "nan" and cat.strip():
                        companies[isin]["market_cap_category"] = cat.strip()

                    if pd.notna(avg_mcap) and float(avg_mcap) > 0:
                        companies[isin]["market_cap_cr"] = round(float(avg_mcap), 2)
        except Exception as e:
            print("Warning: AMFI enrichment error:", e)

    # Market-Cap Category Sanity Check based on Cr threshold and SME segment
    for isin, c in companies.items():
        if c["listing_segment"] == "SME":
            c["market_cap_category"] = "SME"
        elif not c.get("market_cap_category") or c["market_cap_category"] in ["Small/Micro Cap", "Unclassified"]:
            mcap = c.get("market_cap_cr")
            if mcap:
                if mcap >= 106000:
                    c["market_cap_category"] = "Large Cap"
                elif mcap >= 33000:
                    c["market_cap_category"] = "Mid Cap"
                elif mcap >= 12000:
                    c["market_cap_category"] = "Small Cap"
                else:
                    c["market_cap_category"] = "Micro Cap"
            else:
                c["market_cap_category"] = "Micro Cap"

    # Insert into DB
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM company_master")
        records = [
            (
                c["isin"], c["company_name"], c["nse_symbol"], c["nse_series"],
                c["bse_code"], c["bse_scrip_id"], c["bse_group"], c["listing_segment"],
                c["market_cap_cr"], c["market_cap_category"], c["amfi_rank"],
                c["industry"], c["is_dual_listed"]
            )
            for c in companies.values()
        ]
        cursor.executemany("""
        INSERT INTO company_master (
            isin, company_name, nse_symbol, nse_series, bse_code, bse_scrip_id,
            bse_group, listing_segment, market_cap_cr, market_cap_category,
            amfi_rank, industry, is_dual_listed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, records)

    print(f"-> Successfully synced {len(companies)} companies in Company Master.")
    return len(companies)

def sync_results_calendar():
    print("-> Syncing STRICT Financial Results Calendar from NSE and BSE...")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT isin, company_name, nse_symbol, bse_code, market_cap_cr, market_cap_category FROM company_master")
        companies = {r["isin"]: dict(r) for r in cursor.fetchall()}
        
        sym_to_isin = {c["nse_symbol"]: c["isin"] for c in companies.values() if c["nse_symbol"]}
        code_to_isin = {c["bse_code"]: c["isin"] for c in companies.values() if c["bse_code"]}

    events = {}  # (isin, meeting_date) -> dict

    # 1. Ingest NSE Calendar (Strict Filter: Financial Results & Performance Only)
    nse_cal_path = os.path.join(RESEARCH_DIR, "nse", "samples", "event_calendar.json")
    if os.path.exists(nse_cal_path):
        with open(nse_cal_path, mode="r", encoding="utf-8") as f:
            nse_items = json.load(f)
            for item in nse_items:
                sym = item.get("symbol", "").strip()
                purpose = item.get("purpose", "")
                desc = item.get("bm_desc", "")
                
                # Apply strict financial results classification
                classification = classify_financial_result(desc, purpose)
                if not classification:
                    continue
                
                category, period, f_year, r_type = classification

                date_str = item.get("date", "")
                m_date = parse_date(date_str)
                if not m_date:
                    continue
                isin = sym_to_isin.get(sym)
                if not isin:
                    continue

                event_id = generate_event_id(isin, m_date, period)
                comp = companies.get(isin, {})
                events[(isin, m_date)] = {
                    "event_id": event_id,
                    "isin": isin,
                    "company_name": comp.get("company_name", item.get("company", "")),
                    "nse_symbol": sym,
                    "bse_code": comp.get("bse_code"),
                    "result_category": category,
                    "financial_period": period,
                    "financial_year": f_year,
                    "result_type": r_type,
                    "board_meeting_date": m_date,
                    "expected_results_date": m_date,
                    "actual_results_date": None,
                    "actual_results_time": None,
                    "announcement_date": m_date,
                    "announcement_time": None,
                    "announcement_source": "NSE Results Calendar",
                    "nse_source_url": "https://www.nseindia.com/companies-listing/corporate-filings-event-calendar",
                    "bse_source_url": None,
                    "verification_status": "Verified (NSE)",
                    "event_status": "Scheduled"
                }

    # 2. Ingest BSE Forthcoming Calendar (Strict Filter: Financial Results Only)
    bse_cal_path = os.path.join(RESEARCH_DIR, "bse", "samples", "Corpforthresults.json")
    if os.path.exists(bse_cal_path):
        with open(bse_cal_path, mode="r", encoding="utf-8") as f:
            bse_items = json.load(f)
            for item in bse_items:
                code = str(item.get("scrip_Code", "")).strip()
                date_str = item.get("meeting_date", "")
                m_date = parse_date(date_str)
                if not m_date:
                    continue
                isin = code_to_isin.get(code)
                if not isin:
                    continue

                bse_url = item.get("URL") or f"https://www.bseindia.com/stock-share-price/x/y/{code}/"
                comp = companies.get(isin, {})
                
                # BSE Corpforthresults is strictly for forthcoming financial results
                category = "Quarterly Results"
                period = "Q2 Financial Results (Ended 30-Sep-2026)"
                f_year = "FY2026-27"
                r_type = "Unaudited Results"

                key = (isin, m_date)
                if key in events:
                    # Dual-exchange match
                    events[key]["bse_code"] = code
                    events[key]["bse_source_url"] = bse_url
                    events[key]["verification_status"] = "Dual-Exchange Verified"
                    events[key]["announcement_source"] = "NSE & BSE Results Calendars"
                else:
                    event_id = generate_event_id(isin, m_date, period)
                    events[key] = {
                        "event_id": event_id,
                        "isin": isin,
                        "company_name": comp.get("company_name", item.get("Long_Name", "")),
                        "nse_symbol": comp.get("nse_symbol"),
                        "bse_code": code,
                        "result_category": category,
                        "financial_period": period,
                        "financial_year": f_year,
                        "result_type": r_type,
                        "board_meeting_date": m_date,
                        "expected_results_date": m_date,
                        "actual_results_date": None,
                        "actual_results_time": None,
                        "announcement_date": m_date,
                        "announcement_time": None,
                        "announcement_source": "BSE Results Calendar",
                        "nse_source_url": None,
                        "bse_source_url": bse_url,
                        "verification_status": "Verified (BSE)",
                        "event_status": "Scheduled"
                    }

    # Upsert into DB
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM results_events")
        records = [
            (
                e["event_id"], e["isin"], e["company_name"], e["nse_symbol"], e["bse_code"],
                e["result_category"], e["financial_period"], e["financial_year"], e["result_type"],
                e["board_meeting_date"], e["expected_results_date"], e["actual_results_date"],
                e["actual_results_time"], e["announcement_date"], e["announcement_time"],
                e["announcement_source"], e["nse_source_url"], e["bse_source_url"],
                e["verification_status"], e["event_status"]
            )
            for e in events.values()
        ]
        cursor.executemany("""
        INSERT INTO results_events (
            event_id, isin, company_name, nse_symbol, bse_code, result_category,
            financial_period, financial_year, result_type, board_meeting_date,
            expected_results_date, actual_results_date, actual_results_time,
            announcement_date, announcement_time, announcement_source,
            nse_source_url, bse_source_url, verification_status, event_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, records)

    print(f"-> Successfully synced {len(events)} strictly verified financial results events.")
    return len(events)

def sync_announcements():
    print("-> Syncing Financial Results Disclosures Feed...")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT isin, nse_symbol, bse_code, company_name FROM company_master")
        comps = {r["isin"]: dict(r) for r in cursor.fetchall()}
        sym_to_isin = {c["nse_symbol"]: c["isin"] for c in comps.values() if c["nse_symbol"]}
        code_to_isin = {c["bse_code"]: c["isin"] for c in comps.values() if c["bse_code"]}

    ann_records = []

    # 1. NSE Announcements (Filter: Financial Results only)
    nse_ann_path = os.path.join(RESEARCH_DIR, "nse", "samples", "corporate_announcements_equities.json")
    if os.path.exists(nse_ann_path):
        try:
            with open(nse_ann_path, mode="r", encoding="utf-8") as f:
                items = json.load(f)
                for item in items:
                    sym = item.get("symbol", "").strip()
                    isin = sym_to_isin.get(sym)
                    desc = item.get("desc", "")
                    att = item.get("attchmntFile", "")
                    dt_str = item.get("an_dt", "")
                    
                    # Only include if financial result related
                    if not any(k in desc.lower() for k in ["financial result", "financials", "quarter ended", "performance"]):
                        continue
                        
                    ann_id = hashlib.sha256(f"NSE_{sym}_{dt_str}_{desc[:30]}".encode("utf-8")).hexdigest()[:16]
                    ann_records.append((
                        ann_id, isin, "NSE", sym, item.get("sm_name", sym),
                        "Financial Results Notice", desc, att, dt_str, 0, 1
                    ))
        except Exception as e:
            print("NSE announcements sync error:", e)

    # 2. BSE Board Meeting Feed (Filter: Financial Results purpose only)
    bse_feed_path = os.path.join(RESEARCH_DIR, "bse", "samples", "board_meetings_feed.xml")
    if os.path.exists(bse_feed_path):
        try:
            import xml.etree.ElementTree as ET
            tree = ET.parse(bse_feed_path)
            root = tree.getroot()
            for item in root.findall(".//item"):
                title = item.findtext("title", "")
                link = item.findtext("link", "")
                desc = item.findtext("description", "")
                pub_date = item.findtext("pubDate", "")
                
                # Check purpose: must be Quarterly/Half-Yearly/Audited results
                if not any(k in desc.lower() for k in ["results", "quarterly", "accounts", "half yearly", "audited"]):
                    continue
                
                match = re.search(r"\((\d{6})\)", title)
                code = match.group(1) if match else None
                isin = code_to_isin.get(code) if code else None
                comp_name = re.sub(r"\(\d{6}\)", "", title).strip()
                ann_id = hashlib.sha256(f"BSE_{code}_{desc[:30]}".encode("utf-8")).hexdigest()[:16]
                
                ann_records.append((
                    ann_id, isin, "BSE", code or "BSE", comp_name,
                    "Financial Results Announcement", desc, link, pub_date, 0, 1
                ))
        except Exception as e:
            print("BSE feed sync error:", e)

    # Insert into DB
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM announcements")
        cursor.executemany("""
        INSERT OR IGNORE INTO announcements (
            announcement_id, isin, exchange, symbol_or_code, company_name,
            headline, description, attachment_url, published_at,
            is_board_meeting, is_financial_results
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, ann_records)

    print(f"-> Synced {len(ann_records)} financial results disclosures.")
    return len(ann_records)

def run_full_sync():
    from backend.app.services.calendar_reconciliation_engine import run_calendar_reconciliation
    c_count = sync_company_master()
    e_count = sync_results_calendar()
    a_count = sync_announcements()
    recon_stats = run_calendar_reconciliation()
    return {"companies": c_count, "events": e_count, "announcements": a_count, "reconciliation": recon_stats}

if __name__ == "__main__":
    run_full_sync()
