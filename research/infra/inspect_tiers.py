import pandas as pd

file_path = "research/infra/samples/amfi_market_cap_30Jun2026.xlsx"
df = pd.read_excel(file_path, sheet_name='FINAL', header=1)

avg_col = 'Average of All Exchanges (Rs. Cr.)'
df[avg_col] = pd.to_numeric(df[avg_col], errors='coerce')

ranks = [1, 50, 100, 101, 150, 250, 251, 500, 501, 750, 1000, 1500, 2000, 3000, 5000]

print("Market Cap at specific ranks (in Rs. Crores):")
for r in ranks:
    if r <= len(df):
        row = df.iloc[r-1]
        name = row['Company name']
        isin = row['ISIN']
        nse = row['NSE Symbol']
        bse = row['BSE Symbol']
        mcap = row[avg_col]
        cat = row['Categorization as per SEBI Circular dated Oct 6, 2017']
        print(f"Rank {r:4d}: {name[:30]:30s} | NSE: {str(nse):12s} | BSE: {str(bse):10s} | Mcap: Rs. {mcap:12,.2f} Cr | Cat: {cat}")

print("\nSummary of market cap tiers:")
print(f"100th stock mcap (Large-Cap cutoff): Rs. {df.iloc[99][avg_col]:,.2f} Cr ({df.iloc[99]['Company name']})")
print(f"250th stock mcap (Mid-Cap cutoff): Rs. {df.iloc[249][avg_col]:,.2f} Cr ({df.iloc[249]['Company name']})")
print(f"500th stock mcap (Small-Cap 250 cutoff / Micro-cap start): Rs. {df.iloc[499][avg_col]:,.2f} Cr ({df.iloc[499]['Company name']})")
print(f"1000th stock mcap (Nano-cap / deep illiquid threshold): Rs. {df.iloc[999][avg_col]:,.2f} Cr ({df.iloc[999]['Company name']})")
