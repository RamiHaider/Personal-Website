import pandas as pd
import json

# Read your samples CSV
df = pd.read_csv('assets/samples.csv')

# Create a list of sample points (using just a subset for better performance)
samples = df.sample(n=100000).apply(
    lambda row: {
        'lat': row['Latitude'],
        'lng': row['Longitude']
    }, axis=1
).tolist()

# Save as JSON for the web interface
with open('assets/rock_samples.json', 'w') as f:
    json.dump(samples, f)

print(f"Saved {len(samples)} sample points to rock_samples.json")