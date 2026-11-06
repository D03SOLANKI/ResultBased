import io
import json
import pandas as pd

# Load datasets
df_nse_main = pd.read_csv("research/common/samples/nse_equity_master_raw.csv")
df_nse_main.columns = [c.strip() for c in df_nse_main.columns]
df_nse_main["MARKET_TYPE"] = "MAINBOARD"

df_nse_sme = pd.read_csv("research/common/samples/nse_sme_master_raw.csv")
df_nse_sme.columns = [c.strip() for c in df_nse_sme.columns]
df_nse_sme["MARKET_TYPE"] = "SME"
# Harmonize column names
df_nse_sme = df_nse_sme.rename(columns={"NAME_OF_COMPANY": "NAME OF COMPANY"})

df_nse_all = pd.concat([df_nse_main, df_nse_sme], ignore_index=True)
df_nse_all["ISIN"] = df_nse_all["ISIN_NUMBER"].combine_first(df_nse_all["ISIN NUMBER"]).astype(str).str.strip()
df_nse_all["SYMBOL"] = df_nse_all["SYMBOL"].astype(str).str.strip()
df_nse_all["NAME"] = df_nse_all["NAME OF COMPANY"].astype(str).str.strip()
df_nse_all["SERIES"] = df_nse_all["SERIES"].astype(str).str.strip()

df_bse = pd.read_csv("research/common/samples/bse_equity_master_raw.csv")
df_bse.columns = [c.strip() for c in df_bse.columns]
df_bse["ISIN"] = df_bse["ISIN_NUMBER"].astype(str).str.strip()
df_bse["BSE_CODE"] = df_bse["SCRIP_CD"].astype(str).str.strip()
df_bse["BSE_ID"] = df_bse["scrip_id"].astype(str).str.strip()
df_bse["BSE_NAME"] = df_bse["Scrip_Name"].astype(str).str.strip()
df_bse["GROUP"] = df_bse["GROUP"].astype(str).str.strip()
df_bse["MARKET_TYPE"] = df_bse["GROUP"].apply(lambda g: "SME" if g in ["M", "MT", "MS"] else "MAINBOARD")

print(f"Total Combined NSE Securities: {len(df_nse_all)} (Mainboard: {len(df_nse_main)}, SME: {len(df_nse_sme)})")
print(f"Total BSE Securities: {len(df_bse)} (Mainboard: {(df_bse['MARKET_TYPE']=='MAINBOARD').sum()}, SME: {(df_bse['MARKET_TYPE']=='SME').sum()})")

# Unique ISINs
df_nse_sme["ISIN"] = df_nse_sme["ISIN_NUMBER"].astype(str).str.strip()
nse_unique = df_nse_all.drop_duplicates(subset=["ISIN"])
bse_unique = df_bse[df_bse["ISIN"] != "NA"].drop_duplicates(subset=["ISIN"])

common_all = pd.merge(nse_unique, bse_unique, on="ISIN", how="inner", suffixes=("_NSE", "_BSE"))
nse_only = nse_unique[~nse_unique["ISIN"].isin(bse_unique["ISIN"])]
bse_only = bse_unique[~bse_unique["ISIN"].isin(nse_unique["ISIN"])]

print("\n--- ALL EQUITIES (MAINBOARD + SME) ---")
print(f"Total Dual-listed ISINs: {len(common_all)}")
print(f"Total NSE-only ISINs: {len(nse_only)} ({len(nse_only)/len(nse_unique)*100:.2f}%)")
print(f"Total BSE-only ISINs: {len(bse_only)} ({len(bse_only)/len(bse_unique)*100:.2f}%)")
print(f"% of NSE listed on BSE: {len(common_all)/len(nse_unique)*100:.2f}%")
print(f"% of BSE listed on NSE: {len(common_all)/len(bse_unique)*100:.2f}%")

# SME cross listing analysis
nse_sme_unique = df_nse_sme.drop_duplicates(subset=["ISIN"])
bse_sme_unique = df_bse[df_bse["MARKET_TYPE"] == "SME"].drop_duplicates(subset=["ISIN"])
sme_cross = pd.merge(nse_sme_unique, bse_sme_unique, on="ISIN", how="inner")
print(f"\nSME Cross-listing count (NSE SME listed on BSE SME): {len(sme_cross)}")

# Check if any NSE SME is listed on BSE Mainboard or vice versa
nse_sme_on_bse_main = pd.merge(nse_sme_unique, df_bse[df_bse["MARKET_TYPE"] == "MAINBOARD"], on="ISIN", how="inner")
print(f"NSE SME listed on BSE Mainboard: {len(nse_sme_on_bse_main)}")

# Save full mapping
common_all[[
    "ISIN", "SYMBOL", "NAME", "SERIES", "MARKET_TYPE_NSE",
    "BSE_CODE", "BSE_ID", "BSE_NAME", "GROUP", "MARKET_TYPE_BSE"
]].to_csv("research/common/samples/comprehensive_cross_exchange_mapping.csv", index=False)

summary_comp = {
    "nse_mainboard_count": len(df_nse_main),
    "nse_sme_count": len(df_nse_sme),
    "nse_total_unique_isins": int(nse_unique['ISIN'].nunique()),
    "bse_mainboard_count": int((df_bse['MARKET_TYPE']=='MAINBOARD').sum()),
    "bse_sme_count": int((df_bse['MARKET_TYPE']=='SME').sum()),
    "bse_total_unique_isins": int(bse_unique['ISIN'].nunique()),
    "dual_listed_count": len(common_all),
    "nse_only_count": len(nse_only),
    "bse_only_count": len(bse_only),
    "pct_nse_on_bse": round(len(common_all)/len(nse_unique)*100, 2),
    "pct_bse_on_nse": round(len(common_all)/len(bse_unique)*100, 2),
    "sme_cross_listing_count": len(sme_cross)
}

with open("research/common/samples/comprehensive_summary.json", "w") as f:
    json.dump(summary_comp, f, indent=2)

print("\nSaved comprehensive cross exchange mapping to research/common/samples/")
