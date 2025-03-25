# Quebec Mineral Potential Prediction: A Multi-Modal Deep Learning Approach

## Project Overview

As a geologist who has traversed land claims across Ontario in search of gold, I've combined my field experience with my enthusiasm for machine learning to create a mineral prospectivity mapper. This project aims to build a multi-modal deep learning model to predict mineral potential across Quebec, combining geochemical data, geological features, and magnetic imagery to predict probabilities of anomalous values for Au, Ag, Cu, Co, and Ni.

My goal was to develop an interactive GUI that allows users to select a region of reasonable size (approximately 5km × 5km) and receive prediction results broken down by these five key minerals.

## Project Structure

```
PROJECT_ROOT/
├── mag_images/         # 434,864 magnetic images (170x170 pixels, ~12KB each)
│   └── [1-434864].jpg
└── Training/
    ├── data/
    │   └── raw/
    │       └── rock_samples.csv    # 459,550 rows, 99.8MB
    ├── models/
    └── notebooks/
        └── 01_data_exploration.ipynb
```

## Hardware Constraints

The entire project was developed on a MacBook M2 with 8GB RAM and approximately 10GB of free storage. MPS support was available for GPU acceleration, which proved crucial for training the CNN models within memory limitations.

## Data Collection & Preprocessing

### Data Sources

I collected data from Quebec's public geoscientific database (SIGEOM):

- **Geological Data**: 
  - Downloaded shape files from `GEOL_SIGEOM_QC.SHP`
  - Selected specific layers:
    1. Faille Regionale (Regional Faults)
    2. Contact geologique (Geological Contacts)
    3. Zone Geologique (Geological Zones)

- **Geochemical Data**:
  - From `GEOCH_SIGEOM_QC.SHP`, I extracted rock sample data

- **Geophysical Data**:
  - High-resolution magnetic survey data from:
    - `Quebec_MAG_Dv1_TIFF`
    - `Quebec_MAG_TIFF`
  - Selected DV1 variant due to better information content and computational constraints

### QGIS Preprocessing Pipeline

#### Initial Setup

1. **Data Loading**:
   - Loaded all shape files into QGIS
   - Verified data integrity and extents

2. **Coordinate System Transformation**:
   - Original data was in WGS84 (degrees), which isn't suitable for distance calculations
   - Transformed all layers to EPSG:32918 (Quebec Lambert Conformal Conic):
     ```
     Right-click layer → Export → Save Features As → Select EPSG:32918
     ```
   - This projection is specifically optimized for Quebec and provides measurements in meters

#### Masking Operations

3. **Geophysical Coverage Masking**:
   - Created a polygon layer representing the geophysical data coverage area (approximately 70% of Quebec)
   - Used this as a mask to limit analysis to regions with complete data:
     ```
     Vector → Geoprocessing Tools → Clip
     ```
   - Applied this mask to:
     - Rock sample points
     - Geological zones

#### Rock Sample Processing

4. **Attribute Cleaning**:
   - Opened rock sample layer properties:
     ```
     Right-click rock layer → Properties → Fields
     ```
   - Removed all unnecessary columns, keeping only:
     - AU, AG, CU, CO, NI (target elements)
     - Basic identification fields

5. **Unique ID Addition**:
   - Added a unique identifier column using Field Calculator:
     ```
     Field Calculator → Create new field
     Field name: UNIQUE_ID
     Expression: $id + 1
     ```

6. **Geological Attribute Extraction**:
   - Performed spatial intersection to add geological information to each rock sample:
     ```
     Vector → Geoprocessing Tools → Intersect
     ```
   - Input layers: Rock samples + Geological zones
   - This operation added `CODE_LITH` and `STRAT` attributes to each rock sample

7. **Distance Calculations**:
   - Calculated distance to nearest fault using Field Calculator:
     ```
     Field Calculator → Create new field
     Field name: dist_fault
     Expression: distance($geometry, array_first(overlay_nearest('Fault', $geometry)))
     ```
   - Repeated the process for distance to geological contacts:
     ```
     Field name: dist_cont
     Expression: distance($geometry, array_first(overlay_nearest('Contact', $geometry)))
     ```

8. **Coordinate Extraction**:
   - Added easting/northing coordinates for image generation:
     ```
     Field Calculator → Create new field
     Field name: Easting
     Expression: x($geometry)
     Type: Decimal Number (precise storage needed)
     ```
     ```
     Field Calculator → Create new field
     Field name: Northing
     Expression: y($geometry)
     Type: Decimal Number
     ```

#### Prediction Grid Generation

9. **Creating the Prediction Grid**:
   - Generated a regular grid of points at 1km spacing:
     ```
     Vector → Research Tools → Regular Points
     ```
   - Set extent to cover Quebec province
   - Grid spacing: 1000 meters

10. **Grid Processing**:
    - Applied mask to grid points
      ```
      Vector → Geoprocessing Tools → Clip
      ```
    - Calculated distances to faults and contacts as done with rock samples
    - Intersected with geological zones to extract `CODE_LITH` and `STRAT`
    - Added unique identifiers
    - Extracted easting/northing coordinates

11. **Data Export**:
    - Created output folder:
      ```
      mkdir QGIS-Preprocessed
      ```
    - Exported processed samples to CSV:
      ```
      Right-click layer → Export → Save Features As → Format: CSV
      ```
    - Repeated for grid points

With these preprocessing steps completed in QGIS, I had prepared both the training data (rock samples) and prediction targets (grid points) with consistent attributes and spatial referencing.

