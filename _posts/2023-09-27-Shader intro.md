---
title: Shader intro
date: 2023-09-26 23:00:00 -800
categories: [Shader]
tags: [cg, unity, shader]    # TAG names should always be lowercase
---

# Shader intro

- Rendering Pipeline (Geometry and Rasterization process)

![](/assets/pic/085648.png)

- Shaderlab

![](/assets/pic/085716.png)

- Processing: HLSL

  -  **surface**: name if shader function

  -  **Lambert**: Lighting Model

  -   **struct Input**: Input Data from the Model's Meshvertices, normals, uvs.)

  -   **fixed _myColour**: Properties that you wantavailable to your shader function.
  -  **FallBack "Diffuse"** : less GPU power

- Output is related to Lighting Model
  - ![](/assets/pic/090747.png)
