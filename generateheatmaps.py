import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy.ndimage import gaussian_filter
import os
import json

def generate_heatmap(df, mineral, output_dir):
    """Generate a simple heatmap based on sample density and mineral probability"""
    print(f"\nGenerating heatmap for {mineral}...")
    
    # Create figure with transparent background
    plt.figure(figsize=(15, 15), facecolor='none')
    
    # Get the probability column for the mineral
    prob_col = f'{mineral}_prob'
    
    # Create the heatmap data
    heatmap_data = []
    for _, row in df.iterrows():
        lat = row['Latitude']
        lon = row['Longitude']
        prob = row[prob_col]
        heatmap_data.append([lat, lon, prob])
    
    heatmap_data = np.array(heatmap_data)
    
    # Create a grid for the heatmap
    grid_size = 500
    lat_grid = np.linspace(df['Latitude'].min(), df['Latitude'].max(), grid_size)
    lon_grid = np.linspace(df['Longitude'].min(), df['Longitude'].max(), grid_size)
    grid = np.zeros((grid_size, grid_size))
    
    # Fill the grid
    for lat, lon, prob in heatmap_data:
        i = int((lat - lat_grid[0]) / (lat_grid[-1] - lat_grid[0]) * (grid_size-1))
        j = int((lon - lon_grid[0]) / (lon_grid[-1] - lon_grid[0]) * (grid_size-1))
        if 0 <= i < grid_size and 0 <= j < grid_size:
            grid[i, j] += prob
    
    # Apply Gaussian smoothing
    smoothed_grid = gaussian_filter(grid, sigma=3)
    
    # Plot the heatmap
    plt.imshow(smoothed_grid, 
               extent=[df['Longitude'].min(), df['Longitude'].max(), 
                      df['Latitude'].min(), df['Latitude'].max()],
               cmap='YlOrRd',
               aspect='auto')
    
    # Save with transparency
    output_path = os.path.join(output_dir, f'{mineral}_heatmap.png')
    plt.savefig(output_path, 
                bbox_inches='tight', 
                pad_inches=0, 
                transparent=True,
                dpi=300)
    plt.close()
    
    print(f"Saved heatmap to {output_path}")
    
    # Save bounds information
    bounds = {
        'north': float(df['Latitude'].max()),
        'south': float(df['Latitude'].min()),
        'east': float(df['Longitude'].max()),
        'west': float(df['Longitude'].min())
    }
    
    return bounds

def main():
    # Load the data
    print("Loading data...")
    df = pd.read_csv('assets/samples.csv')
    
    # Create output directory if it doesn't exist
    output_dir = 'assets/heatmaps'
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate heatmaps for each mineral
    minerals = ['AU', 'AG', 'CU', 'CO', 'NI']
    bounds_info = {}
    
    for mineral in minerals:
        bounds = generate_heatmap(df, mineral, output_dir)
        bounds_info[mineral] = bounds
    
    # Save bounds information
    with open('assets/heatmap_bounds.json', 'w') as f:
        json.dump(bounds_info, f, indent=2)
    
    print("\nAll heatmaps generated successfully!")

if __name__ == "__main__":
    main()