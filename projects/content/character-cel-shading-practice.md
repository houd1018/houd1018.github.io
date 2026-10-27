:::hero
![Toon shader on a character](media:2024/04/Toon.gif)
:::

:::overview
An exercise in the basic principles of a cel-style toon shader in the Unity URP and Built-in pipelines.

- Outline via normal expansion, with a normal smoothing algorithm to smooth the outline
- Stencil buffer and render objects control the rendering order for the external outline
- Multi-level shadows based on the Lambert lighting model, supporting ramp maps and shadow maps, plus a ramp texture generation tool in Unity
- Cel shading with smoothstep controlling shadow softness; rim light by Fresnel, specular by Blinn-Phong, and bloom
:::

:::meta
Tools: Unity URP / Built-in, C#, HLSL, Houdini
Breakdown: [Implementation details](../blog/post.html?slug=toon-shader)
:::

## Details

:::row
### Outline
![Outline rendered after opaque objects](media:2024/04/20240401172952.jpg "Render outline after opaque objects")
:::

:::row
### Shadow levels
![Lambert model with two shadow levels](media:2024/04/20240401204514.jpg "Lambert model with shadow level 2")
:::
