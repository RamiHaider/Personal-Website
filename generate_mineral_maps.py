import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
import os
import json
from tqdm import tqdm

def generate_au_map(df, output_dir, grid_size=0.05):  # grid_size in degrees
    """Generate Au potential map with squares in a grid"""
    print("Generating Au potential map...")
    
    plt.figure(figsize=(10, 15), facecolor='white')
    ax = plt.gca()
    ax.set_facecolor('white')
    
    # Create a grid of squares
    lon_min, lon_max = df['Longitude'].min(), df['Longitude'].max()
    lat_min, lat_max = df['Latitude'].min(), df['Latitude'].max()
    
    # Round to grid
    lon_grid = np.arange(
        np.floor(lon_min / grid_size) * grid_size,
        np.ceil(lon_max / grid_size) * grid_size,
        grid_size
    )
    lat_grid = np.arange(
        np.floor(lat_min / grid_size) * grid_size,
        np.ceil(lat_max / grid_size) * grid_size,
        grid_size
    )
    
    print("Creating grid squares...")
    grid_values = {}
    
    # Assign points to grid cells
    for _, row in tqdm(df.iterrows(), desc="Processing samples"):
        # Find grid cell for this point
        lon_idx = int((row['Longitude'] - lon_grid[0]) / grid_size)
        lat_idx = int((row['Latitude'] - lat_grid[0]) / grid_size)
        grid_key = (lon_idx, lat_idx)
        
        if grid_key not in grid_values:
            grid_values[grid_key] = []
        grid_values[grid_key].append(row['AU_prob'])
    
    # Draw squares for cells with data
    print("Drawing grid squares...")
    for (lon_idx, lat_idx), probs in tqdm(grid_values.items(), desc="Drawing squares"):
        avg_prob = np.mean(probs)
        if avg_prob > 0.1:  # Only draw significant probabilities
            square = Rectangle(
                (lon_grid[lon_idx], lat_grid[lat_idx]),
                grid_size,
                grid_size,
                facecolor=plt.cm.RdYlBu_r(avg_prob),
                edgecolor='none',
                alpha=0.5
            )
            ax.add_patch(square)
    
    # Set plot limits
    ax.set_xlim(lon_min - grid_size, lon_max + grid_size)
    ax.set_ylim(lat_min - grid_size, lat_max + grid_size)
    
    # Remove axes
    ax.set_xticks([])
    ax.set_yticks([])
    ax.set_frame_on(False)
    
    # Save map
    output_path = os.path.join(output_dir, 'AU_heatmap.png')
    print(f"Saving map to {output_path}...")
    plt.savefig(
        output_path,
        bbox_inches='tight',
        pad_inches=0,
        transparent=True,
        dpi=150
    )
    plt.close()
    
    # Also save the grid data for later interpolation
    grid_data = {
        'grid_size': grid_size,
        'lon_grid': lon_grid.tolist(),
        'lat_grid': lat_grid.tolist(),
        'values': {f"{k[0]},{k[1]}": np.mean(v) for k, v in grid_values.items()}
    }
    
    with open(os.path.join(output_dir, 'AU_grid_data.json'), 'w') as f:
        json.dump(grid_data, f)
    
    return {
        'north': float(lat_max + grid_size),
        'south': float(lat_min - grid_size),
        'east': float(lon_max + grid_size),
        'west': float(lon_min - grid_size)
    }

def main():
    print("Starting Au potential map generation...")
    
    print("Loading sample data...")
    df = pd.read_csv('assets/samples.csv')
    print(f"Loaded {len(df)} samples")
    
    output_dir = 'assets/mineral_images'
    os.makedirs(output_dir, exist_ok=True)
    
    bounds = generate_au_map(df, output_dir)
    
    bounds_info = {'AU': bounds}
    with open('assets/mineral_images/bounds.json', 'w') as f:
        json.dump(bounds_info, f, indent=2)
    
    print("Map generation completed!")
    print("\nNext step: Run interpolation to smooth between grid squares")

if __name__ == "__main__":
    main() 