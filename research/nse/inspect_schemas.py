import json
import csv

samples_dir = r"c:\DEV\FFS\ResultBased Strategy\research\nse\samples"

def inspect_json(filename):
    with open(f"{samples_dir}\\{filename}", "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"\n==================== {filename} ====================")
    if isinstance(data, list):
        print(f"Type: List of {len(data)} items")
        if data:
            print("Item keys and types:")
            first = data[0]
            if isinstance(first, dict):
                for k, v in first.items():
                    print(f"  - {k} ({type(v).__name__}): {repr(v)[:80]}")
    elif isinstance(data, dict):
        print(f"Type: Dict with keys: {list(data.keys())}")
        for k, v in data.items():
            if isinstance(v, list):
                print(f"  Key '{k}': List of {len(v)} items")
                if v and isinstance(v[0], dict):
                    print("    Item keys:")
                    for ik, iv in v[0].items():
                        print(f"      - {ik} ({type(iv).__name__}): {repr(iv)[:60]}")
            else:
                print(f"  Key '{k}' ({type(v).__name__}): {repr(v)[:80]}")

inspect_json("event_calendar.json")
inspect_json("corporate_board_meetings_equities.json")
inspect_json("corporate_announcements_equities.json")
inspect_json("corporates_financial_results_quarterly.json")
inspect_json("live_analysis_emerge.json")

def inspect_csv(filename):
    print(f"\n==================== {filename} ====================")
    with open(f"{samples_dir}\\{filename}", "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        print("Header columns:", header)
        row1 = next(reader, None)
        print("Sample row 1:", row1)
        count = 1 + sum(1 for _ in reader)
        print(f"Total rows (including sample): {count}")

inspect_csv("EQUITY_L.csv")
inspect_csv("SME_EQUITY_L.csv")
inspect_csv("List_of_Active_Securities_CM_DEBT.csv")
