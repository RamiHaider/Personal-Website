import numpy as np
import matplotlib.pyplot as plt
import pandas as pd

x_input = np.linspace((-2*np.pi), (2*np.pi), 4000)
x = 2 * ((x_input - min(x_input)) / ( max(x_input) - min(x_input) )) - 1
x = x.reshape(4000,1)
y = np.sin(x)

n = [3, 6, 1]

W1 = np.random.randn(n[1], n[0])
W2 = np.random.randn(n[2], n[1])
W3 = np.random.randn(n[3], n[2])

b1 = np.random.randn(n[1],1)
b2 = np.random.randn(n[2],1)
b3 = np.random.randn(n[3],1)


input = [1,
         4,
         5,
         6]

# input = [4,1] matrix

#architecture = [2, 3, 1]


#input > hidden layer 1 > hidden layer 2 > output

#hidden 1 = []

A0 = input.T

#Output of the first layer =

z1 = W1 * x + b1
print(f"z1 shape: {np.shape(z1)}")

print(f"W1 shape: {np.shape(W1)}")
print(f"x shape: {np.shape(x)}")






#feed forward proces
#tanh function = np.tanh(x)

# a1 = W1 * x1
# print(np.shape(a1))

# random_weight = np.random.randn(3, 2)
# random_input = np.random.randn(2, 1)
# print(np.shape(random_weight))
# print(np.shape(random_input))

# result = np.matmul(random_weight, random_input)
# print(np.shape(result))

x = [1,2,3,4,5,6,7]

x = np.array([x])

shuffled_x = np.random.shuffle(x)

print(shuffled_x)




