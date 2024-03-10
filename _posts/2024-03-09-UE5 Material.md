---
title: UE5 Material
date: 2024-03-08 23:00:00 -800
categories: [Material]
tags: [unreal engine, material, tech art]    # TAG names should always be lowercase
typora-root-url: ..
---

# UE5 Material

## Material Graph Basic

- `Panner`: The **Panner** expression outputs UV texture coordinates that can be used to create panning, or moving, textures.

![](/assets/pic/panner.png)

- `Sine_Remapped`

  

![](/assets/pic/sineRemapped.png)

![](/assets/pic/fireball.png)

![](/assets/pic/fireball.gif)

## Dissolve

- `Name reroutes`
- `CheapContrast`
- `Append`

![](/assets/pic/Dissolve.png)

![](/assets/pic/Dissolve.gif)

### BP_Collision

![](/assets/pic/Dissolve_test.gif)

**Dissolve Control**

![](/assets/pic/20240309180935.png)

**Jumping pad**

![](/assets/pic/20240309181029.png)

## Advanced Material

### UV Control

![](/assets/pic/20240309195836.png)

### Color Control

- Brightness
- Saturation
- Contrast
- Tint

![](/assets/pic/20240310000508.png)

- Metallic

![](/assets/pic/20240310004111.png)

- Specular

![](/assets/pic/20240310005701.png)

- Roughness

![](/assets/pic/20240310011857.png)

**Compression**

`Linear Color` -> no sRGB / Grey Scale Map

![](/assets/pic/20240310133027.png)

![](/assets/pic/20240310133338.png)

### Normal

**NormalMap: DX or GL**

OpenGL: Unity

DirectX: Unreal

**Normal map -> Green Channel need to be flipped**

- `FlattenNormal`: lerp normalMap with 0,0,1

![](/assets/pic/20240310135148.png)

### AO

![](/assets/pic/20240310152650.png)

### ARM/ORM - Channel Packing

Can be done in the `SD`

![](/assets/pic/153521.png)

![](/assets/pic/20240310160616.png)

![](/assets/pic/20240310160647.png)

### Displacement

*Can only be done outside of the UE5*

using tool like Blender

![](/assets/pic/20240310161644.png)

## Scene

**Exposure**

auto -> manual

![](/assets/pic/20240310180200.png)

![](/assets/pic/20240310180336.png)

### Material Blend

*selection Order matters*: Base -> middle ->top

![](/assets/pic/20240310183411.png)