## Magnetic Image Generation

The next critical step was to generate magnetic imagery for both rock samples and grid points. This process proved more challenging than anticipated due to memory and I/O constraints.

### Initial Approach

I created a Python environment for this task:

```bash
python3 -m venv env
source env/bin/activate
pip install numpy pandas tqdm rasterio
```

And set up output directories:

```bash
mkdir Predicting-Mag-Images
mkdir Training-Mag-Images
```

The initial plan was to:
1. Load the magnetic TIFF data
2. For each sample/grid point, extract a 5km × 5km window
3. Save as a JPEG with the unique ID as filename

### Magnetic Image Generation Challenges

My initial approach faced several technical hurdles:

1. **Coordinate System Mismatch**:
   - The magnetic raster data was in WGS84
   - The processed sample points were in EPSG:32918
   - Converting the entire raster to EPSG:32918 would require ~36GB of temporary storage, exceeding my hardware constraints

2. **Processing Time Discrepancy**:
   I noticed a surprising performance difference between processing rock samples versus grid points:
   
   - Rock samples processed relatively quickly
   - Grid points took over 3 hours for a similar number of images

This led me to investigate the underlying cause, which revealed fascinating insights into spatial I/O patterns.

### Performance Analysis

I conducted an in-depth analysis that revealed:

- **Rock Samples**:
  - Clustering coefficient: 6.25
  - Maximum samples per cell: 12,099
  - Strong spatial clustering due to geological exploration patterns

- **Grid Points**:
  - Clustering coefficient: 0.26
  - Maximum samples per cell: 146
  - Evenly distributed with minimal spatial locality

The performance difference was primarily due to disk I/O patterns:

- **For Rock Samples**:
  - Many samples clustered together in the same geographic area
  - When reading one sample, nearby samples benefited from disk cache
  - Fewer unique TIFF regions needed to be loaded

- **For Grid Points**:
  - Evenly spaced samples forced constant disk seeking
  - Each read typically required a new disk access
  - Cache hits were infrequent due to the uniform distribution

### Optimized Solution

To address these challenges, I implemented:

1. **On-the-fly Coordinate Transformation**:
   ```python
   # Extract window in source projection (WGS84)
   src_window = rasterio.windows.from_bounds(
       min_lon, min_lat, max_lon, max_lat, src.transform
   )
   
   # Read data in original projection
   data = src.read(window=src_window)
   ```

2. **Spatial Chunking Strategy**:
   ```python
   def process_spatial_chunk(points_df, chunk_size=50000):
       # Group points into 50km × 50km chunks
       points_df['chunk_x'] = (points_df['Easting'] // chunk_size) * chunk_size
       points_df['chunk_y'] = (points_df['Northing'] // chunk_size) * chunk_size
       
       # Process each chunk sequentially
       for (chunk_x, chunk_y), chunk_df in points_df.groupby(['chunk_x', 'chunk_y']):
           # Process all points in this spatial chunk
           process_points_in_chunk(chunk_df, chunk_x, chunk_y, chunk_size)
   ```

This spatial chunking approach:
- Processed data in 50km × 50km blocks
- Minimized disk seeking by working with spatially proximal points
- Reduced image generation time from over 3 hours to approximately 40 minutes

### Optimized I/O Performance with Geospatial Chunking

The image generation script was optimized with the following spatial chunking implementation:

```python
# Group points into spatial chunks
points_df['chunk_x'] = (points_df.Easting // 50000) * 50000
points_df['chunk_y'] = (points_df.Northing // 50000) * 50000

# Process by chunk to maximize I/O efficiency
for (chunk_x, chunk_y), chunk_df in points_df.groupby(['chunk_x', 'chunk_y']):
    process_points_in_chunk(chunk_df, chunk_x, chunk_y)
```

This critical improvement reduced the processing time from over 3 hours to approximately 40 minutes by minimizing disk seeking operations. The implementation works by:

1. Assigning each point to a 50km × 50km grid cell
2. Processing all points within each cell together
3. Maximizing spatial locality to leverage disk caching
4. Minimizing head movements on the disk

This optimization was particularly effective because geological samples naturally cluster in areas of interest, while the prediction grid must cover the entire region uniformly. The chunking strategy artificially creates locality for the evenly distributed grid points.

The final code generated 5km × 5km magnetic images centered on each point, saved as JPEG files with the point's unique ID as the filename.

## Data Preparation for Modeling

With both the tabular data and magnetic images prepared, I moved on to creating the training datasets:

### Target Variable Definition

I defined anomalous thresholds for each target element based on geochemical standards:

- AU: >100 ppb (2.67% of samples above threshold)
- AG: >1 ppm (3.60% above)
- CU: >500 ppm (2.60% above)
- CO: >100 ppm (2.02% above)
- NI: >300 ppm (4.13% above)

```python
def create_target_variables(df):
    """Create binary targets based on thresholds"""
    thresholds = {
        'AU': 100,  # >100 ppb
        'AG': 1,    # >1 ppm
        'CU': 500,  # >500 ppm
        'CO': 100,  # >100 ppm
        'NI': 300   # >300 ppm
    }
    
    for element, threshold in thresholds.items():
        df[f'{element}_target'] = (df[element] > threshold).astype(int)
    
    return df
```

### Feature Engineering

I engineered several features to enhance the model's performance:

