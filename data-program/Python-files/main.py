#plotting a sin graph

import numpy as np
import matplotlib.pyplot as plt
import os
import torch
from torch import nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

device = torch.accelerator.current_accelerator().type if torch.accelerator.is_available() else "cpu"
print(f"Using {device} device")

x = np.linspace((-2*np.pi), (2*np.pi), 4000)
x1 = 2 * ((x - min(x)) / ( max(x) - min(x) )) - 1
y = np.sin(x)

# plt.plot(x1,y)
# plt.show()

# print(x)
# print(y)

# print(len(x)) - Outputs 400

# def neural_net(x1,y):

import torch
import torch.nn as nn
import torch.nn.functional as F

class SimpleNet(nn.Module):
    def __init__(self):
        super(SimpleNet, self).__init__()
        self.fc1 = nn.Linear(10, 20)  # Input layer
        self.fc2 = nn.Linear(20, 10)  # Hidden layer
        self.fc3 = nn.Linear(10, 2)   # Output layer

    def forward(self, x):
        x = F.tanh(self.fc1(x)) # Apply tanh after the first linear layer
        x = F.tanh(self.fc2(x)) # Apply tanh after the second linear layer
        x = self.fc3(x)
        return x
a
# Create an instance of the network
model = SimpleNet()
print(SimpleNet)
    

