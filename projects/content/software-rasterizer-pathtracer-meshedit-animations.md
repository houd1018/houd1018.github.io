:::hero
![Scotty3D rendering](media:2024/03/64869683.png)
:::

:::overview
Finished as homework for [Computer Graphics (Spring 2024)](http://15462.courses.cs.cmu.edu/spring2024/) at Carnegie Mellon University.

Scotty3D is a 3D modeling, rendering and animation package like Blender, where we complete the main algorithms: rasterization and path-tracing rendering, MeshEdit operations, and animation including skeleton kinematics, skinning and particle simulation.
:::

:::meta
Context: CMU 15-462 Computer Graphics · Spring 2024
Tools: C++
Framework: [Scotty3D](https://github.com/CMU-Graphics/Scotty3D)
:::

:::tabs
:::tab Rasterizer
![Girl with a Pearl Earring rendered with the rasterizer](media:2024/03/rasterize_image.png "Final result: Girl with a Pearl Earring rendered with the rasterizer")

For Assignment 1 – Rasterizer, we implement what modern GPUs do in a rasterization pipeline, which has several highly parallel stages converting 3D triangles into 2D pixels. Instead of rendering on the GPU, we implement this pipeline in software on the CPU.

:::row
The obj file is from a model I made before: a stylized model of the painting *Girl with a Pearl Earring* by Johannes Vermeer.

![Stylized Girl with a Pearl Earring model](media:2024/03/8bd741_05409708afb447d3aa167563d2fa7bddmv2.png)
:::

:::row
#### Scene functions
- Implemented `local_to_world()` and `world_to_local()` to get the 4×4 transformation from object space to and from world space, with scaling, rotation and translation.
:::

:::row
#### Lines, triangle rasterization and interpolation
- Line rasterization using [diamond exit rules](https://registry.khronos.org/OpenGL/specs/gl/glspec33.core.pdf#page=126&zoom=100,168,674) and [Bresenham's line algorithm](http://15462.courses.cs.cmu.edu/spring2024/lecture/persp/slide_029).
- Flat triangle rasterization with a [bounding box test](http://15462.courses.cs.cmu.edu/spring2024/lecture/persp/slide_037), [point-in-triangle tests](http://15462.courses.cs.cmu.edu/spring2024/lecture/persp/slide_042) and the [top-left rule](https://learn.microsoft.com/en-us/windows/win32/direct3d11/d3d10-graphics-programming-guide-rasterizer-stage-rules).
- Two more triangle rasterizers interpolating in [screen space](http://15462.courses.cs.cmu.edu/spring2024/lecture/texture/slide_004) and [perspective-correct](http://15462.courses.cs.cmu.edu/spring2024/lecture/texture/slide_008) with barycentric coordinates.

![Line, flat, smooth and perspective-correct triangles](media:2024/03/8bd741_4d16530093f8455381fa7f1d383fc09cmv2.png "1. Line 2. Flat triangle 3. Smooth triangle 4. Perspective-correct triangle")
:::

:::row
#### Depth test and color blend
- Implemented the depth test `Depth_Less()` and the blending functions `Blend_Add()` and `Blend_Over()` (alpha blending).

![Before blending](media:2024/03/8bd741_55d8db1bd25d448f922cb9a2d33c09fdmv2.png "Before")
![After blending](media:2024/03/8bd741_e62142e2e81f438d9cf576b013470951mv2.png "After")
:::

:::row
#### Mip-mapping and texture sampling
- Mipmap generation, sampling and [LOD determination](http://15462.courses.cs.cmu.edu/spring2024/lecture/texture/slide_037) from derivatives, following section 3.8.11 of the [OpenGL 3.3 spec](https://registry.khronos.org/OpenGL/specs/gl/glspec33.core.pdf).
- Nearest and bilinear [magnification](http://15462.courses.cs.cmu.edu/spring2024/lecture/texture/slide_024), trilinear sampling for minification.

![Mip-map levels](media:2024/03/屏幕截图-2024-03-14-224152.jpg "Mip-map")
![Mip-mapping result](media:2024/03/屏幕截图-2024-03-14-224222.jpg "Mip-mapping")
:::

:::row
#### [Supersampling](http://15462.courses.cs.cmu.edu/spring2024/lecture/persp/slide_063)
- A framebuffer stores multiple sample points within one pixel and resolves the pixel color as a weighted average of them, generating new fragments for the new sample points.

![Before supersampling](media:2024/03/before.png "Before")
![After 8x8 SSAA](media:2024/03/after.png "After 8×8 SSAA")
:::
:::

:::tab Pathtracer
![Path tracer demo](media:2024/03/2024-03-24-16-34-15.mp4)

:::row
#### Camera rays
- Simulate "backwards" scene traversal: shoot rays from the camera out into the scene.
- Rays measure the scene radiance that reaches a point on the camera's sensor plane, the first step of ray tracing.

![Path tracer result colored by surface normals](media:2024/03/cow.png "Path tracer result colored by surface normals")
:::

:::row
#### Intersecting objects
- Triangle intersection with the Möller–Trumbore algorithm and Cramer's rule, as discussed [here](https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/moller-trumbore-ray-triangle-intersection).
- Sphere intersection with an algebraic approach.
- The tracer returns UV and normal at the intersection.

![Intersection test](media:2024/03/微信截图_20240325013427.jpg)
![BVH visualization](media:2024/03/bvh.gif)
:::

:::row
#### BVH
- Built a BVH and its intersection routine to speed up ray–scene intersection: first bounding boxes and [ray–box intersection](https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-box-intersection), then construction with the [Surface Area Heuristic](http://15462.courses.cs.cmu.edu/fall2017/lecture/acceleratingqueries/slide_025).

![Surface Area Heuristic diagram](media:2024/03/8bd741_529840f042b249bd958673a2c661374fmv2.png)
:::

:::row
#### Traversal
- [Ray–BVH intersection](http://15462.courses.cs.cmu.edu/spring2022/lecture/spatial/slide_021) decides whether objects in a BVH branch need to be tested.

![BVH traversal result](media:2024/03/8bd741_a96a31dcca66415a905ed10e53477617mv2.png)
![BVH traversal result 2](media:2024/03/8bd741_54b7757508fb44aeb9a55ad54aa9e891mv2.png)
:::

:::row
#### Lighting
- Lambertian BSDF, `sample_indirect_lighting` and `sample_direct_lighting`.
- Next event estimation, splitting samples between BSDF scatters and area lights ([details](https://github.com/CMU-Graphics/Scotty3D/blob/main/assignments/A3/T6-direct-lighting.md)).
- Mixture sampling and multiple importance sampling.

Albedo gives the ratio of incoming to reflected light; from the ratio of incoming to outgoing radiance for a pair of directions we compute the PDF for sampling an incoming direction given an outgoing one. Indirect and direct lighting are then sampled and combined in a Monte Carlo estimate. Importance-sampling only the BSDF term of the rendering equation gives far lower variance.

![Mirror and glass BSDF render](media:2024/03/mirroandGlassBSDF.png)
:::

:::row
#### Materials
- Mirror and glass BSDFs following the [reflection](http://15462.courses.cs.cmu.edu/fall2015/lecture/reflection/slide_028) and [refraction (Snell's law)](http://15462.courses.cs.cmu.edu/fall2015/lecture/reflection/slide_032) rules.
- Dielectric Fresnel equations via [Schlick's approximation](https://en.wikipedia.org/wiki/Schlick%27s_approximation) govern reflection vs. transmission in glass.

![BSDF diagrams](media:2024/03/bsdf_diagrams.png)
![Environment-lit cow](media:2024/03/env_cow.png)
:::

:::row
#### Environment lighting
- An infinite environment light: importance sampling an HDR environment map, with the Jacobian that transforms the PDF from the HDR map to the unit sphere.

![Environment light sampling Jacobian](media:2024/03/env_light_sampling_jacobian_diagram.jpg)
:::
:::

:::tab MeshEdit
:::row
MeshEdit operations use a pointer-based structure; Halfedge_Mesh operations often allocate and deallocate elements ([details](https://github.com/CMU-Graphics/Scotty3D/blob/main/assignments/A2/halfedge.md)). In short, the halfedge is a linked-list-like structure for moving around the mesh and grabbing the element we want.

![Halfedge mesh data](media:2024/03/halfedge-mesh-data.png)
![Halfedge connectivity](media:2024/03/halfedge-mesh-halfedge-connectivity.png)
:::

### Local operations

:::gallery 2
![Flip edge](media:2024/03/edge_flip.mp4 "Flip Edge")
![Split edge](media:2024/03/edge_split.mp4 "Split Edge")
![Collapse edge](media:2024/03/collapse_edge.mp4 "Collapse Edge")
![Extrude face](media:2024/03/face_bevel.mp4 "Extrude Face")
:::

### Global operations

:::gallery 2
![Triangulate](media:2024/03/triangulate.mp4 "Triangulate")
![Linear subdivision](media:2024/03/linear_subd.mp4 "Linear Subdivision")
![Catmull-Clark subdivision](media:2024/03/catmull_subd.mp4 "Catmull-Clark Subdivision")
![Loop subdivision](media:2024/03/loop_subd.mp4 "Loop Subdivision")
:::
:::

:::tab Animation
![Animation demo](media:2024/03/2024-04-17-00-03-55.mp4)

:::row
#### Catmull-Rom spline
- Object movement uses a Catmull-Rom spline ([details](https://github.com/CMU-Graphics/Scotty3D/blob/main/assignments/A4/T1-splines.md#a4t1b-evaluation-of-a-catmull-rom-spline)).

![Spline animation](media:2024/03/微信截图_20240414152717.jpg)
![Spline curve](media:2024/03/20240414152333.jpg)
:::

:::row
#### Rig
- [Forward and inverse kinematics](https://github.com/CMU-Graphics/Scotty3D/blob/main/assignments/A4/T2-skeleton.md) and [linear blend skinning](https://github.com/CMU-Graphics/Scotty3D/blob/main/assignments/A4/T3-skinning.md).

![Rig demo](media:2024/03/2024-04-19-22-09-53.mp4)
:::

:::row
#### [Particle simulation](https://github.com/CMU-Graphics/Scotty3D/blob/main/assignments/A4/T4-particles.md)
- Uses the simplest integrator, [forward Euler](http://15462.courses.cs.cmu.edu/spring2024/lecture/sim1/slide_029).

![Particle simulation](media:2024/03/2024-04-26-22-57-21.mp4)
:::
:::
:::