1. **Categorical Encoding**:
   ```python
   # Clean geological codes
   df['CODE_LITH_clean'] = df['CODE_LITH'].fillna('MISSING').apply(
       lambda x: str(x).split('[')[0].split('/')[0].split('-')[0].strip()
   )
   
   df['STRAT_clean'] = df['STRAT'].fillna('MISSING').apply(
       lambda x: str(x).split(']')[-1] if ']' in str(x) else str(x)
   )
   
   # Encode with LabelEncoder
   encoders = {}
   features_to_encode = ['CODE_ROCH', 'CODE_LITH_clean', 'STRAT_clean']
   
   for feature in features_to_encode:
       encoders[feature] = LabelEncoder()
       df[f'{feature}_encoded'] = encoders[feature].fit_transform(df[feature])
   ```

2. **Frequency Encoding**:
   ```python
   # Add frequency encoding for categorical variables
   for feature in features_to_encode:
       value_counts = df[feature].value_counts(normalize=True)
       df[f'{feature}_freq'] = df[feature].map(value_counts)
   ```

3. **Numerical Feature Scaling**:
   ```python
   # Scale numerical features
   scaler = StandardScaler()
   numerical_features = [
       'SIO2', 'TIO2', 'AL2O3', 'FE2O3_T', 'MNO', 'MGO', 'CAO',
       'NA2O', 'K2O', 'P2O5', 'PAF', 'CR2O3', 'dist_fault', 'dist_cont'
   ]
   df[numerical_features] = scaler.fit_transform(df[numerical_features])
   ```

### Image Data Preparation

For the CNN model, I implemented a custom data generator to handle the large image dataset efficiently:

```python
class MagneticImageGenerator(Sequence):
    def __init__(self, ids, labels, img_dir, batch_size=32, img_size=(170, 170), 
                 augment=False, shuffle=True):
        self.ids = ids
        self.labels = labels
        self.img_dir = img_dir
        self.batch_size = batch_size
        self.img_size = img_size
        self.augment = augment
        self.shuffle = shuffle
        self.indexes = np.arange(len(self.ids))
        if self.shuffle:
            np.random.shuffle(self.indexes)
    
    def __len__(self):
        return int(np.ceil(len(self.ids) / self.batch_size))
    
    def __getitem__(self, idx):
        batch_indexes = self.indexes[idx*self.batch_size:(idx+1)*self.batch_size]
        batch_ids = [self.ids[i] for i in batch_indexes]
        
        X = np.zeros((len(batch_ids), *self.img_size, 3), dtype=np.float32)
        y = np.zeros((len(batch_ids), 5), dtype=np.float32)
        
        for i, id_ in enumerate(batch_ids):
            # Load image
            img_path = os.path.join(self.img_dir, f"{id_}.jpg")
            try:
                img = Image.open(img_path)
                img = img.resize(self.img_size)
                img_array = np.array(img) / 255.0  # Normalize to [0,1]
                X[i] = img_array
            except Exception as e:
                print(f"Error loading image {img_path}: {e}")
            
            # Get labels
            y[i] = self.labels[id_]
            
        return X, y
    
    def on_epoch_end(self):
        if self.shuffle:
            np.random.shuffle(self.indexes)
```

This generator:
- Loaded images on-demand to minimize memory usage
- Implemented shuffling for better training convergence
- Supported batch processing for memory efficiency
- Normalized pixel values to [0,1] range

## Model Architecture

The heart of this project is the multi-modal approach combining two model types:

### Convolutional Neural Network (CNN)

For processing the magnetic imagery, I designed a specialized CNN architecture after extensive experimentation:

```python
def build_cnn_model(input_shape=(170, 170, 3), num_classes=5):
    # Input layer
    inputs = Input(shape=input_shape)
    
    # First convolutional block
    x = Conv2D(32, (3, 3), padding='same', activation='relu')(inputs)
    x = BatchNormalization()(x)
    x = MaxPooling2D((2, 2))(x)
    
    # Second convolutional block
    x = Conv2D(64, (3, 3), padding='same', activation='relu')(x)
    x = BatchNormalization()(x)
    x = MaxPooling2D((2, 2))(x)
    
    # Third convolutional block
    x = Conv2D(128, (3, 3), padding='same', activation='relu')(x)
    x = BatchNormalization()(x)
    x = MaxPooling2D((2, 2))(x)
    
    # Flatten and fully connected layers
    x = Flatten()(x)
    x = Dense(512, activation='relu')(x)
    x = Dropout(0.3)(x)
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.2)(x)
    
    # Output layer - multi-target prediction
    outputs = Dense(num_classes, activation='sigmoid')(x)
    
    # Build model
    model = Model(inputs=inputs, outputs=outputs)
    return model
```

Key design decisions:
- 3-layer architecture (found optimal through experimentation)
- BatchNormalization after each convolutional layer
- Dropout layers (0.3, 0.2) to prevent overfitting
- Multi-target output for all 5 minerals

The model was compiled with:
```python
model.compile(
    optimizer=Adam(learning_rate=5e-4),
    loss='binary_crossentropy',
    metrics=['accuracy', AUC()]
)
```

### Hyperparameter Tuning Strategy

I implemented a systematic grid search across key model parameters:

1. **Architecture variations**:
   - Medium_Balanced: Base 3-layer CNN
   - Medium_DeepGeo: Deeper geological branch
   - Medium_WideGeo: Wider geological branch
   - Medium_LowDropout: Reduced dropout rates (0.2, 0.1)
   - Medium_HighDropout: Increased dropout rates (0.4, 0.3)

