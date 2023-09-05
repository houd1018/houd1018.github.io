---
title: ShaderGraph introTutorial
date: 2023-08-27 23:00:00 -800
categories: [Shader]
tags: [cg, unity, shader]    # TAG names should always be lowercase
---

# ShaderGraph Tutorial

## what is Vertex and Fragment - Rasterization

- Vertex -> mesh -> calculated by **per vertex**
- Fragment -> coloring pixel -> calculated **by per pixel**
- Vertex + Fragment = Master Stack

![](/assets/pic/234653.png)

![](/assets/pic/001543.png)

- Position(GPU parallel): operating on just one vertex, not a whole bunch of vertex is just the one. -> And we're **doing the same thing to all of them** that are on this model.

## Built-in Unlit Shader

![](/assets/pic/214913.png)

### Position for Color

![](/assets/pic/215620.png)

![](/assets/pic/220657.png)

- view -> camera perspective -> front is black which is 0,0,0

### Normal for color

- vertex normal:  average normal of all of around faces

  ![](/assets/pic/221358.png)

  ![](/assets/pic/222047.png)

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

![](/assets/pic/230017.png)

### Texture - Sample Texture 2D

![](/assets/pic/234619.png)

## Lit shader Basics

### Lambert Light Model

- simple and fast
- not good at generating reflections and highlights

**Lambert is a lighting model that defines the relationship between the brightness of a surface and its orientation to the light source.**

- When the angle between the light source and normal is small, the face get brighter. -> get **intensity**

- C: Color of the light
- A: attenuation (Strength of the light)

![](/assets/pic/122511.png)

- ambient: background light in an environment that doesn't emanate from anywhere.
- diffuse(simplest):  illuminates the geometry of an object, giving it depth and volume
- Specular: bounces off a surface and can be used to create shiny patches.

![](/assets/pic/000322.png)

**[Diffuse] being lit apparently from a light source that's at (5,5,5) in the world.**

![](/assets/pic/125343.png)

### Lighting Models

#### Specular Reflection /  Lambert & Blinn-Phong

![](/assets/pic/133429.png)

- The angle between the normal and the half way is then used to work out the intensity. -> efficient

  **[Specular]**

  ![](/assets/pic/141256.png)

### Physically-Based Rendering

Built-in Lit shader

- **Reflection**: reverse calculation to lighting

- **Diffusion**: how color and light are distributed across the surface by considering what light is absorbed and what is reflected and how.

- **Translucency and Transparency**

- **Conservation of Energy**: a concept that ensures objects never reflect more light than they receive.

- **Metallicity**: the interaction of light on shiny surfaces and the highlights and colors that are reflected.

- **Fresnel Reflectivity**: how reflections on a curved surface become stronger towards the edges.

  ![](/assets/pic/134558.png)

- **Microsurface Scattering**

### Reflection

#### reflect skybox - cubemap

![](/assets/pic/231033.png)

![](/assets/pic/231645.png)

#### reflect object - Reflection Probe

![](/assets/pic/232914.png)

![](/assets/pic/233047.png)

![](/assets/pic/233755.png)

## Coordinate Spaces

- object space
- world space
- view space 
-  tangent space (each vertex has a tangent space)

![](/assets/pic/094713.png)

![](/assets/pic/094906.png)

- position(object space) -> Base Color

![](/assets/pic/095359.png)

### Object Space

**Time**

![](/assets/pic/TOVW.gif)

### World Space

![](/assets/pic/worldSpacegif.gif)

[splat map](https://en.wikipedia.org/wiki/Texture_splatting)

- split
- Comparison
- Branch

![](/assets/pic/215236.png)

### View Space

![](/assets/pic/221427.png)

### Tangent Space (Texture Space)

![](/assets/pic/223953.png)

- normal ->  z axis in object space.

  - To calculate between Camera and Light, turn Camera and Light to Object Space. Instead of object, because an model and have a lot of nomal
  - tangent space is on the next level down and it comes into its own when we start using special images to define the surface textures with respect to lighting on the surface of each plane, of the mesh in a technique that we call **tangent space normal mapping**. 
    - Fake light effect on texture without changing any vertex
    - calculate the light effects based on the normal specified at **each pixel** as per the image that you're using.
    - faking it by putting a whole bunch of new normals across an entire surface using the normal image

  [Messing with Tangent Space](https://www.gamedeveloper.com/programming/messing-with-tangent-space)

![](/assets/pic/230438.png)

![](/assets/pic/232657.png)

## Unity's Render Pipeline



## Misc

- ### Gray Scale for Metallic Texture: R or G or B is the same (choose any three of them)

![](/assets/pic/220838.png)

- ### Invert Colors - Invert the gray scale

![](/assets/pic/223520.png)

- ### debug Gizmos for World / Object / View Space

![](/assets/pic/220018.png)

