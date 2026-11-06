import pandas as pd
import json

df_nse = pd.read_csv("research/common/samples/nse_equity_master_raw.csv")
df_bse = pd.read_csv("research/common/samples/bse_equity_master_raw.csv")

# Clean column names
df_nse.columns = [c.strip() for c in df_nse.columns]
df_bse.columns = [c.strip() for c in df_bse.columns]

print("NSE Series distribution:")
print(df_nse["SERIES"].value_counts())

print("\nBSE Group distribution:")
print(df_bse["GROUP"].value_counts())

# Check for Issuer code (characters 4 to 7 in ISIN: e.g. INE[002A]01018)
# ISIN format: Country(2) + Security Type(1) + Issuer Code(5) + Security Code(2) + Serial/Check(2)
# In Indian ISINs: INE (Equity), INF (Mutual Fund), INA (Alternative/Debt), etc.
df_nse["ISSUER_ID"] = df_nse["ISIN NUMBER"].str.slice(0, 8) # e.g. INE002A
df_bse["ISSUER_ID"] = df_bse["ISIN_NUMBER"].str.slice(0, 8)

# Check companies with multiple ISINs under same issuer ID (multiple share classes / instruments)
nse_multi_isin = df_nse.groupby("ISSUER_ID").filter(lambda g: len(g) > 1)
print(f"\nNSE Issuers with multiple listed equity instruments: {nse_multi_isin['ISSUER_ID'].nunique()}")
if len(nse_multi_isin) > 0:
    print(nse_multi_isin[["SYMBOL", "SERIES", "ISIN NUMBER", "NAME OF COMPANY"]].head(15))

bse_multi_isin = df_bse.groupby("ISSUER_ID").filter(lambda g: len(g) > 1)
print(f"\nBSE Issuers with multiple listed equity instruments: {bse_multi_isin['ISSUER_ID'].nunique()}")
if len(bse_multi_isin) > 0:
    print(bse_multi_isin[["SCRIP_CD", "scrip_id", "GROUP", "ISIN_NUMBER", "Scrip_Name"]].head(15))