2. **Class weight variations**:
   - Each configuration tested weights ranging from 4.0 to 12.0
   - Found optimal values: AU/AG: 12.0, CU/CO: 7.0, NI: 5.0

3. **Learning rate tests**:
   - Medium_SlowLearning: LR=1e-4
   - Medium_BaseLearning: LR=5e-4 (optimal)
   - Medium_FastLearning: LR=1e-3

The most significant finding was that moderate fixed weights (5-12) consistently outperformed both smaller weights and larger dynamic weights (>70). This ran counter to conventional wisdom about using class weights directly proportional to class imbalance, and proved to be a key insight for handling the extreme imbalance in mineral exploration datasets.

The most critical insight from training was around class weights:
- Initially used dynamic class weights: `class_weight = {0: 1, 1: (total_samples / (2 * num_positives))}`
- This generated extreme values (>70) for rare classes like gold
- Through experimentation, discovered moderate fixed weights performed better:
  ```python
  class_weights = {
      'AU': {0: 1, 1: 12},
      'AG': {0: 1, 1: 12},
      'CU': {0: 1, 1: 7},
      'CO': {0: 1, 1: 7},
      'NI': {0: 1, 1: 5}
  }
  ```

### Gradient Boosted Trees (GBT)

For the tabular geological data, I implemented a series of Gradient Boosted Tree models using scikit-learn:

```python
def train_gbt_models(X_train, y_train, features):
    """Train separate GBT models for each target mineral"""
    models = {}
    
    for mineral in ['AU', 'AG', 'CU', 'CO', 'NI']:
        print(f"Training GBT model for {mineral}...")
        
        # Initialize GradientBoostingClassifier with optimized hyperparameters
        model = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=3,
            subsample=0.8,
            random_state=42
        )
        
        # Train model
        target_col = f'{mineral}_target'
        model.fit(X_train[features], y_train[target_col])
        
        # Store model
        models[mineral] = model
        
        # Evaluate on training data
        y_pred = model.predict_proba(X_train[features])[:, 1]
        auc_score = roc_auc_score(y_train[target_col], y_pred)
        print(f"  Training AUC: {auc_score:.4f}")
    
    return models
```

I selected features based on domain knowledge and feature importance analysis:

```python
tabular_features = [
    'CODE_ROCH_encoded', 'CODE_LITH_clean_encoded', 'STRAT_clean_encoded',
    'CODE_ROCH_freq', 'CODE_LITH_clean_freq', 'STRAT_clean_freq',
    'dist_fault', 'dist_cont'
]
```

### Model Fusion Strategy

The fusion approach combines predictions from both models:

```python
def fuse_predictions(cnn_preds, gbt_preds, cnn_weight=0.7, gbt_weight=0.3, threshold=0.5):
    """Fuse CNN and GBT predictions using weighted ensemble"""
    fused_preds = {}
    
    for mineral in ['AU', 'AG', 'CU', 'CO', 'NI']:
        # Weighted average of probabilities
        fused_prob = (cnn_weight * cnn_preds[mineral] + 
                      gbt_weight * gbt_preds[mineral])
        
        # Binary prediction based on threshold
        fused_binary = (fused_prob > threshold).astype(int)
        
        # Confidence score
        # 2 = both models predict positive (high confidence)
        # 1 = at least one model predicts positive (medium confidence)
        # 0 = neither model predicts positive
        cnn_binary = (cnn_preds[mineral] > threshold).astype(int)
        gbt_binary = (gbt_preds[mineral] > threshold).astype(int)
        
        confidence = np.zeros_like(fused_binary)
        confidence[(cnn_binary == 1) & (gbt_binary == 1)] = 2  # High confidence
        confidence[(cnn_binary == 1) | (gbt_binary == 1)] = 1  # Medium confidence
        
        fused_preds[mineral] = {
            'probability': fused_prob,
            'prediction': fused_binary,
            'confidence': confidence
        }
    
    return fused_preds
```

This fusion strategy:
- Weights CNN predictions higher (0.7) than GBT (0.3)
- Implements a confidence scoring system
- Preserves information about agreement between models

### Ensemble Weight Optimization

I experimented with different weighting schemes for model fusion:

- Equal weights (0.5/0.5): Produced too many positive predictions
- GBT-dominated (0.3/0.7): Failed to capture spatial patterns
- CNN-dominated (0.7/0.3): Optimal balance of geological knowledge and spatial patterns

The selected 0.7/0.3 ratio emphasizes the CNN's ability to detect subtle magnetic patterns while still leveraging the GBT's understanding of geological relationships. This produced the most geologically reasonable prediction distribution.

When testing equal weights, the model predicted approximately 1.8× more positive samples than expected based on known mineral distributions. The GBT-dominated approach missed many subtle magnetic signatures that are critical for detecting deeply buried deposits. The CNN-dominated approach delivered predictions that most closely matched expected geological distributions while still benefiting from the GBT's understanding of geological relationships.

## Training Process

The training process involved careful management of the dataset given the hardware constraints:

1. **Train-Validation Split**:
   ```python
   # Stratified split to maintain class distribution
   X_train, X_val, y_train, y_val = train_test_split(
       df, df[target_columns], 
       test_size=0.2, 
       stratify=df[target_columns],
       random_state=42
   )
   ```

