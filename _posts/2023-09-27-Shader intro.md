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

  -   **fixed _myColour**: Properties that you want available to your shader function.
  -  **FallBack "Diffuse"** : less GPU power

- Output is related to Lighting Model
  - ![](/assets/pic/090747.png)

```shaderlab
Shader "Holistic/HelloShader" {
	
	Properties {
	     _myColour ("Example Colour", Color) = (1,1,1,1)
	     _myEmission ("Example Emission", Color) = (1,1,1,1)
		 _myNormal ("Example Normal", Color) = (1,1,1,1)
	}
	
	SubShader {
		
		CGPROGRAM
			#pragma surface surf Lambert

			struct Input {
				float2 uvMainTex;
			};

			fixed4 _myColour;
			fixed4 _myEmission;
			fixed4 _myNormal;
			
			void surf (Input IN, inout SurfaceOutput o){
			    o.Albedo = _myColour.rgb;
			    o.Emission = _myEmission.rgb;
				o.Normal = _myNormal.rgb;
			}
		
		ENDCG
	}
	
	FallBack "Diffuse"
}
```

### Vector Recap

- *v · w* = *v*x*w*x + *v*y*w*y
- a ^ = a/|a|
- *v · w* = *v*x*w*x + *v*y*w*y
- ![](\assets\pic\vector-maths-eq6.png.crdownload)
- [cross product] **v** x **w** = (vyw*z* - *vz wy* )(1, 0, 0) + (vzwx - *vxwz* )(0,1,0) + (v*x*wy - *vy*wx)(0,0,1)

## Shader Essentials & Surface Shader

[Surface Shaders](https://docs.unity3d.com/Manual/SL-SurfaceShaders.html)

### variables and packed arrays

- the code you write, you write as though you are only writing for one pixel. You don't need to write loops that process all of the pixels that need to appear on the screen. GPU do the rest.

![](/assets/pic/133310.png)

#### variables

![](/assets/pic/133557.png)

![](/assets/pic/133522.png)

- fixed4 -> r,g,b,a or x,y,z,w

  ````
  colour1.a = 1;
  colour2.x = 0;
  ````

- **Convention**:

  - position or vertices -> xyzw
  - color -> rgba

- Easy to copy

- copy with different length

  ```
  fixed4 colour1 =(0,1,1,0);
  fixed3 colour3;
  colour3 = colour1.rgb;
  ```

#### Packed Arrays

![](/assets/pic/133733.png)

- Swizzling: swapping channels

  ```
  fixed3 colour3;
  colour3 = colour1.bgr;
  ```

- Smearing: Filling with same value using a single digit.

```
// they are same
fixed3 colour3 = 1;
colour3 = (1, 1, 1);
```

- Masking

  ```
  colour1.rg = colour2.gr;
  ```

#### Packed Matrices

![](/assets/pic/134758.png)

- Chaining

```
fixed4 colour = matrix._m00_m01_m02_m03
fixed4 colour = matrix[0];
```

#### Mesh

![](/assets/pic/142025.png)

- UV **anti-clockwise order**

![](/assets/pic/143259.png)

#### Shader Input

```
// The input struct in the shader code is where you declare any values from the mesh that you will need to manipulate in the shader function.
			struct Input {
				float2 uv_MainTex;
			};
```

####  Shader Properties

```
Properties{
_myColor ("Example Color", Color) = (1,1,1,1)
_myRange("Example Range", Range(0,5))=1
_myTex(“Example Texture",2D)="white"{}
_myCube(“Example Cube",CUBE)=""{}
_myFloat(“Example Float", Float) = 0.5
_myVector("Example Vector", Vector) = (0.5,1,1,1)
}


fixed4 _myColor;
half _myRange;
sampler2D _myTex;
samplerCUBE _myCube;
float _myFloat;
float4 _myVector;
```

![](/assets/pic/144758.png)

![](/assets/pic/145645.png)

- How the color of texture -> albedo

```
tex2D(_myTex, IN.uv_myTex)
```

- How to do refection skybox cube map
  - `float3 worldRefl` - contains world reflection vector *if surface shader does not write to o.Normal*. See Reflect-Diffuse shader for example.

```
        void surf (Input IN, inout SurfaceOutput o) {
            o.Albedo = (tex2D(_myTex, IN.uv_myTex) * _myRange).rgb;
            o.Emission = texCUBE (_myCube, IN.worldRefl).rgb;
        }
```

## Illuminating Surface

### [Lambert](https://houd1018.github.io/posts/ShaderGraph-introTutorial/#lit-shader-basics)

![](/assets/pic/160335.png)

### Normal Mapping

![](/assets/pic/160641.png)

- Normalized

![](/assets/pic/173243.png)
