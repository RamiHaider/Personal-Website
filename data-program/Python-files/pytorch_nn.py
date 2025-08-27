#plotting a sin graph
import copy
import time
from tqdm import tqdm
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.model_selection import train_test_split

x = np.linspace((-2*np.pi), (2*np.pi), 4000)
x1 = 2 * ((x - min(x)) / ( max(x) - min(x) )) - 1
y = np.sin(x)

X_train, X_test, y_train, y_test = train_test_split(x1, y, test_size=0.2, random_state=42, shuffle=True)

#Convert to 2D PyTorch tensors
X_train = torch.tensor(X_train, dtype=torch.float32).reshape(-1, 1)
y_train = torch.tensor(y_train, dtype=torch.float32).reshape(-1, 1)
X_test = torch.tensor(X_test, dtype=torch.float32).reshape(-1, 1)
y_test = torch.tensor(y_test, dtype=torch.float32).reshape(-1, 1)

# Define the model
model = nn.Sequential(
    nn.Linear(1, 32),
    nn.Tanh(),
    nn.Linear(32, 16),
    nn.Tanh(),
    nn.Linear(16, 8),
    nn.Tanh(),
    nn.Linear(8, 1)
)

loss_fn = nn.MSELoss()  # mean square error
optimizer = optim.Adam(model.parameters(), lr=0.0001)

n_epochs = 300   # number of epochs to run
batch_size = 100  # size of each batch
batch_start = torch.arange(0, len(X_train), batch_size)
 
# Hold the best model
best_mse = np.inf   # init to infinity
best_weights = None
history = []

print(f"Starting training for {n_epochs} epochs...")
start_time = time.time()

for epoch in range(n_epochs):
    epoch_start = time.time()
    model.train()
    total_loss = 0
    n_batches = 0
    
    with tqdm(batch_start, unit="batch", desc=f"Epoch {epoch+1}/{n_epochs}") as bar:
        for start in bar:
            # take a batch
            X_batch = X_train[start:start+batch_size]
            y_batch = y_train[start:start+batch_size]
            # forward pass
            y_pred = model(X_batch)
            loss = loss_fn(y_pred, y_batch)
            # backward pass
            optimizer.zero_grad()
            loss.backward()
            # update weights
            optimizer.step()
            # track progress
            total_loss += loss.item()
            n_batches += 1
            bar.set_postfix({
                'loss': f'{loss.item():.4f}',
                'avg_loss': f'{total_loss/n_batches:.4f}'
            })
    
    # evaluate accuracy at end of each epoch
    model.eval()
    with torch.no_grad():
        y_pred = model(X_test)
        mse = loss_fn(y_pred, y_test)
        mse = float(mse)
        history.append(mse)
        
    epoch_time = time.time() - epoch_start
    if mse < best_mse:
        best_mse = mse
        best_weights = copy.deepcopy(model.state_dict())
        print(f"\nEpoch {epoch+1}/{n_epochs} - MSE: {mse:.6f} (New Best!) - Time: {epoch_time:.2f}s")
    else:
        print(f"\nEpoch {epoch+1}/{n_epochs} - MSE: {mse:.6f} - Time: {epoch_time:.2f}s")

total_time = time.time() - start_time
print(f"\nTraining completed in {total_time:.2f} seconds")
print(f"Best MSE: {best_mse:.6f}")
print(f"Best RMSE: {np.sqrt(best_mse):.6f}")

# restore model and return best accuracy
model.load_state_dict(best_weights)
print("MSE: %.2f" % best_mse)
print("RMSE: %.2f" % np.sqrt(best_mse))
plt.plot(history)
plt.title('Training Loss History')
plt.xlabel('Epoch')
plt.ylabel('MSE')
plt.show()

# Generate points for visualization
x_vis = np.linspace(-2*np.pi, 2*np.pi, 1000)
x_vis_normalized = 2 * ((x_vis - min(x_vis)) / (max(x_vis) - min(x_vis))) - 1
y_true = np.sin(x_vis)

# Convert to tensor and make predictions
x_vis_tensor = torch.tensor(x_vis_normalized, dtype=torch.float32).reshape(-1, 1)
model.eval()
with torch.no_grad():
    y_pred = model(x_vis_tensor)
    y_pred = y_pred.numpy()

# Create the comparison plot
plt.figure(figsize=(10, 6))
plt.plot(x_vis, y_true, label='True sin(x)', color='blue')
plt.plot(x_vis, y_pred, label='Model predictions', color='red', linestyle='--')
plt.title('Sine Function Approximation')
plt.xlabel('x')
plt.ylabel('sin(x)')
plt.legend()
plt.grid(True)
plt.show()
    