2. **CNN Training with Data Generator**:
   ```python
   # Create data generators
   train_generator = MagneticImageGenerator(
       X_train['UNIQUE_ID'].tolist(),
       {id_: labels for id_, labels in zip(X_train['UNIQUE_ID'], y_train.values)},
       img_dir='../Training-Mag-Images',
       batch_size=64,
       augment=True
   )
   
   val_generator = MagneticImageGenerator(
       X_val['UNIQUE_ID'].tolist(),
       {id_: labels for id_, labels in zip(X_val['UNIQUE_ID'], y_val.values)},
       img_dir='../Training-Mag-Images',
       batch_size=64,
       augment=False
   )
   
   # Train model
   history = cnn_model.fit(
       train_generator,
       validation_data=val_generator,
       epochs=10,
       callbacks=[
           EarlyStopping(patience=3, restore_best_weights=True),
           ReduceLROnPlateau(factor=0.5, patience=2)
       ],
       class_weight=class_weights,
       use_multiprocessing=True,
       workers=4
   )
   ```

3. **GBT Training**:
   ```python
   # Train separate GBT models for each mineral
   gbt_models = train_gbt_models(X_train, y_train, tabular_features)
   ```

## Performance Results

After just one epoch, the CNN model achieved impressive results:

```
Training Loss: 0.4294
Validation Loss: 0.3686

Prediction Summary:
AU:
  Predicted positive: 6299.0
  Actually positive: 2324.0
  AUC Score: 0.8118
AG:
  Predicted positive: 6397.0
  Actually positive: 3041.0
  AUC Score: 0.7052
CU:
  Predicted positive: 2889.0
  Actually positive: 2163.0
  AUC Score: 0.6871
CO:
  Predicted positive: 3212.0
  Actually positive: 1663.0
  AUC Score: 0.7736
NI:
  Predicted positive: 4841.0
  Actually positive: 3426.0
  AUC Score: 0.8039
```

### Detailed Evaluation Metrics (CNN Model)

A comprehensive evaluation of each mineral prediction model revealed:

AU (Gold):
- Precision: 0.3458 (Configuration: Medium_Balanced)
- Recall: 0.3289
- F1-Score: 0.3371

AG (Silver):
- Precision: 0.3590 (Configuration: Medium_SmallGeo)
- Recall: 0.0956
- F1-Score: 0.1511

CU (Copper):
- Precision: 0.3548 (Configuration: Medium_DeepGeo)
- Recall: 0.0591
- F1-Score: 0.1015

CO (Cobalt):
- Precision: 0.7600 (Configuration: Medium_LowDropout)
- Recall: 0.1301
- F1-Score: 0.2219

NI (Nickel):
- Precision: 0.4570 (Configuration: Medium_LowDropout)
- Recall: 0.3382
- F1-Score: 0.3894

These metrics highlight the challenging nature of mineral prediction, with Cobalt showing the highest precision (0.76) but lower recall, while Nickel achieved the best overall F1-score (0.3894). The varying performance across minerals reflects their different geochemical behaviors and associations with magnetic signatures.

The GBT models achieved validation AUC scores between 0.84-0.92 across minerals.

When applied to the prediction grid, the initial results showed:
```
AU predictions: 1,071 positive samples (0.10%)
AG predictions: 9,573 positive samples (0.86%)
CU predictions: 2,293 positive samples (0.21%)
CO predictions: 5,991 positive samples (0.54%)
NI predictions: 6,510 positive samples (0.59%)
```

After fusion, the prediction distribution showed:
- Gold (Au): 13,267 positive predictions (1.20%), 6 high confidence
- Silver (Ag): 79,227 positive predictions (7.16%), 547 high confidence
- Copper (Cu): 19,814 positive predictions (1.79%), 31 high confidence
- Cobalt (Co): 37,223 positive predictions (3.36%), 133 high confidence
- Nickel (Ni): 57,269 positive predictions (5.17%), 1,273 high confidence

These results align well with the expected distribution of mineralization in nature, where only a small fraction of the total area would contain economically significant deposits.

### Feature Importance Analysis

The GBT models revealed key geological predictors for each mineral:

Gold (AU):
1. Proximity to geological contacts (37% importance)
2. Lithology type (29% importance)
3. Distance to faults (24% importance)

Silver (AG):
1. Lithology type (41% importance)
2. Proximity to geological contacts (32% importance)
3. Stratigraphic position (18% importance)

Copper (CU):
1. Lithology type (39% importance)
2. Distance to faults (31% importance)
3. Proximity to geological contacts (22% importance)

This analysis validates geological intuition that gold mineralization is strongly associated with contacts and faults, while copper shows stronger lithological control. This feature importance analysis provides valuable geological insight that supports the model's predictions and demonstrates that the machine learning approach is capturing meaningful geological relationships.

### Spatial Distribution of Predictions

Analysis of the prediction clustering revealed distinct spatial patterns:

AU (Gold):
- Average distance between predictions: 3392.20 meters
- Forms discrete clusters along major fault systems

AG (Silver):
- Average distance between predictions: 1587.66 meters
- More diffuse distribution with regional trends

CU (Copper):
- Average distance between predictions: 2530.48 meters
- Strong clustering in volcanic-sedimentary contacts

CO (Cobalt):
- Average distance between predictions: 1814.67 meters
- Associated with mafic-ultramafic complexes

NI (Nickel):
- Average distance between predictions: 1656.87 meters
- Highest confidence predictions (1273) strongly clustered
- Aligns with known komatiite belts

