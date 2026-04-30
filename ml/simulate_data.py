import numpy as np
import pandas as pd

np.random.seed(42)

N = 400 #total 1200 records (400 normal + 400 fire + 400 smoke)

def generate_class(label, n):
    if label == 0:  # Normal
        smoke       = np.random.randint(0, 200, n)
        flame       = np.zeros(n, dtype=int)
        temperature = np.random.uniform(20, 35, n)
        humidity    = np.random.uniform(40, 70, n)
    elif label == 1:  # Warning
        smoke       = np.random.randint(200, 500, n)
        flame       = np.zeros(n, dtype=int)
        temperature = np.random.uniform(35, 55, n)
        humidity    = np.random.uniform(25, 40, n)
    else:  # Fire
        smoke       = np.random.randint(500, 1023, n)
        flame       = np.ones(n, dtype=int)
        temperature = np.random.uniform(55, 100, n)
        humidity    = np.random.uniform(10, 25, n)
        
    return pd.DataFrame({
        'smoke': smoke,
        'flame': flame,
        'temperature': np.round(temperature, 1),
        'humidity': np.round(humidity, 1),
        'label': label
    })

df = pd.concat([
    generate_class(0, N),
    generate_class(1, N),
    generate_class(2, N)
], ignore_index=True)

df = df.sample(frac=1, random_state=42).reset_index(drop=True)

df.to_csv("dataset.csv", index=False)

print(f"✅ Dataset saved → dataset.csv")
print(f"   Total rows  : {len(df)}")
print(f"   Class counts:\n{df['label'].value_counts().sort_index()}")
print(f"\n   Label map: 0=Normal | 1=Warning | 2=Fire")