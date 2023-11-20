---
title: CatlikeCoding
date: 2023-11-16 23:00:00 -800
categories: [Shader]
tags: [unity, shader, rendering, CG]    # TAG names should always be lowercase
---

# CatlikeCoding

## Basics

![](/assets/pic/cat_wave.gif)

![](/assets/pic/cat_multiwave.gif)

![](/assets/pic/cat_ripple.gif)

![](/assets/pic/cat_sphere.gif)

![](/assets/pic/cat_torus.gif)

## Shader Fundamentals

`float4 position : SV_POSITION;` is transformed position after interpolation from `float4 position : POSITION;`

so we need one more value (eg. uv) stands for the local position

---------------------

```c++
i.uv = TRANSFORM_TEX(v.uv, _MainTex);
i.uv = v.uv * _MainTex_ST.xy + _MainTex_ST.zw;
// equivalent
// used for tilling and offest
```

--------------

```c++
            struct VertexData {
                float4 position : POSITION;
                float2 uv : TEXCOORD0;
            };
// uv here is the uv from the mesh
```