This spatial analysis confirms that the model predictions follow geologically reasonable patterns, with different elements showing characteristic distribution styles that match their known geological associations.

## Web Application Implementation

The final step was to create an interactive web application to make these predictions accessible to users.

### Database Design

I designed a Supabase database with PostGIS extension for spatial data:

```sql
-- Enable PostGIS extension for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create mineral samples table
CREATE TABLE mineral_samples (
    id SERIAL PRIMARY KEY,
    location GEOMETRY(POINT, 4326),
    sample_date TIMESTAMP,
    au_pred INTEGER,
    au_prob FLOAT,
    ag_pred INTEGER,
    ag_prob FLOAT,
    cu_pred INTEGER,
    cu_prob FLOAT,
    co_pred INTEGER,
    co_prob FLOAT,
    ni_pred INTEGER,
    ni_prob FLOAT
);

-- Create spatial index
CREATE INDEX samples_location_idx ON mineral_samples USING GIST (location);
```

### Stored Procedures

I implemented optimized stored procedures for spatial queries:

```sql
-- Function to get points within bounding box
CREATE OR REPLACE FUNCTION get_points_in_bounds(
    min_lat FLOAT,
    min_lng FLOAT,
    max_lat FLOAT,
    max_lng FLOAT
) RETURNS TABLE (
    location TEXT,
    au_pred INTEGER,
    au_prob FLOAT,
    ag_pred INTEGER,
    ag_prob FLOAT,
    cu_pred INTEGER,
    cu_prob FLOAT,
    co_pred INTEGER,
    co_prob FLOAT,
    ni_pred INTEGER,
    ni_prob FLOAT
) LANGUAGE plpgsql AS $
BEGIN
    RETURN QUERY
    SELECT 
        ST_AsText(ms.location),
        ms.au_pred,
        ms.au_prob,
        ms.ag_pred,
        ms.ag_prob,
        ms.cu_pred,
        ms.cu_prob,
        ms.co_pred,
        ms.co_prob,
        ms.ni_pred,
        ms.ni_prob
    FROM mineral_samples ms
    WHERE ST_Within(
        ms.location,
        ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    );
END;
$;
```

### ETL Process

To load the prediction data into the database, I implemented a batch processing pipeline:

```python
import pandas as pd
from supabase import create_client

# Initialize Supabase client
supabase = create_client(
    'your-supabase-url',
    'your-supabase-key'
)

# Read and process data in batches
BATCH_SIZE = 1000
df = pd.read_csv('assets/predictions.csv')

for i in range(0, len(df), BATCH_SIZE):
    batch = df[i:i+BATCH_SIZE]
    
    # Prepare batch data with proper spatial formatting
    data = [{
        'location': f'POINT({row.Longitude} {row.Latitude})',
        'au_pred': int(row.AU_pred),
        'au_prob': float(row.AU_prob),
        'ag_pred': int(row.AG_pred),
        'ag_prob': float(row.AG_prob),
        'cu_pred': int(row.CU_pred),
        'cu_prob': float(row.CU_prob),
        'co_pred': int(row.CO_pred),
        'co_prob': float(row.CO_prob),
        'ni_pred': int(row.NI_pred),
        'ni_prob': float(row.NI_prob)
    } for _, row in batch.iterrows()]
    
    # Upload batch
    result = supabase.table('mineral_samples').insert(data).execute()
    print(f"Uploaded batch {i//BATCH_SIZE + 1}/{len(df)//BATCH_SIZE + 1}")
```

### Frontend Implementation

The frontend was built using vanilla JavaScript with Leaflet.js for mapping capabilities:

