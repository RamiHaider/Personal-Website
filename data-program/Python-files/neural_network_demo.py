import numpy as np
import matplotlib.pyplot as plt
import time

class SimpleNeuralNetwork:
    def __init__(self, learning_rate=0.01):
        # Initialize weights and bias
        self.w = 1.0  # initial weight
        self.b = 0.0  # initial bias
        self.learning_rate = learning_rate
        self.history = []
        
    def forward_pass(self, x, y_true):
        """Forward pass: compute prediction and loss"""
        print("🔵 FORWARD PASS")
        print("=" * 50)
        
        # Compute prediction
        y_pred = self.w * x + self.b
        print(f"Input: x = {x}")
        print(f"True value: y = {y_true}")
        print(f"Weight: w = {self.w:.4f}")
        print(f"Bias: b = {self.b:.4f}")
        print(f"Prediction: ŷ = w·x + b = {self.w:.4f} * {x} + {self.b:.4f} = {y_pred:.4f}")
        
        # Compute loss (MSE)
        loss = (y_pred - y_true) ** 2
        print(f"Loss: L = (ŷ - y)² = ({y_pred:.4f} - {y_true})² = {loss:.4f}")
        print()
        
        return y_pred, loss
    
    def backward_pass(self, x, y_true, y_pred):
        """Backward pass: compute gradients"""
        print("🔁 BACKWARD PASS")
        print("=" * 50)
        
        # Compute gradients using chain rule
        dL_dy_pred = 2 * (y_pred - y_true)  # derivative of MSE loss
        dy_pred_dw = x                      # derivative of linear function w.r.t weight
        dy_pred_db = 1                      # derivative of linear function w.r.t bias
        
        # Chain rule for weight gradient
        dL_dw = dL_dy_pred * dy_pred_dw
        # Chain rule for bias gradient
        dL_db = dL_dy_pred * dy_pred_db
        
        print(f"∂L/∂ŷ = 2(ŷ - y) = 2({y_pred:.4f} - {y_true}) = {dL_dy_pred:.4f}")
        print(f"∂ŷ/∂w = x = {x}")
        print(f"∂ŷ/∂b = 1")
        print(f"∂L/∂w = ∂L/∂ŷ * ∂ŷ/∂w = {dL_dy_pred:.4f} * {x} = {dL_dw:.4f}")
        print(f"∂L/∂b = ∂L/∂ŷ * ∂ŷ/∂b = {dL_dy_pred:.4f} * 1 = {dL_db:.4f}")
        print()
        
        return dL_dw, dL_db
    
    def update_weights(self, dL_dw, dL_db):
        """Update weights and bias using gradients"""
        print("✏️ UPDATE WEIGHTS")
        print("=" * 50)
        
        # Store old values for display
        w_old = self.w
        b_old = self.b
        
        # Update weights using gradient descent
        self.w = self.w - self.learning_rate * dL_dw
        self.b = self.b - self.learning_rate * dL_db
        
        print(f"Learning rate: η = {self.learning_rate}")
        print(f"w_new = w - η * ∂L/∂w = {w_old:.4f} - {self.learning_rate} * {dL_dw:.4f} = {self.w:.4f}")
        print(f"b_new = b - η * ∂L/∂b = {b_old:.4f} - {self.learning_rate} * {dL_db:.4f} = {self.b:.4f}")
        print(f"Updated model: ŷ = {self.w:.4f} * x + {self.b:.4f}")
        print()
        
    def train_step(self, x, y_true):
        """Complete training step: forward pass, backward pass, and weight update"""
        print(f"🚀 TRAINING STEP")
        print("=" * 60)
        
        # Forward pass
        y_pred, loss = self.forward_pass(x, y_true)
        
        # Backward pass
        dL_dw, dL_db = self.backward_pass(x, y_true, y_pred)
        
        # Update weights
        self.update_weights(dL_dw, dL_db)
        
        # Store history
        self.history.append({
            'w': self.w,
            'b': self.b,
            'loss': loss,
            'y_pred': y_pred
        })
        
        return loss
    
    def train(self, data, epochs=5):
        """Train the model for multiple epochs"""
        print("🎯 TRAINING STARTED")
        print("=" * 60)
        print(f"Training for {epochs} epochs with {len(data)} data points")
        print()
        
        for epoch in range(epochs):
            print(f"📊 EPOCH {epoch + 1}/{epochs}")
            print("=" * 60)
            
            epoch_loss = 0
            for i, (x, y) in enumerate(data):
                print(f"Data point {i + 1}: x={x}, y={y}")
                loss = self.train_step(x, y)
                epoch_loss += loss
                
                if i < len(data) - 1:  # Don't print separator after last data point
                    print("─" * 60)
            
            avg_loss = epoch_loss / len(data)
            print(f"📈 Epoch {epoch + 1} Average Loss: {avg_loss:.6f}")
            print("=" * 60)
            print()
            
            # Add a small delay to make it easier to read
            time.sleep(1)
    
    def visualize_training(self):
        """Visualize the training progress"""
        if not self.history:
            print("No training history to visualize!")
            return
            
        epochs = range(1, len(self.history) + 1)
        weights = [h['w'] for h in self.history]
        biases = [h['b'] for h in self.history]
        losses = [h['loss'] for h in self.history]
        
        fig, (ax1, ax2, ax3) = plt.subplots(1, 3, figsize=(15, 5))
        
        # Plot weights
        ax1.plot(epochs, weights, 'b-o', linewidth=2, markersize=6)
        ax1.set_title('Weight Evolution')
        ax1.set_xlabel('Training Step')
        ax1.set_ylabel('Weight (w)')
        ax1.grid(True)
        
        # Plot biases
        ax2.plot(epochs, biases, 'r-o', linewidth=2, markersize=6)
        ax2.set_title('Bias Evolution')
        ax2.set_xlabel('Training Step')
        ax2.set_ylabel('Bias (b)')
        ax2.grid(True)
        
        # Plot loss
        ax3.plot(epochs, losses, 'g-o', linewidth=2, markersize=6)
        ax3.set_title('Loss Evolution')
        ax3.set_xlabel('Training Step')
        ax3.set_ylabel('Loss (MSE)')
        ax3.grid(True)
        
        plt.tight_layout()
        plt.show()
    
    def test_model(self, x_test):
        """Test the trained model"""
        print("🧪 TESTING MODEL")
        print("=" * 50)
        
        y_pred = self.w * x_test + self.b
        print(f"Input: x = {x_test}")
        print(f"Prediction: ŷ = {self.w:.4f} * {x_test} + {self.b:.4f} = {y_pred:.4f}")
        print()
        return y_pred

# Example usage
if __name__ == "__main__":
    # Create training data: (x, y) pairs
    training_data = [
        (2, 5),   # y = 2.5x (approximately)
        (4, 10),
        (1, 2.5),
        (3, 7.5)
    ]
    
    # Create and train the model
    model = SimpleNeuralNetwork(learning_rate=0.01)
    model.train(training_data, epochs=3)
    
    # Test the model
    test_x = 5
    prediction = model.test_model(test_x)
    
    # Visualize training progress
    model.visualize_training()
    
    print("🎉 Training completed! The model has learned to approximate the relationship y ≈ 2.5x") 