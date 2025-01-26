import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Circle
import os
import json
from tqdm import tqdm
import time

def generate_au_map(df, output_dir):
    """Generate a basic Au potential map with circles around sample points"""
    print("\nGenerating Au potential map...")
    start_time = time.time()
    
    # Create figure with white background
    plt.figure(figsize=(20, 30), facecolor='white')
    ax = plt.gca()
    ax.set_facecolor('white')
    
    # Get coordinates and probabilities for Au with progress bar
    print("Drawing sample points...")
    for _, row in tqdm(df.iterrows(), total=len(df), desc="Processing samples"):
        # Create a circle for each point
        circle = Circle(
            (row['Longitude'], row['Latitude']),
            radius=0.05,  # Fixed radius in degrees
            alpha=0.5,
            facecolor=plt.cm.RdYlBu_r(row['AU_prob']),  # Blue (low) to Red (high)
            edgecolor='none'
        )
        ax.add_patch(circle)
    
    print("Finalizing map...")
    # Set plot limits
    ax.set_xlim(df['Longitude'].min() - 0.5, df['Longitude'].max() + 0.5)
    ax.set_ylim(df['Latitude'].min() - 0.5, df['Latitude'].max() + 0.5)
    
    # Remove axes
    ax.set_xticks([])
    ax.set_yticks([])
    ax.set_frame_on(False)
    
    # Save with transparency
    output_path = os.path.join(output_dir, 'AU_heatmap.png')
    print(f"Saving map to {output_path}...")
    plt.savefig(
        output_path,
        bbox_inches='tight',
        pad_inches=0,
        transparent=True,
        dpi=300
    )
    plt.close()
    
    end_time = time.time()
    print(f"\nMap generation completed in {end_time - start_time:.2f} seconds")
    
    return {
        'north': float(df['Latitude'].max() + 0.5),
        'south': float(df['Latitude'].min() - 0.5),
        'east': float(df['Longitude'].max() + 0.5),
        'west': float(df['Longitude'].min() - 0.5)
    }

def main():
    print("Starting Au potential map generation...")
    
    # Load sample data with progress feedback
    print("\nLoading sample data...")
    start_load = time.time()
    df = pd.read_csv('assets/samples.csv')
    print(f"Loaded {len(df)} samples in {time.time() - start_load:.2f} seconds")
    
    # Ensure output directory exists
    output_dir = 'assets/mineral_images'
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate map and get bounds
    bounds = generate_au_map(df, output_dir)
    
    # Save bounds information
    print("\nSaving bounds information...")
    bounds_info = {'AU': bounds}
    with open('assets/mineral_images/bounds.json', 'w') as f:
        json.dump(bounds_info, f, indent=2)
    
    print("\nAll operations completed successfully!")

if __name__ == "__main__":
    main()