---
title: Houdini_intro
date: 2024-04-04 01:00:00 -800
categories: [DCC]
tags: [houdini]    # TAG names should always be lowercase
typora-root-url: ..
---

# Houdini_intro

## Roll Tube - Attributes / Geometry / UV

### Base

- Scatter
- copytopoints
- Group -> group the bottom point

![](/assets/pic/tube.gif)

![](/assets/pic/20240501194619.png)

**PolyLine**

Bezier -> PolyLine

- Resample

![](/assets/pic/20240501180054.png)

**Mesh**

![](/assets/pic/tube_mesh.gif)

- add noise in `pscale` and `p`

  ![](/assets/pic/20240504143555.png)

![](/assets/pic/tube_anim.gif)

### Attributes

https://entagma.com/courses/ahtya-2-adding-houdini-to-your-arsenal-2-0/ahtya-2-0-pt-08-understanding-attributes-in-houdini/

Unlike groups, attribs allow us to **specify a data type**. In this case we're using a float attrib (a number with a decimal point) to create a smooth

**P** - Positions (Vector | Points)
**N** - Normals / Directions (Vector | Points or Vertices)
**uv** - UV Coordinates (Vector | Points or Vertices)
**Cd** - Color (Vector | Points)
**pscale** - Scaling / Size of stuff (Float | Points)

![](/assets/pic/20240504142736.png)

- maskbyfeature

- timeshift -> become static 解决让某一部分不按frame变化 (remove attribute animation)

  #### Output
  
  remove extra output, clear attribute -> which can be clear in the shader
  
  ![](/assets/pic/20240504152544.png)
  
  ![](/assets/pic/20240504152809.png)

![](/assets/pic/20240505115414.png)

### Geometry

![](/assets/pic/20240504142951.png)

- edge: not for building the model, but for selection

- **vertices has direction**

When working with groups and attribs, using **points or prims is usually a lot simpler** and more practical, than using vertices.

However in some cases, for instance in normals or uvs, **vertices do offer us more options**, we might need to get the desired result.

![](/assets/pic/20240504143243.png)

### UV

![](/assets/pic/20240504151136.png)

![](/assets/pic/20240504151235.png)

## For Loop

https://entagma.com/courses/ahtya-2-adding-houdini-to-your-arsenal-2-0/ahtya-2-0-pt-13-understanding-for-loops-in-houdini/

- Foreach loop
  - piece (name)
  - point
  - primitive
  - feedback(add randomness to each element)
- clip
- blast
- matchsize

![](/assets/pic/20240505034025.png)

- switch

  - selection input(bool) eg. `rand(detail(0, "iteration", 0))>.75`

  ![](/assets/pic/20240505123352.png)

## Procedural city - Node / VOPs / Wrangle

### import 2D OSM data to bego format

- get data from OpenStreetMap 

  ![](/assets/pic/20240505175547.png)

- `osm_import` & `osm_filter`

![](/assets/pic/20240505173851.png)

### Setting random height

- give random height according to a base

- measure (area base)

![](/assets/pic/20240505182835.png)

- more noise
  - attribrenoisse
  - attribrandom
- Remap -> make some different on certain building

![](/assets/pic/20240505183953.png)

### VOPs

- Bind -> import attributes

![](/assets/pic/20240505202552.png)

- Remap

![](/assets/pic/20240505195755.png)

- noise

![](/assets/pic/20240505202620.png)

- index of the current primitives -> random

![](/assets/pic/20240505202742.png)

### Wrangle / Vex

```c++
//Get Attrib
float area = f@area;

//Remap
float zscale = fit(area, 1.0, 25000.0, 0.0, 1.0);
zscale = chramp("Remap", zscale);
zscale = fit(zscale, 0.0, 1.0, 10.0, 30.0);

//Noise
float noise = noise(v@P/1000);
noise = chramp("Noise", noise);
noise = noise * 100;
zscale = zscale + noise;

//Random
float random = rand(i@primnum);
random = fit(random, 0.0, 1.0, 0.8, 1.2);
zscale = zscale * random;

//Update Attrib
f@zscale = zscale;
```

![](/assets/pic/20240505205730.png)

### Data Visualization

![](/assets/pic/20240505221753.png)

- import CSV -> `tableimport` -> Get Arrtibutes

![](/assets/pic/20240505211549.png)

- degree -> cartesian coordinate

```c++
//Load in lat lon attribs and convert them to radians.
float lat = radians(f@lat);
float lon = radians(f@lon);

//Calculate xyz coordinates based on lat lon
float x = cos(lat) * cos(lon);
float y = cos(lat) * sin(lon);
float z = sin(lat);

//Write coordinates back to position and normal
v@P = set(x,y,z);
v@N = set(x,y,z);
```

- transform -> rotate x axis

![](/assets/pic/20240505215235.png)

- color -> country

  ![](/assets/pic/20240505215428.png)

- pop - pscale

- add pillar to the sphere

  - line
  - copytopoints
  - sweep

  ![](/assets/pic/20240505221014.png)

## Rock Generation

**low poly rock**

- `Scatter`: make it to points-> `voronoifaracture`: make random division
- matchsize: make each piece in the center

![](/assets/pic/rock.gif)

**high poly rock**

![](/assets/pic/rockhigh.gif)

- uv: reserve the original uv info
- remesh: make more division
- mountain: deform
- mesh_sharpen: modify the iteration -> make it rough 
- edge_damage: `method: boolean` ->  sharpen some edges
- vop: random color `cd` -> random greyscale

![](/assets/pic/20240622183140.png)

## Rails

![](/assets/pic/rail.gif)

**Facet**: Clean up points. Make sure every line only has two points as endpoints

**resample**: Treat polygons as Subdivision Curves -> set up points evenly

**Convertline**: take lines into primitives

Instance model in different size based on line's length

![](/assets/pic/164442.png)

`primitivesplit1` + `primitiveProperty` -> sacle = 0: get the middle point of the primitives
![](/assets/pic/170752.png)


**Divide different property -> uniform scale**: maintian the scale in the wrangle
![](/assets/pic/104207.png)