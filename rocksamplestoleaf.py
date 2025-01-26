import pandas as pd
from supabase import create_client
import os
from dotenv import load_dotenv
from tqdm import tqdm

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_KEY')
)

print("Reading CSV file...")
df = pd.read_csv('assets/samples.csv')
total_records = len(df)
print(f"Found {total_records} records")

# Upload data in batches
BATCH_SIZE = 1000
successful_uploads = 0
failed_batches = []

try:
    for i in tqdm(range(0, len(df), BATCH_SIZE), desc="Uploading batches"):
        batch = df.iloc[i:i+BATCH_SIZE]
        
        # Prepare batch data
        data = [
            {
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
            }
            for _, row in batch.iterrows()
        ]
        
        try:
            # Upload batch
            result = supabase.table('mineral_samples').insert(data).execute()
            successful_uploads += len(batch)
            
        except Exception as e:
            print(f"\nError uploading batch starting at index {i}: {str(e)}")
            failed_batches.append(i)
            continue

except KeyboardInterrupt:
    print("\nUpload interrupted by user")

finally:
    print(f"\nUpload completed:")
    print(f"Successfully uploaded: {successful_uploads} records")
    if failed_batches:
        print(f"Failed batches starting at indices: {failed_batches}")
    else:
        print("All batches uploaded successfully!")