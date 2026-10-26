## Material Graph Basic

- `Panner`: The **Panner** expression outputs UV texture coordinates that can be used to create panning, or moving, textures.

![](media:blog/pic/panner.png)

- `Sine_Remapped`

  

![](media:blog/pic/sineRemapped.png)

![](media:blog/pic/fireball.png)

![](media:blog/pic/fireball.gif)

## Dissolve

- `Name reroutes`
- `CheapContrast`
- `Append`

![](media:blog/pic/Dissolve.png)

![](media:blog/pic/Dissolve.gif)

### BP_Collision

![](media:blog/pic/Dissolve_test.gif)

**Dissolve Control**

![](media:blog/pic/20240309180935.png)

**Jumping pad**

![](media:blog/pic/20240309181029.png)

## Advanced Material

### UV Control

![](media:blog/pic/20240309195836.png)

### Color Control

- Brightness
- Saturation
- Contrast
- Tint

![](media:blog/pic/20240310000508.png)

- Metallic

![](media:blog/pic/20240310004111.png)

- Specular

![](media:blog/pic/20240310005701.png)

- Roughness

![](media:blog/pic/20240310011857.png)

**Compression**

`Linear Color` -> no sRGB / Grey Scale Map

![](media:blog/pic/20240310133027.png)

![](media:blog/pic/20240310133338.png)

### Normal

**NormalMap: DX or GL**

OpenGL: Unity

DirectX: Unreal

**Normal map -> Green Channel need to be flipped**

- `FlattenNormal`: lerp normalMap with 0,0,1

![](media:blog/pic/20240310135148.png)

### AO

![](media:blog/pic/20240310152650.png)

### ARM/ORM - Channel Packing

Can be done in the `SD`

![](media:blog/pic/153521.png)

![](media:blog/pic/20240310160616.png)

![](media:blog/pic/20240310160647.png)

### Displacement

*Can only be done outside of the UE5*

using tool like Blender

![](media:blog/pic/20240310161644.png)

## Scene

**Exposure**

auto -> manual

![](media:blog/pic/20240310180200.png)

![](media:blog/pic/20240310180336.png)

### Material Blend

*selection Order matters*: Base -> middle ->top

![](media:blog/pic/20240310183411.png)

### Vertex Painting

![](media:blog/pic/20240311233538.png)
