import pandas as pd
import json

# Read your samples CSV
df = pd.read_csv('assets/samples.csv')

# Create a list of sample points with their binary classifications
samples = df.sample(n=100000).apply(
    lambda row: {
        'lat': float(row['Latitude']),
        'lng': float(row['Longitude']),
        'minerals': {
            'AU': {'pred': int(row['AU_pred']), 'prob': float(row['AU_prob'])},
            'AG': {'pred': int(row['AG_pred']), 'prob': float(row['AG_prob'])},
            'CU': {'pred': int(row['CU_pred']), 'prob': float(row['CU_prob'])},
            'CO': {'pred': int(row['CO_pred']), 'prob': float(row['CO_prob'])},
            'NI': {'pred': int(row['NI_pred']), 'prob': float(row['NI_prob'])}
        }
    }, axis=1
).tolist()

# Save as JSON for the web interface
with open('assets/rock_samples.json', 'w') as f:
    json.dump(samples, f)

print(f"Saved {len(samples)} sample points to rock_samples.json")