import pandas as pd

df = pd.read_excel('HeroForge Anew 3.5 v7.4.0.1.xlsm', sheet_name='Race & Templates')
print("Race & Templates shape:", df.shape)

for col in df.columns:
    cell_vals = [str(x) for x in df[col].dropna() if 'Dragonborn' in str(x) or 'Phaerimm' in str(x) or 'Template' in str(x)]
    if cell_vals:
        print(f"Col {col}: {cell_vals[:5]}")
