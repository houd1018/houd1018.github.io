:::overview
This project uses a Siamese network to implement few-shot learning. A dataset of five different Pokémon is used to train the model. Given a picture of a new category of Pokémon, its type can be identified with the help of a support set: the model finds the image in the dataset closest to the input.

- **Few-shot learning:** a machine learning method where the training data contains limited information; a small support set helps classify.
- **Siamese network:** a neural network that uses the same weights on two different inputs to compute comparable output vectors.
:::

:::meta
Context: WKU Student Research Day · 2022 spring
Framework: PyTorch
Architecture: VGG-16
Loss: Binary cross-entropy
Optimizer: Adam, initial lr = 1e-4
Input: 105 × 105 × 3
Training: 1500 images · 0.9 train ratio · batch 32 · 100 epochs
:::

:::gallery 3
![Siamese network diagram](media:2022/08/1.jpg)
![Training results](media:2022/08/2.png)
![Few-shot classification example](media:2022/08/图片1.png)
:::

## References

- Fei-Fei, Fergus, & Perona. One-shot learning of object categories. IEEE Transactions on PAMI, 2006.
- Bromley et al. Signature verification using a Siamese time delay neural network. In NIPS, 1994.
- Koch, Zemel, & Salakhutdinov. Siamese neural networks for one-shot image recognition. In ICML, 2015.
