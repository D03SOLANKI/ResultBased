import json
import pandas as pd
from collections import Counter

# 1. Analyze ListofScripData
with open("research/bse/samples/ListofScripData.json", "r", encoding="utf-8") as f:
    scrips = json.load(f)

print("=== BSE SCRIP MASTER ANALYSIS ===")
print(f"Total Active Equity Scrips: {len(scrips)}")

df_scrips = pd.DataFrame(scrips)
print("\nColumns:", df_scrips.columns.tolist())
print("\nFirst row sample:")
print(json.dumps(scrips[0], indent=2))

print("\nBreakdown by GROUP:")
group_counts = Counter(df_scrips["GROUP"].fillna("UNKNOWN").str.strip())
for grp, cnt in sorted(group_counts.items(), key=lambda x: -x[1]):
    print(f"  Group {grp:8s}: {cnt:5d}")

sme_groups = ["M", "MT"]
sme_count = df_scrips[df_scrips["GROUP"].str.strip().isin(sme_groups)].shape[0]
mainboard_count = len(scrips) - sme_count
print(f"\nMainboard Equities: {mainboard_count}")
print(f"BSE SME Equities (Groups M/MT): {sme_count}")

has_isin = df_scrips["ISIN_NUMBER"].str.strip().replace("", None).notna().sum()
print(f"Scrips with valid ISIN: {has_isin} / {len(scrips)} ({has_isin/len(scrips)*100:.1f}%)")

# 2. Analyze Corpforthresults
print("\n=== BSE FORTHCOMING RESULTS ANALYSIS ===")
with open("research/bse/samples/Corpforthresults.json", "r", encoding="utf-8") as f:
    forth_results = json.load(f)

print(f"Total Forthcoming Results Entries: {len(forth_results)}")
df_forth = pd.DataFrame(forth_results)
print("\nColumns:", df_forth.columns.tolist())
print("\nFirst row sample:")
print(json.dumps(forth_results[0], indent=2))

print("\nMeeting Date distribution (First 15 dates):")
date_counts = Counter(df_forth["meeting_date"])
for d, cnt in list(date_counts.items())[:15]:
    print(f"  {d}: {cnt}")

print(f"\nUnique companies in forthcoming results: {df_forth['scrip_Code'].nunique()}")