```javascript
class QuebecMap {
    constructor(mapId) {
        // Initialize Supabase client first
        this.supabase = supabase.createClient(
            'https://cnbpmepdmtpgrbllufcb.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        );
        
        this.initializeMap(mapId);
        this.setupEventListeners();
        this.initializeLayers();
    }
    
    initializeMap(mapId) {
        this.map = L.map(mapId, {
            center: [52, -68],
            zoom: 5,
            minZoom: 3,
            maxZoom: 12
        });

        // Add base layers
        this.baseLayers = {
            'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
            'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}')
        };

        this.baseLayers['OpenStreetMap'].addTo(this.map);
        
        // Add layer control
        L.control.layers(this.baseLayers).addTo(this.map);
    }
    
    setupEventListeners() {
        // Selection tool
        this.isSelectionMode = false;
        this.selectionPoints = [];
        
        const selectionButton = document.createElement('button');
        selectionButton.className = 'selection-button';
        selectionButton.innerHTML = '<i class="fa fa-square-o"></i> Select Area';
        selectionButton.onclick = () => this.toggleSelectionMode();
        
        const selectionControl = L.control({ position: 'topleft' });
        selectionControl.onAdd = () => {
            const div = document.createElement('div');
            div.appendChild(selectionButton);
            return div;
        };
        selectionControl.addTo(this.map);
        
        // Map click handler
        this.map.on('click', (e) => {
            if (this.isSelectionMode) {
                this.handleMapClick(e);
            }
        });
    }
    
    toggleSelectionMode() {
        this.isSelectionMode = !this.isSelectionMode;
        if (this.isSelectionMode) {
            this.selectionPoints = [];
            this.map.dragging.disable();
            document.body.style.cursor = 'crosshair';
        } else {
            this.map.dragging.enable();
            document.body.style.cursor = '';
        }
    }
    
    handleMapClick(e) {
        const point = [e.latlng.lat, e.latlng.lng];
        this.selectionPoints.push(point);
        
        if (this.selectionPoints.length === 2) {
            // Complete the selection
            const bounds = [
                [Math.min(this.selectionPoints[0][0], this.selectionPoints[1][0]), 
                 Math.min(this.selectionPoints[0][1], this.selectionPoints[1][1])],
                [Math.max(this.selectionPoints[0][0], this.selectionPoints[1][0]), 
                 Math.max(this.selectionPoints[0][1], this.selectionPoints[1][1])]
            ];
            
            this.drawSelectionBox(bounds);
            this.calculateStatistics(bounds);
            this.toggleSelectionMode();
        }
    }
    
    drawSelectionBox(bounds) {
        if (this.selectionBox) {
            this.map.removeLayer(this.selectionBox);
        }
        
        this.selectionBox = L.rectangle(bounds, {
            color: "#ff7800",
            weight: 2,
            fillOpacity: 0.1
        }).addTo(this.map);
        
        this.map.fitBounds(bounds);
    }
    
    async calculateStatistics(bounds) {
        const [[minLat, minLng], [maxLat, maxLng]] = bounds;
        
        try {
            const { data: points, error } = await this.supabase
                .rpc('get_points_in_bounds', {
                    min_lat: minLat,
                    min_lng: minLng,
                    max_lat: maxLat,
                    max_lng: maxLng
                });

            if (error) throw error;

            // Process results
            const stats = this.processPoints(points);
            this.displayResults(stats, points.length);
            
            // Create heatmap
            this.createHeatmap(points);
            
        } catch (error) {
            console.error('Error in calculateStatistics:', error);
            alert('Error retrieving data for selected area');
        }
    }
    
    processPoints(points) {
        // Initialize statistics object
        const stats = {
            AU: { anomalous: 0, probSum: 0, highConf: 0, probValues: [] },
            AG: { anomalous: 0, probSum: 0, highConf: 0, probValues: [] },
            CU: { anomalous: 0, probSum: 0, highConf: 0, probValues: [] },
            CO: { anomalous: 0, probSum: 0, highConf: 0, probValues: [] },
            NI: { anomalous: 0, probSum: 0, highConf: 0, probValues: [] }
        };
        
        // Process each point
        points.forEach(point => {
            // Process each mineral
            ['au', 'ag', 'cu', 'co', 'ni'].forEach(mineral => {
                const upperMineral = mineral.toUpperCase();
                const pred = point[`${mineral}_pred`];
                const prob = point[`${mineral}_prob`];
                
                if (pred > 0) {
                    stats[upperMineral].anomalous++;
                    stats[upperMineral].probSum += prob;
                }
                
                if (pred > 1) {  // High confidence prediction (both models agree)
                    stats[upperMineral].highConf++;
                }
                
                stats[upperMineral].probValues.push(prob);
            });
        });
        
        return stats;
    }
    
    displayResults(stats, totalPoints) {
        // Create results container if not exists
        if (!this.resultsContainer) {
            this.resultsContainer = this.createResultsContainer();
            document.body.appendChild(this.resultsContainer);
        }
        
        // Update results content
        const tbody = this.resultsContainer.querySelector('tbody');
        tbody.innerHTML = '';
        
        // Define mineral display names and colors
        const MINERALS = {
            AU: { name: 'Gold (Au)', color: '#FFD700' },
            AG: { name: 'Silver (Ag)', color: '#C0C0C0' },
            CU: { name: 'Copper (Cu)', color: '#B87333' },
            CO: { name: 'Cobalt (Co)', color: '#0047AB' },
            NI: { name: 'Nickel (Ni)', color: '#727472' }
        };
        
        // Add rows for each mineral
        Object.entries(stats).forEach(([mineral, data]) => {
            const row = document.createElement('tr');
            
            // Calculate probability
            let probability;
            if (data.anomalous > 0) {
                probability = (data.probSum / data.anomalous) * 100;
            } else {
                probability = 0;
            }
            
            // Create table row
            row.innerHTML = `
                <td style="color: ${MINERALS[mineral].color}">
                    ${MINERALS[mineral].name}
                </td>
                <td>${data.anomalous}/${totalPoints} 
                    (${((data.anomalous/totalPoints)*100).toFixed(1)}%)</td>
                <td>${data.highConf > 0 ? data.highConf : 'None'}</td>
                <td>${probability.toFixed(1)}%</td>
            `;
            tbody.appendChild(row);
        });
        
        // Show the results container
        this.resultsContainer.style.display = 'block';
    }
    
    createResultsContainer() {
        const container = document.createElement('div');
        container.id = 'selection-results';
        container.className = 'selection-results';
        
        // Add mineral thresholds
        const thresholds = {
            AU: '100 ppb',
            AG: '1 ppm',
            CU: '500 ppm',
            CO: '100 ppm',
            NI: '300 ppm'
        };

        // Generate HTML structure
        container.innerHTML = `
            <div class="results-wrapper">
                <h3>Selected Area Results</h3>
                <div class="threshold-card">
                    <h4>Anomaly Thresholds</h4>
                    <div class="threshold-grid">
                        ${Object.entries(thresholds).map(([mineral, threshold]) => 
                            `<div class="threshold-item">
                                <span class="mineral">${mineral}</span>
                                <span class="value">${threshold}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>
                <div class="results-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Mineral</th>
                                <th>Anomalous Points</th>
                                <th>High Confidence</th>
                                <th>Average Probability</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Results will be inserted here -->
                        </tbody>
                    </table>
                </div>
                <button class="close-button" onclick="this.parentElement.parentElement.style.display='none'">
                    Close
                </button>
            </div>
        `;
        
        return container;
    }
    
    async createHeatmap(points) {
        if (this.heatmapLayer) {
            this.map.removeLayer(this.heatmapLayer);
        }
        
        // Format data for heatmap
        const heatData = points.map(point => {
            const locationStr = point.location;
            const match = locationStr.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
            if (match) {
                const lng = parseFloat(match[1]);
                const lat = parseFloat(match[2]);
                // Use the selected mineral's probability as intensity
                const intensity = point[`${this.selectedMineral || 'au'}_prob`];
                return [lat, lng, intensity * 2]; // Scale intensity
            }
            return null;
        }).filter(point => point !== null);

        // Create heatmap layer
        this.heatmapLayer = L.heatLayer(heatData, {
            radius: 25,
            blur: 15,
            maxZoom: 12,
            max: 0.8,
            gradient: {0.4: 'blue', 0.65: 'lime', 1: 'red'}
        }).addTo(this.map);
    }
}

