import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import gaussian_kde
import os
import json

def generate_au_map(df, output_dir):
    """Generate gold potential map with proper orientation"""
    print("Generating map for Au...")
    
    # Create figure with high resolution
    plt.figure(figsize=(20, 30))
    
    # Get coordinates and probabilities for Au
    lats = df['Latitude'].values
    lons = df['Longitude'].values
    probs = df['AU_prob'].values
    
    # Stack coordinates for KDE
    positions = np.vstack([lons, lats])
    
    # Calculate kernel density with probability weights
    kernel = gaussian_kde(positions, weights=probs)
    
    # Create a grid of points
    lon_grid, lat_grid = np.mgrid[
        lons.min():lons.max():500j,
        lats.min():lats.max():750j
    ]
    
    # Evaluate kernel on grid
    z = kernel(np.vstack([lon_grid.flatten(), lat_grid.flatten()]))
    z = z.reshape(lon_grid.shape)
    
    # Normalize the intensity
    z = (z - z.min()) / (z.max() - z.min())
    
    # Plot with proper colormap
    plt.imshow(
        z.T,  # Transpose to fix orientation
        extent=[lons.min(), lons.max(), lats.min(), lats.max()],
        origin='lower',  # Correct orientation
        cmap='RdYlBu_r',  # Blue (low) to Red (high)
        aspect='auto'
    )
    
    # Remove axes and make background transparent
    plt.gca().set_frame_on(False)
    plt.gca().set_xticks([])
    plt.gca().set_yticks([])
    
    # Save with high quality and transparency
    output_path = os.path.join(output_dir, 'AU_heatmap.png')
    plt.savefig(
        output_path,
        bbox_inches='tight',
        pad_inches=0,
        transparent=True,
        dpi=300
    )
    plt.close()
    
    print(f"Saved Au map to {output_path}")
    
    return {
        'north': float(lats.max()),
        'south': float(lats.min()),
        'east': float(lons.max()),
        'west': float(lons.min())
    }

def main():
    # Load sample data
    print("Loading sample data...")
    df = pd.read_csv('assets/samples.csv')
    
    # Ensure output directory exists
    output_dir = 'assets/mineral_images'
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate only Au map
    bounds = generate_au_map(df, output_dir)
    
    # Save bounds information
    bounds_info = {'AU': bounds}
    with open('assets/mineral_images/bounds.json', 'w') as f:
        json.dump(bounds_info, f, indent=2)
    
    print("\nAu map generated successfully!")

if __name__ == "__main__":
    main() 