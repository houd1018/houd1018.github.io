---
title: Shader introTutorial
date: 2023-08-27 23:00:00 -800
categories: [Shader]
tags: [cg, unity, shader]    # TAG names should always be lowercase
---

# ShaderGraph Tutorial

## what is Vertex and Fragment - Rasterization

- Vertex -> mesh
- Fragment -> coloring pixel
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

- ambient: background light in an environment that doesn't emanate from anywhere.
- diffuse(simplest):  illuminates the geometry of an object, giving it depth and volume
- Specular: bounces off a surface and can be used to create shiny patches.

![](/assets/pic/000322.png)
