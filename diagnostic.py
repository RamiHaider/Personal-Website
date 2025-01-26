import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import rasterio
from rasterio.transform import from_origin
from pyproj import CRS, Transformer
import os
import json

# Read and analyze the data
df = pd.read_csv('assets/samples.csv')

# Print coordinate ranges and basic statistics
print("=== Coordinate Ranges ===")
print(f"Longitude: {df['Longitude'].min():.4f} to {df['Longitude'].max():.4f}")
print(f"Latitude: {df['Latitude'].min():.4f} to {df['Latitude'].max():.4f}")

# Analyze mineral probabilities
minerals = ['AU', 'AG', 'CU', 'CO', 'NI']
print("\n=== Probability Statistics ===")
for mineral in minerals:
    prob_col = f'{mineral}_prob'
    print(f"\n{mineral}:")
    print(f"Min: {df[prob_col].min():.4f}")
    print(f"Max: {df[prob_col].max():.4f}")
    print(f"Mean: {df[prob_col].mean():.4f}")
    print(f"Median: {df[prob_col].median():.4f}")
    print(f"Non-zero values: {(df[prob_col] > 0).sum()}")

# Test coordinate transformations
print("\n=== Coordinate Transformation Test ===")
quebec_crs = CRS.from_epsg(32198)
wgs84_crs = CRS.from_epsg(4326)

# Create transformers
to_quebec = Transformer.from_crs(wgs84_crs, quebec_crs, always_xy=True)
back_to_wgs = Transformer.from_crs(quebec_crs, wgs84_crs, always_xy=True)

# Test a few points
test_points = df.iloc[::1000][['Longitude', 'Latitude']].values
print("\nTesting coordinate round-trip for 5 points:")
for lon, lat in test_points[:5]:
    x, y = to_quebec.transform(lon, lat)
    back_lon, back_lat = back_to_wgs.transform(x, y)
    print(f"\nOriginal: ({lon:.4f}, {lat:.4f})")
    print(f"Quebec Lambert: ({x:.1f}, {y:.1f})")
    print(f"Back to WGS84: ({back_lon:.4f}, {back_lat:.4f})")
    print(f"Difference: ({abs(lon-back_lon):.8f}, {abs(lat-back_lat):.8f})")

# Generate test visualization with grid overlay
def create_debug_plot(mineral='AU', grid_size=50):
    plt.figure(figsize=(15, 15))
    
    # Plot points colored by probability
    plt.scatter(df['Longitude'], df['Latitude'], 
               c=df[f'{mineral}_prob'],
               cmap='RdYlBu_r',
               s=1,
               alpha=0.5)
    
    # Add grid lines
    lon_range = np.arange(df['Longitude'].min(), df['Longitude'].max(), grid_size/111.0)
    lat_range = np.arange(df['Latitude'].min(), df['Latitude'].max(), grid_size/111.0)
    
    for lon in lon_range:
        plt.axvline(x=lon, color='gray', alpha=0.2, linestyle=':')
    for lat in lat_range:
        plt.axhline(y=lat, color='gray', alpha=0.2, linestyle=':')
    
    plt.title(f'{mineral} Debug Plot with {grid_size}km Grid')
    plt.colorbar(label='Probability')
    
    # Save both normal and rotated versions
    plt.savefig(f'debug_{mineral}_normal.png')
    plt.close()

# Create debug plots for each mineral
for mineral in minerals:
    create_debug_plot(mineral)

# Generate web-ready bounds for Leaflet
quebec_bounds = {
    'quebec_lambert': {
        'x_min': float(df['Longitude'].min()),
        'x_max': float(df['Longitude'].max()),
        'y_min': float(df['Latitude'].min()),
        'y_max': float(df['Latitude'].max())
    }
}

with open('quebec_bounds.json', 'w') as f:
    json.dump(quebec_bounds, f, indent=2)

print("\nDebug visualizations and bounds file have been created.")