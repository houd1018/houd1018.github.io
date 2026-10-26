## what is Vertex and Fragment - Rasterization

- Vertex -> mesh -> calculated by **per vertex**
- Fragment -> coloring pixel -> calculated **by per pixel**
- Vertex + Fragment = Master Stack

![](media:blog/pic/234653.png)

![](media:blog/pic/001543.png)

- Position(GPU parallel): operating on just one vertex, not a whole bunch of vertex is just the one. -> And we're **doing the same thing to all of them** that are on this model.

## Built-in Unlit Shader

![](media:blog/pic/214913.png)

### Position for Color

![](media:blog/pic/215620.png)

![](media:blog/pic/220657.png)

- view -> camera perspective -> front is black which is 0,0,0

### Normal for color

- vertex normal:  average normal of all of around faces

  ![](media:blog/pic/221358.png)

  ![](media:blog/pic/222047.png)

  - white -> upward
  - dark -> downward

### Mix Color

- add -> 1 -> whiter 
  - when add pure color
  - prevent blow out -> get average

- multiply -> 0 -> darker
  -  when change the intensity of the color
  - usually for lighting
- Custom Function

![](media:blog/pic/230017.png)

### Texture - Sample Texture 2D

![](media:blog/pic/234619.png)

## Lit shader Basics

### Lambert Light Model

- simple and fast
- not good at generating reflections and highlights

**Lambert is a lighting model that defines the relationship between the brightness of a surface and its orientation to the light source.**

- When the angle between the light source and normal is small, the face get brighter. -> get **intensity**

- C: Color of the light
- A: attenuation (Strength of the light)

![](media:blog/pic/122511.png)

- ambient: background light in an environment that doesn't emanate from anywhere.
- diffuse(simplest):  illuminates the geometry of an object, giving it depth and volume
- Specular: bounces off a surface and can be used to create shiny patches.

![](media:blog/pic/000322.png)

**[Diffuse] being lit apparently from a light source that's at (5,5,5) in the world.**

![](media:blog/pic/125343.png)

### Lighting Models

#### Specular Reflection /  Lambert & Blinn-Phong

![](media:blog/pic/133429.png)

- The angle between the normal and the half way is then used to work out the intensity. -> efficient

  **[Specular]**

  ![](media:blog/pic/141256.png)

### Physically-Based Rendering

Built-in Lit shader

- **Reflection**: reverse calculation to lighting

- **Diffusion**: how color and light are distributed across the surface by considering what light is absorbed and what is reflected and how.

- **Translucency and Transparency**

- **Conservation of Energy**: a concept that ensures objects never reflect more light than they receive.

- **Metallicity**: the interaction of light on shiny surfaces and the highlights and colors that are reflected.

- **Fresnel Reflectivity**: how reflections on a curved surface become stronger towards the edges.

  ![](media:blog/pic/134558.png)

- **Microsurface Scattering**

### Reflection

#### reflect skybox - cubemap

![](media:blog/pic/231033.png)

![](media:blog/pic/231645.png)

#### reflect object - Reflection Probe

![](media:blog/pic/232914.png)

![](media:blog/pic/233047.png)

![](media:blog/pic/233755.png)

## Coordinate Spaces

- object space
- world space
- view space 
-  tangent space (each vertex has a tangent space)

![](media:blog/pic/094713.png)

![](media:blog/pic/094906.png)

- position(object space) -> Base Color

![](media:blog/pic/095359.png)

### Object Space

**Time**

![](media:blog/pic/TOVW.gif)

### World Space

![](media:blog/pic/worldSpacegif.gif)

