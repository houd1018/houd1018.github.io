:::hero
![Interactive sand desert scene](media:2024/04/Sand-1.gif)
:::

:::overview
Shader practice in URP using HLSL. Some assets are free assets found online.

- Tessellation based on camera distance, using a hull shader and a domain shader
- A noise map used as displacement along the normal to offset vertices
- A RenderTexture, particle system and orthographic camera track the character, moving vertices along the normal
- Multiple lights, casting and receiving shadows, and a sand sparkle effect sampled from a noise map
:::

:::meta
Tools: Unity URP, HLSL
Breakdown: [Implementation details](../blog/post.html?slug=interactive-desert)
:::

## Demo

![Interactive sand demo video](media:2024/04/【测试展示】技术美术_原神（渲染向）-侯大洲.mp4)
