import pandas as pd

file_path = "research/infra/samples/amfi_market_cap_30Jun2026.xlsx"
df_raw = pd.read_excel(file_path, sheet_name='FINAL', header=None)

print("First 5 rows raw:")
for i in range(5):
    print(f"Row {i}: {list(df_raw.iloc[i])}")

# Let's see row 0 or 1 as headers
headers = list(df_raw.iloc[0])
print("\nHeaders detected at row 0:")
for idx, h in enumerate(headers):
    print(f"  Col {idx}: {h}")

# Set row 0 as header
df = pd.read_excel(file_path, sheet_name='FINAL', header=1)
print("\nDataFrame columns after header=1:")
print(df.columns.tolist())
print(f"Shape: {df.shape}")
print("\nFirst 3 rows:")
print(df.head(3))

# Categorization distribution
cat_col = df.columns[-1]
print(f"\nCategorization Column: '{cat_col}'")
print(df[cat_col].value_counts(dropna=False))

# Check Sr. No. range for each category
print("\nRange check by category:")
for cat in df[cat_col].dropna().unique():
    sub = df[df[cat_col] == cat]
    sr_col = df.columns[0]
    print(f"Category: {cat} | Count: {len(sub)} | Sr. No min: {sub[sr_col].min()} | Sr. No max: {sub[sr_col].max()}")
