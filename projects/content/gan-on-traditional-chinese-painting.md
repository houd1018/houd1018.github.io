:::hero
![GAN-generated traditional Chinese paintings](media:2022/08/未标题-1.jpg)
:::

:::overview
In recent years, AI art has been one of the newest developments in the field, with a variety of cutting-edge tools. AI art can transfer the style of one image to another, create new paintings, restore old pictures, improve the resolution of videos and more. To some extent, AI has proven its ability to be creative by generating new samples that have not been seen before. In this project we study several deep learning models to create new Chinese paintings, improving on the traditional AI art architecture based on Generative Adversarial Networks (GAN).

The project is inspired by the [work](https://arxiv.org/abs/2011.05552) of Alice Xue (WACV 2021). I implemented different GAN variants on Chinese paintings and tried [Stable Diffusion](https://github.com/CompVis/stable-diffusion) for style transfer:

- DCGAN
- WGAN-GP
- CycleGAN
- SAPGAN: Sketch-And-Paint GAN
:::

:::meta
Date: 2022 spring
Code: [GitHub](https://github.com/houd1018/GAN-ChinesePainting)
:::

:::row
### DCGAN
![DCGAN generated paintings](media:2022/10/DCGAN_1.gif)
:::

:::row
### WGAN-GP
![WGAN-GP generated paintings](media:2022/10/WGAN-GP.png)
:::

### CycleGAN – style transfer & coloring

:::gallery 2
![CycleGAN result 1](media:2022/10/Figure_2.png)
![CycleGAN result 2](media:2022/10/Figure_3.png)
![CycleGAN result 3](media:2022/10/Figure_4.png)
![CycleGAN result 4](media:2022/10/Figure_1.png)
:::

:::row
### SAPGAN: Sketch-And-Paint GAN
![SAPGAN generated paintings](media:2023/01/763z0r.gif)
:::

:::row
### Stable Diffusion – style transfer
![Landscape input](media:2022/10/landscape-1.png)
![Stable Diffusion style transfer](media:2022/10/stable-diffusion.gif)
:::
