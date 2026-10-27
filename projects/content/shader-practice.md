:::overview
Shaders and VFX I have created. Most entries link to a blog post with the implementation details.
:::

:::meta
Tools: HLSL, Unity CG / ShaderLab, Shader Graph, Niagara, Particle System, VFX Graph, Substance Designer
Notes: [Shader intro](../blog/post.html?slug=shader-intro) · [VFX](../blog/post.html?slug=vfx) · [UE5 Material](../blog/post.html?slug=ue5-material)
:::

:::tabs
:::tab VFX
VFX and particle systems I created and applied to games.

### Unreal Engine 5

:::row
#### [Orb VFX](../blog/post.html?slug=vfx#stylized-orb)
![Orb VFX in UE5](media:2024/03/PPEVFX.mp4)
![Orb ball VFX](media:2024/03/ball_vfx.gif)
:::

:::row
#### [Dissolve](../blog/post.html?slug=ue5-material#dissolve)
![Dissolve material](media:2024/03/Dissolve.gif)
:::

:::row
#### [UV offset](../blog/post.html?slug=ue5-material#material-graph-basic)
![Fireball with UV offset](media:2024/03/fireball.gif)
:::

### Unity

:::gallery 2
![Orb effect](media:2023/11/Orb.gif "Orb Effect")
![Spark](media:2023/11/Spark.gif "Spark")
:::

### From [Catnip Go Fast](catnip-go-fast.html) – BVW Round 3

:::gallery 2
![Boost effect](media:2023/11/Boost.gif "Boost Effect")
![Distortion shader](media:2023/11/distortion-Shader.gif "Distortion")
![Toon explosion](media:2023/11/ToonExplosion.gif "Toon Explosion")
![Rainbow trail](media:2023/11/RainbowTrail.gif "Rainbow Trail")
:::

### From [Chrono Detective](chrono-detective.html) – BVW Round 2

:::gallery 2
![Character trail](media:2023/11/Character-Trial.gif "Character Trail – SkinnedMeshRenderer keeps track of past positions")
![Glitch effect](media:2023/11/Glitch.gif "Glitch Effect")
![Blood splash](media:2023/11/BloodSplash.gif "Blood Splash Effect")
![2D image blend](media:2023/11/2D_GlitchBlend.gif "2D Image Blend")
:::

### From [Sarapist](sarapist.html) – BVW Round 1

:::gallery 2
![Toon candle](media:2023/11/candle.gif "ToonFire Candle")
![Flame shader](media:2023/11/FlameShader.gif "ToonFire Candle – shader")
![Hologram](media:2023/11/hologram_2.gif "Hologram")
![Hologram shader](media:2023/11/Hologram.gif "Hologram – shader")
![Dissolve shader](media:2023/11/Disslove.gif "Dissolve")
![Dissolve in the game](media:2023/11/therapist_reel.gif "Dissolve – in game")
![Breath effect](media:2023/11/breathEffect_2.gif "Breath Effect")
:::
:::

:::tab Shader
Shaders I created with Unity CG, HLSL and Shader Graph.

:::gallery 3
![Rim light](media:2024/03/rim.gif "RimLight")
![Holograms](media:2023/12/123851.jpg "Holograms")
![Outline](media:2023/12/224201.jpg "Outline")
![Logical cutoffs](media:2023/12/181824.jpg "Logical Cutoffs")
![ToonRamp, Blinn-Phong and Lambert](media:2023/12/134007.jpg "Custom Lighting Model – ToonRamp, Blinn-Phong, Lambert")
![World position cutline](media:2023/12/131138.jpg "WorldPos Cutline")
![Stencil buffer magic box](media:2023/12/magicbox.gif "Stencil Buffer")
![Distorted glass](media:2023/12/distortGlass.gif "Glass – GrabPass")
![Vertex extrude](media:2023/12/extrude.gif "Vertex Extrude")
![Vertex wave](media:2023/12/Wave.gif "Vertex Wave")
![Scrolling UV](media:2023/12/scorll.gif "UV Scrolling")
![Plasma](media:2024/03/plasma.gif "Plasma")
![Simple fire](media:2024/03/fireEffect2.gif "Simple Fire – Gradient Noise")
![Noise vertex displacement](media:2024/03/simpleNoise_PCG.gif "Noise Vertex Displacement")
![Water ripple](media:2024/03/water.gif "Water – Voronoi Ripple")
:::

Implementation notes for each: [RimLight](../blog/post.html?slug=shader-intro#rim-lighting) · [Holograms](../blog/post.html?slug=shader-intro#holograms---pass) · [Outline](../blog/post.html?slug=shader-intro#outlining) · [Logical Cutoffs](../blog/post.html?slug=shader-intro#logical-cutoffs) · [Custom Lighting Model](../blog/post.html?slug=shader-intro#custom-lighting-model) · [Stencil Buffer](../blog/post.html?slug=shader-intro#stencil-buffer) · [Glass – GrabPass](../blog/post.html?slug=shader-intro#glass---grabpass) · [Vertex](../blog/post.html?slug=shader-intro#vertex-extruding) · [UV](../blog/post.html?slug=shader-intro#scrolling-texture) · [Plasma](../blog/post.html?slug=shader-intro#plasma) · [Simple Fire](../blog/post.html?slug=shadergraph-intro#eg-simple-fire---gradient-noise) · [Noise Vertex Displacement](../blog/post.html?slug=shadergraph-intro#noise-vertex-displacement) · [Water](../blog/post.html?slug=shadergraph-intro#eg-water---voronoi-ripple)
:::

:::tab Unity – CatlikeCoding
Shader outcomes from the [CatlikeCoding](https://catlikecoding.com/unity/tutorials/rendering/) tutorials, a series about understanding Unity's default rendering pipeline.

:::gallery 3
![Custom shadow](media:2023/12/shadow.gif "Custom Shadow")
![Scriptable light](media:2023/12/Lighting.gif "Scriptable Light")
![Bumpiness](media:2023/12/bumpiness.gif "Bumpiness")
![Combined textures](media:2023/12/1214012851.jpg "Combine Texture")
![Imperfect reflection](media:2024/03/bumpyReflection.gif "Imperfect Reflection")
![Interpolating probes](media:2024/03/interpolateProbe.gif "Interpolating Probes")
![Complex material](media:2024/03/masking.gif "Complex Material")
![Transparency](media:2024/03/transparency.gif "Transparency")
![Water reflection](media:2024/03/water_reflection.gif "Water – Reflection & Look-through")
:::

Implementation notes: [Custom Shadow](../blog/post.html?slug=catlike-coding#shadows) · [Scriptable Light](../blog/post.html?slug=catlike-coding#light) · [Bumpiness](../blog/post.html?slug=catlike-coding#bumpiness) · [Combine Texture](../blog/post.html?slug=catlike-coding#combine-texture) · [Imperfect Reflection](../blog/post.html?slug=catlike-coding#reflection) · [Interpolating Probes](../blog/post.html?slug=catlike-coding#interpolating-probes) · [Complex Material](../blog/post.html?slug=catlike-coding#complex-material) · [Transparency](../blog/post.html?slug=catlike-coding#transparency) · [Water](../blog/post.html?slug=catlike-coding#water)
:::
:::