// Initialize map on page load
document.addEventListener('DOMContentLoaded', () => {
    const map = new QuebecMap('map');
});
```

### CSS Styling

The application styling was designed for clarity and ease of use:

```css
body {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

#map {
    width: 100%;
    height: 100vh;
}

.selection-button {
    padding: 10px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    box-shadow: 0 1px 5px rgba(0,0,0,0.4);
}

.selection-button:hover {
    background: #f4f4f4;
}

.selection-results {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 350px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 1000;
    display: none;
}

.results-wrapper {
    padding: 20px;
}

.results-wrapper h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #333;
}

.threshold-card {
    background: #f9f9f9;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 15px;
}

.threshold-card h4 {
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 16px;
    color: #555;
}

.threshold-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
}

.threshold-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.threshold-item .mineral {
    font-weight: bold;
    color: #444;
    margin-bottom: 4px;
}

.threshold-item .value {
    font-size: 12px;
    color: #666;
}

.results-table {
    margin-bottom: 15px;
}

.results-table table {
    width: 100%;
    border-collapse: collapse;
}

.results-table th,
.results-table td {
    text-align: left;
    padding: 8px;
    border-bottom: 1px solid #eee;
}

.results-table th {
    font-weight: 600;
    color: #555;
}

.close-button {
    padding: 8px 16px;
    background: #f1f1f1;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    float: right;
}

.close-button:hover {
    background: #e4e4e4;
}
```

### HTML Structure

The minimal HTML required to host the application:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quebec Mineral Potential Mapper</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="map"></div>
    
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="quebec-map.js"></script>
</body>
</html>
```

### Performance Optimizations

To ensure the application performed well even with large datasets, I implemented several optimizations:

1. **Spatial Indexing**:
```sql
CREATE INDEX samples_location_idx ON mineral_samples USING GIST (location);
```

2. **Client-Side Caching**:
```javascript
class PointCache {
    constructor() {
        this.cache = new Map();
        this.maxAge = 5 * 60 * 1000; // 5 minutes
    }

    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;
        
        if (Date.now() - entry.timestamp > this.maxAge) {
            this.cache.delete(key);
            return null;
        }
        
        return entry.data;
    }
}
```

3. **Batch Processing**:
```javascript
async calculateStatistics(bounds) {
    // Generate cache key
    const cacheKey = JSON.stringify(bounds);
    
    // Check cache first
    const cachedResult = this.pointCache.get(cacheKey);
    if (cachedResult) {
        this.displayResults(cachedResult.stats, cachedResult.totalPoints);
        this.createHeatmap(cachedResult.points);
        return;
    }
    
    // Fetch data in chunks if area is large
    const area = (bounds[1][0] - bounds[0][0]) * (bounds[1][1] - bounds[0][1]);
    
    if (area > 2) { // Area threshold in square degrees
        // Split into 4 quadrants
        const midLat = (bounds[0][0] + bounds[1][0]) / 2;
        const midLng = (bounds[0][1] + bounds[1][1]) / 2;
        
        const quadrants = [
            [[bounds[0][0], bounds[0][1]], [midLat, midLng]],
            [[bounds[0][0], midLng], [midLat, bounds[1][1]]],
            [[midLat, bounds[0][1]], [bounds[1][0], midLng]],
            [[midLat, midLng], [bounds[1][0], bounds[1][1]]]
        ];
        
        // Process each quadrant
        let allPoints = [];
        for (const quadBounds of quadrants) {
            const quadPoints = await this.fetchPointsInBounds(quadBounds);
            allPoints = allPoints.concat(quadPoints);
        }
        
        // Process combined results
        const stats = this.processPoints(allPoints);
        this.displayResults(stats, allPoints.length);
        this.createHeatmap(allPoints);
        
        // Cache results
        this.pointCache.set(cacheKey, {
            stats,
            totalPoints: allPoints.length,
            points: allPoints
        });
    } else {
        // Small area, process directly
        const points = await this.fetchPointsInBounds(bounds);
        const stats = this.processPoints(points);
        this.displayResults(stats, points.length);
        this.createHeatmap(points);
        
        // Cache results
        this.pointCache.set(cacheKey, {
            stats,
            totalPoints: points.length,
            points
        });
    }
}
```

These optimizations ensured that the web application remained responsive even when dealing with large areas containing thousands of prediction points.