[splat map](https://en.wikipedia.org/wiki/Texture_splatting)

- split
- Comparison
- Branch

![](media:blog/pic/215236.png)

### View Space

![](media:blog/pic/221427.png)

### Tangent Space (Texture Space)

![](media:blog/pic/223953.png)

- normal ->  z axis in object space.

  - To calculate between Camera and Light, turn Camera and Light to Object Space. Instead of object, because an model and have a lot of nomal
  - tangent space is on the next level down and it comes into its own when we start using special images to define the surface textures with respect to lighting on the surface of each plane, of the mesh in a technique that we call **tangent space normal mapping**. 
    - Fake light effect on texture without changing any vertex
    - calculate the light effects based on the normal specified at **each pixel** as per the image that you're using.
    - faking it by putting a whole bunch of new normals across an entire surface using the normal image

  [Messing with Tangent Space](https://www.gamedeveloper.com/programming/messing-with-tangent-space)

![](media:blog/pic/230438.png)

![](media:blog/pic/232657.png)

## Unity's Render Pipeline

- HDRP
  - targets high end hardware and desktop PCs and consoles.
  - Ray-tracing
  - not for 2D game and mobile game
  - Bend Normal(new node):  part of ambient occlusion calculations <- SD
- URP
  - better performance
  - 2D shaders

[Unity Rendering Pipeline Difference](https://portal.productboard.com/unity/1-unity-platform-rendering-visual-effects/tabs/3-universal-pipeline)

### Forward and Deferred rendering

Vertex -> **Geometry** (forward / deferred) -> Fragment 

[Forward](https://docs.unity3d.com/Manual/RenderTech-ForwardRendering.html)

[Deferred](https://docs.unity3d.com/Manual/RenderTech-DeferredShading.html) 

![](media:blog/pic/215059.png)

![](media:blog/pic/215332.png)

![](media:blog/pic/215548.png)

#### Drawcalls

![](media:blog/pic/220435.png)

## Blending

### Basics

Average: taking pixel values and mathematically add them up, then get average

(Target + Blend) / 2

![](media:blog/pic/224052.png)

### Linear & Color Burn

**Linear Burn**: Target + Blend - 1

**Color Burn**: 1-(1-target) / Blend

![](media:blog/pic/001550.png)

### More blending nodes

![](media:blog/pic/002438.png)

### Darkening Blend

- Darken:  min(Target, Blend) -> **emphasize the dark** in the blend image. White will be ignored
- Multiply: Target * Blend
- Linear Burn

### Lightening Blend

- Lighten: max(Target,Blend), opposite to the Darken 
- Screen: 1-(1-Target)*(1-Blend), blend two color
- Dodge: target/(1- Blend)
- Linear Dodge: Target + Blend

### Contrasting Blend

- Overlay (Dark getting darker): most usually for blending two colors 

![](media:blog/pic/011741.png)

- Soft Light
- Linear Light
- Vivid Light
- Hard Light
- Pin Light

## Time

![](media:blog/pic/102226.png)

![](media:blog/pic/102458.png)

- delta time is the time and seconds since the **last frame was rendered**. -> used for object in moving with **update()**

### Scroll

![](media:blog/pic/180409.png)

### Portal effect

![](media:blog/pic/181600.png)

## Lerp 

For **blending one state with another** -> two image or two color

![](media:blog/pic/191810.png)

![](media:blog/pic/191941.png)

**Node**

- Replace Color
- Clamp

### Lerping a Liquid

- Comparison $ Branch -> **make division**

![](media:blog/pic/203520.png)

## Tiling & Masking

### Tiling

- offset:  moving the UVs to seamlessly snap together. -> for scrolling effect

![](media:blog/pic/203943.png)

### Mask

- black section -> 0: can be where you don't want anything to come through 

- white section -> 1: can be where you do want colors to come through.

  ![](media:blog/pic/231136.png)

  ## Procedural Generation

- One dimensional noise appears as a line graph

- Two dimensional noise can be used to generate **textures or the height values of a landscape**.

**Perlin Noise**

![](media:blog/pic/234137.png)

### Noise Vertex Displacement

**Node**

- Combine
- Sine

![](media:blog/pic/091555.png)

- Simple Noise

![](media:blog/pic/simpleNoise_PCG.gif)

### Texture_PCG

- [SmoothStep](https://docs.unity3d.com/Packages/com.unity.shadergraph@6.9/manual/Smoothstep-Node.html): Returns the result of a smooth Hermite interpolation between 0 and 1, if the value of input **In** is between the values of inputs **Edge1** and **Edge2** respectively. Returns 0 if the value of input **In** is less than the value of input **Step1** and 1 if greater than the value of input **Step2**.

- [Improved noise line formular](https://thebookofshaders.com/11/)

  ![](media:blog/pic/101737.png)

  #### Seamless

  - invert colors
  - make top and bottom symmetrical

  ![](media:blog/pic/102325.png)

#### Voronoi

![](media:blog/pic/104942.png)

#### Normal from height / Smoothness / Metallic 

from **gray scale** -> Lit

![](media:blog/pic/110345.png)

#### tile based texture: Shape

- [fraction](https://docs.unity3d.com/Packages/com.unity.shadergraph@6.9/manual/Fraction-Node.html)

![](media:blog/pic/111827.png)

- turn to gray scale image

  - ![](media:blog/pic/111905.png)

  - Rectangle node

    ![](media:blog/pic/112953.png)

  - Ellipse / Polygon / rounded rectangle: same as rectangle

### Voronoi

- Perlin Noise: creates sort of **natural** looking landscapes
- Voronoi:  only allows you to divide space up in the way that **humans** actually do
  - dividing space up based on **closest points**
  - ![](media:blog/pic/114759.png)

eg. Curtain Effect

![](media:blog/pic/curtainEffect.gif)

### Eg. Simple Fire - Gradient Noise

![](media:blog/pic/231842.png)

![](media:blog/pic/fireEffect2.gif)

### Eg. UV Ripple: UV Lerp with Voronoi

![](media:blog/pic/233321.png)

## Illusion of Depth

- How does bump map works: change the process of rendering -> fake the fact that the normal could be at a different angle and create bumps

  ![](media:blog/pic/234422.png)

- set normal map: remap -1 to 1, rather than 0 to 1
- If the **Z is a positive value**, then it is facing towards the camera, which means the camera can see that side of the image, and therefore it can then be used for calculating lighting.
- If the **Z is negative**, then there's no lighting on that particular side of your polygon

![](media:blog/pic/002205.png)

- Node: **Normal Strength** / **[Normal Blend](https://docs.unity3d.com/Packages/com.unity.shadergraph@6.9/manual/Normal-Blend-Node.html)**

![](media:blog/pic/003102.png)

- Node: **[Swizzle](https://docs.unity3d.com/Packages/com.unity.shadergraph@6.9/manual/Swizzle-Node.html)**: Get Channels
- Node: Normal Reconstruct Z: Get Z value based on RG. (Use this when using slider to interpolate two normal map)

### Eg. Lava Ripple

- normal map & mainTex UV Lerp with Voronoi

![](media:blog/pic/lavaEffect.gif)

## Depth Intersection

Node: 

- **Scene Depth**

- **Screen Position**

  it's the shorter of the two between the same depth or the screen positions w value that's going to indicate **which pixel gets drawn on the screen.**

![](media:blog/pic/175332.png)

Screen Position W come from Clipping: Clipping is when the graphics card decides if a vertex is **within the camera's viewing volume**

W: representative of **the depth into the scene** of our fragments

https://carmencincotti.com/2022-05-02/homogeneous-coordinates-clip-space-ndc/

![](media:blog/pic/180043.png)

### Eg. Depth intersection

![](media:blog/pic/182819.png)

### Eg. Forcefield - Fresnel

![](media:blog/pic/170009.png)

### Eg. Water - Voronoi ripple

![](media:blog/pic/water.gif)

## Tricks of Light

### Eg1. Crystal Effect

- Fresnel
- UV -> smoothstep(division) -> lerp (mix and remap color)

![](media:blog/pic/185442.png)

### Eg2. Holograms

- Fresnel

![](media:blog/pic/203931.png)

### Eg3. Refraction

- doesn't work on Built-in: The executed HLSL code for this [Node](https://docs.unity3d.com/Packages/com.unity.shadergraph@6.9/manual/Node.html) is defined per **Render Pipeline**, and different **Render Pipelines** may produce different results

![](media:blog/pic/204604.png)

- [Scene Color](https://docs.unity3d.com/Packages/com.unity.shadergraph@6.9/manual/Scene-Color-Node.html)
- Normal Map -> **bend the light**

![](media:blog/pic/refraction926.gif)

### Eg4. Iridesence

- Gradient -> Fresnel

![](media:blog/pic/215226.png)

## Advanced Water - wiz particle system

- Depth: Scene Depth - Screen Position
- Fresnel effect
- Scrolling: Time node + tilling And offset
- Refraction: Normal map + Screen Position -> Scene Color
- Wave: Gradient Noise + Object Position -> Vertex Position
- [vertex color](https://docs.unity3d.com/Packages/com.unity.shadergraph@6.9/manual/Vertex-Color-Node.html) : for change the **Color over Lifetime** attribute in **particle system**

![](media:blog/pic/wave926.gif)

![](<media:blog/pic/advanced water.gif>)

## Misc

- ###  Gray Scale for Metallic Texture: R or G or B is the same (choose any three of them)

![](media:blog/pic/220838.png)

- ### Invert Colors - Invert the gray scale

![](media:blog/pic/223520.png)

- ### debug Gizmos for World / Object / View Space

![](media:blog/pic/220018.png)

- ### SubGraph

- ### Transparent

  - determine whether part is transparent or not
  - white -> 1 -> opaque
  - black -> 0 -> Transparent
  
  ![](media:blog/pic/010501.png)
  
- ### remap

  ![](media:blog/pic/remap.gif)

- ### make sure using correct texture -> make shader less complicated

![](media:blog/pic/114022.png)

- ### Blending Mode

  ![](media:blog/pic/214348.png)

  - additive:  add the pixel value for what's behind ->  especially for **transparent**: add black (0) -> show background color

- ### [SmoothStep](https://docs.unity3d.com/Packages/com.unity.shadergraph@6.9/manual/Smoothstep-Node.html) & [Step](https://docs.unity3d.com/Packages/com.unity.shadergraph@6.9/manual/Step-Node.html)

  ![](media:blog/pic/183809.png)

  ![](media:blog/pic/183818.png)

- ### [One Minus](https://docs.unity3d.com/Packages/com.unity.shadergraph@6.9/manual/One-Minus-Node.html): invert color for only gray scale image

  ```
  void Unity_OneMinus_float4(float4 In, out float4 Out)
  {
      Out = 1 - In;
  }
  ```

  
