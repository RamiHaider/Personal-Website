import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy.ndimage import gaussian_filter
import rasterio
from rasterio.transform import from_origin
import os

def generate_heatmap(df, mineral, output_dir, debug=True):
    """Generate heatmap with additional debugging information"""
    
    # Calculate grid parameters with higher resolution
    x_min, x_max = df['Longitude'].min(), df['Longitude'].max()
    y_min, y_max = df['Latitude'].min(), df['Latitude'].max()
    
    # Use smaller resolution (about 500m)
    res = 0.004166
    
    # Create grid
    nx = int((x_max - x_min) / res) + 1
    ny = int((y_max - y_min) / res) + 1
    
    print(f"\nProcessing {mineral}")
    print(f"Grid dimensions: {nx} x {ny}")
    
    # Create empty grid
    grid = np.zeros((ny, nx))
    counts = np.zeros((ny, nx))  # Count points per cell for debugging
    
    # Fill grid
    for _, row in df.iterrows():
        i = int((row['Latitude'] - y_min) / res)
        j = int((row['Longitude'] - x_min) / res)
        if 0 <= i < ny and 0 <= j < nx:
            grid[i, j] += row[f'{mineral}_prob']
            counts[i, j] += 1
    
    # Normalize by count where count > 0
    mask = counts > 0
    grid[mask] = grid[mask] / counts[mask]
    
    if debug:
        print(f"\nGrid statistics before smoothing:")
        print(f"Non-zero cells: {np.count_nonzero(grid)}")
        print(f"Max value: {np.max(grid):.4f}")
        print(f"Mean value: {np.mean(grid[grid > 0]):.4f}")
        
        # Save count map for debugging
        plt.figure(figsize=(15, 15))
        plt.imshow(counts > 0, cmap='binary')
        plt.title(f'{mineral} Data Coverage')
        plt.colorbar(label='Has data')
        plt.savefig(os.path.join(output_dir, f'{mineral}_coverage.png'))
        plt.close()
    
    # Apply Gaussian smoothing to reduce artifacts
    grid = gaussian_filter(grid, sigma=2)
    
    # Normalize to [0,1] range
    if np.max(grid) > 0:
        grid = grid / np.percentile(grid[grid > 0], 98)
        grid = np.clip(grid, 0, 1)
    
    # Flip grid and save
    grid = np.flipud(grid)
    
    # Save as both PNG and GeoTIFF
    plt.figure(figsize=(20, 20))
    plt.imshow(grid, 
              cmap='RdYlBu_r',
              extent=[x_min, x_max, y_min, y_max],
              aspect='equal')
    plt.axis('off')
    
    # Save with high quality
    plt.savefig(os.path.join(output_dir, f'{mineral}_heatmap.png'),
                dpi=300,
                bbox_inches='tight',
                pad_inches=0,
                transparent=True)
    plt.close()
    
    # Save GeoTIFF
    transform = from_origin(x_min, y_max, res, res)
    
    with rasterio.open(
        os.path.join(output_dir, f'{mineral}_heatmap.tif'),
        'w',
        driver='GTiff',
        height=grid.shape[0],
        width=grid.shape[1],
        count=1,
        dtype=grid.dtype,
        crs='EPSG:4326',
        transform=transform,
        nodata=0
    ) as dst:
        dst.write(grid, 1)

# Run the generation
if __name__ == "__main__":
    # Create output directory
    output_dir = 'assets/mineral_images'
    os.makedirs(output_dir, exist_ok=True)
    
    # Read data
    df = pd.read_csv('assets/samples.csv')
    
    # Generate heatmaps for each mineral
    minerals = ['AU', 'AG', 'CU', 'CO', 'NI']
    for mineral in minerals:
        generate_heatmap(df, mineral, output_dir, debug=True)