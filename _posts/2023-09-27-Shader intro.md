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

```cpp
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
- ![](/assets/pic/vector-maths-eq6.png)
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

  ````c++
  colour1.a = 1;
  colour2.x = 0;
  ````

- **Convention**:

  - position or vertices -> xyzw
  - color -> rgba

- Easy to copy

- copy with different length

  ```c
  fixed4 colour1 =(0,1,1,0);
  fixed3 colour3;
  colour3 = colour1.rgb;
  ```

#### Packed Arrays

![](/assets/pic/133733.png)

- Swizzling: swapping channels

  ```c++
  fixed3 colour3;
  colour3 = colour1.bgr;
  ```

- Smearing: Filling with same value using a single digit.

```c++
// they are same
fixed3 colour3 = 1;
colour3 = (1, 1, 1);
```

- Masking

  ```c++
  colour1.rg = colour2.gr;
  ```

#### Packed Matrices

![](/assets/pic/134758.png)

- Chaining

```c++
fixed4 colour = matrix._m00_m01_m02_m03
fixed4 colour = matrix[0];
```

#### Mesh

![](/assets/pic/142025.png)

- UV **anti-clockwise order**

![](/assets/pic/143259.png)

#### Shader Input

```c++
// The input struct in the shader code is where you declare any values from the mesh that you will need to manipulate in the shader function.
			struct Input {
				float2 uv_MainTex;
			};
```

####  Shader Properties

```c++
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

```c++
tex2D(_myTex, IN.uv_myTex)
```

- How to do refection skybox cube map
  - `float3 worldRefl` - contains world reflection vector *if surface shader does not write to o.Normal*. See Reflect-Diffuse shader for example.

```c++
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

- z value is used to control brightness

```c++
        void surf (Input IN, inout SurfaceOutput o)
        {
            o.Albedo = tex2D(_myDiffuse, IN.uv_myDiffuse * _myScale).rgb;
            o.Normal = UnpackNormal(tex2D(_myBump, IN.uv_myBump));
			o.Normal *= float3 (_mySlider, _mySlider, 1);
        }
```

![](/assets/pic/bump.gif)

### Illumination Models

- not geometric normal
- pixel basis -> illumination model
  - Flat
    - only shade each polygon -> That gives the entire surface of a polygon the same color
    - ![](/assets/pic/081501.png)
  - Gouraud
    - works ok until you add highly localized light in one polygon -> not transfer to others
    - ![](/assets/pic/081524.png)
  - Phong: Taking the actual normals at each vertex, the ones across the surface are calculated as an interpolation of one to another.
    - ![](/assets/pic/081553.png)

**Switch From Phong -> Flat**

![](/assets/pic/002610.png)

- bumpMap + cubeMap -> world refection

```c++
        struct Input {
            float2 uv_myDiffuse;
            float2 uv_myBump;
            float3 worldRefl; INTERNAL_DATA
        };
        
        void surf (Input IN, inout SurfaceOutput o) {
            o.Albedo = tex2D(_myDiffuse, IN.uv_myDiffuse).rgb;
            o.Normal = UnpackNormal(tex2D(_myBump, IN.uv_myBump)) * _myBright;
            o.Normal *= float3(_mySlider,_mySlider,1);
            o.Emission = texCUBE (_myCube, WorldReflectionVector (IN, o.Normal)).rgb;
        }
```

-  reflective bump

```c
        void surf (Input IN, inout SurfaceOutput o) {
            o.Normal = UnpackNormal(tex2D(_myBump, IN.uv_myBump)) * 0.3;
            o.Albedo = texCUBE (_myCube, WorldReflectionVector (IN, o.Normal)).rgb;
        }
```

### Buffer

**Frame Buffer**: Computer memory structure that holds the color information about every pixel that appears on the screen.

**Z Buffer**: the same dimensions as the frame buffer, but holds depth information for each pixel.

Anything behind will be **ignored** & Render From **Front-to-Back**: If the pixel trying to be added has a smaller depth value than the one already in the Z buffer, it means that it must be closer to the camera and therefore its color should replace the one already in the pixel buffer and then its depth is added to the Z buffer.

![](/assets/pic/090557.png)

- Ignore depth / over-drawn

  ```
  SubShader {
  
    ZWrite off
  
    CGPROGRAM
      #pragma surface surf Lambert
    ENDCG
  }
  ```

  ### Render Queues - Draw order

![](/assets/pic/091341.png)

### G buffer

Deferred Rendering

- good when there is a lot of light

- cannot display transparent object (because transparent objects are see-through, they need to display any **lighting effects behind them** and because lights are calculated at the end)

  ![](/assets/pic/092047.png)

Forward Rendering [Default]

![](/assets/pic/092146.png)

  ## Dot Product

```c
            struct Input{
                float3 viewDir;
            };

            void surf (Input IN, inout SurfaceOutput o){
                half dotp = dot(IN.viewDir, o.Normal);
                o.Albedo = float3(dotp, 1, 1);
                // shows blue on the round (0, 1, 1)
                // white on the edge (1, 1, 1)
            }
```

![](/assets/pic/165159.png)

### Rim Lighting

- Normalize
- Saturate -> **-1 to 1** map to **0 to 1**
- pow

![](/assets/pic/174001.png)

```c
        void surf (Input IN, inout SurfaceOutput o)
        {
            half rim = 1 - saturate(dot(normalize(IN.viewDir), o.Normal));
            o.Emission = _RimColor * pow(rim, _RimPower);
        }
```

### Logical Cutoffs

- Harsh Outline

![](/assets/pic/181824.png)

```c++
        struct Input
        {
            float3 viewDir;
        };

        float4 _RimColor;
        float _RimPower;

        void surf (Input IN, inout SurfaceOutput o)
        {
            half rim = 1 - saturate(dot(normalize(IN.viewDir), o.Normal));
            o.Emission = rim > 0.5 ? float3(1, 0, 0): rim > 0.3 ? float3(0, 1, 0): 0;
        }
```

- WorldPos Cutline
  - frac: give the fractional part = remainder
  - x / 2 -> x * 0.5

```c
        void surf (Input IN, inout SurfaceOutput o)
        {
            o.Albedo = tex2D(_MainTex, IN.uv_MainTex).rgb;
            half rim = 1 - saturate(dot(normalize(IN.viewDir), o.Normal));
            o.Emission = frac(IN.worldPos.y * (20 - _StripeWidth) * 0.5) > 0.4 ? 
                                float3(0, 1, 0) * rim : float3(1, 0, 0) * rim;
        }
```

![](/assets/pic/131138.png)

## Lighting

[**[Specular Reflection]** Blinn-Phong](https://houd1018.github.io/posts/ShaderGraph-introTutorial/#specular-reflection---lambert--blinn-phong)

[PBR](https://houd1018.github.io/posts/ShaderGraph-introTutorial/#physically-based-rendering)

- vertex lighting [Gouraud]: calculated at each vertex  -> average across the surface
- pixel lighting [Phong]: more detailed high light, but more processing 

### Blinn-Phong

```c
		CGPROGRAM
		#pragma surface surf BlinnPhong

		// _Spec is predefined in the Unity
		float4 _Colour;
		half _Spec;
		fixed _Gloss;

		struct Input {
			float2 uv_MainTex;
		};

		void surf(Input IN, inout SurfaceOutput o) {
			o.Albedo = _Colour.rgb;
			o.Specular = _Spec;
			o.Gloss = _Gloss;
		}
		ENDCG
```

![](/assets/pic/233840.png)

### Physically Based Rendering

```c++
	SubShader{
		Tags{
			"Queue" = "Geometry"
		}

		CGPROGRAM
		#pragma surface surf StandardSpecular

        sampler2D _MetallicTex;
        fixed4 _Color;

		struct Input {
			float2 uv_MetallicTex;
		};

		void surf(Input IN, inout SurfaceOutputStandardSpecular o) {
            o.Albedo = _Color.rgb;
            o.Smoothness = tex2D (_MetallicTex, IN.uv_MetallicTex).r;
            o.Specular = _SpecColor.rgb;
		}
		ENDCG
	}
```

### Custom Lighting Model

#### CustomLambert

```c
        half4 LightingBasicLambert (SurfaceOutput s, half3 lightDir, half atten) {
              half NdotL = dot (s.Normal, lightDir);
              half4 c;
              c.rgb = s.Albedo * _LightColor0.rgb * (NdotL * atten);
              c.a = s.Alpha;
              return c;
          }
```

#### CustomBlinn

```c++
	   #pragma surface surf BasicBlinn
// has the same heading "Lighting"
	    half4 LightingBasicBlinn (SurfaceOutput s, half3 lightDir, half3 viewDir, half atten) {
            // format for the parameter in this function
	        half3 h = normalize (lightDir + viewDir);

	        half diff = max (0, dot (s.Normal, lightDir));

	        float nh = max (0, dot (s.Normal, h));
	        float spec = pow (nh, 48.0);

	        half4 c;
	        c.rgb = (s.Albedo * _LightColor0.rgb * diff + _LightColor0.rgb * spec) * atten;
	        c.a = s.Alpha;
	        return c;
	    }
```

#### ToonRamp - Ramp Texture

```c++
		#pragma surface surf ToonRamp

		float4 _Color;
		sampler2D _RampTex;
		
		float4 LightingToonRamp (SurfaceOutput s, fixed3 lightDir, fixed atten)
		{
			float diff = dot (s.Normal, lightDir);
			float h = diff * 0.5 + 0.5;
			float2 rh = h;
			float3 ramp = tex2D(_RampTex, rh).rgb;
			
			float4 c;
			c.rgb = s.Albedo * _LightColor0.rgb * (ramp);
			c.a = s.Alpha;
			return c;
		}
```

![](/assets/pic/134007.png)

## Pass & Blend

### Alpha - Transparent

["Queue" = "Transparent" -> Z-Buffer -> Transparent](https://houd1018.github.io/posts/Shader-intro/#buffer)

```c++
	SubShader{
		Tags{
			"Queue" = "Transparent"
		}
		// since the z buffer is 0, make sure set the render queue

		CGPROGRAM
            //setting the "alpha:fade"
		#pragma surface surf Lambert alpha:fade

		sampler2D _MainTex;

		struct Input {
			float2 uv_MainTex;
		};

		void surf(Input IN, inout SurfaceOutput o) {
			fixed4 c = tex2D(_MainTex, IN.uv_MainTex);
			o.Albedo = c.rgb;
			o.Alpha = c.a;
		}
		ENDCG
	}
```

![](/assets/pic/110730.png)

### Holograms - Pass

- **Pass Definition**: `Pass { . }` defines a block of code that represents a rendering pass within a shader. A pass encapsulates a set of rendering operations that should be performed together during a single rendering cycle.

- **Multiple Passes**: Shader programs can have multiple passes, and each pass can have its own unique set of rendering operations. For example, you might have one pass for rendering the basic color of an object and another pass for applying a reflection effect.

```c++
    SubShader
    {
        Tags{"Queue" = "Transparent"}

       Pass{
            //Zbuffer on, but do not write color info
           ZWrite On
           ColorMask 0
        }

        CGPROGRAM
        #pragma surface surf Lambert alpha:fade
       
        struct Input
        {
            float3 viewDir;
        };

        float4 _RimColor;
        float _RimPower;

        void surf (Input IN, inout SurfaceOutput o)
        {
            half rim = 1 - saturate(dot(normalize(IN.viewDir), o.Normal));
            o.Emission = _RimColor.rgb * pow(rim, _RimPower) * 10;
            // same as RimLight
            o.Alpha = pow(rim, _RimPower);
        }
        ENDCG
    }
```

![](/assets/pic/123822.png)

![](/assets/pic/123851.png)

### Blend

![](/assets/pic/130031.png)

**SrcFactor**: taking the color that's on the texture and multiplying it by 1 

**DestFactor**: and then it's also getting the color already in the frame buffer (whatever is behind this quad)

**add -> brighter**

```c++
Shader "Custom/BlendTest"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "black" {}
    }
    SubShader
    {
        Tags { "RenderType"="Transparent" }
        Blend One One
        Pass{
            SetTexture [_MainTex] {combine texture}
        }
    }
    FallBack "Diffuse"
}
```

```c++
        Blend SrcAlpha OneMinusSrcAlpha
```

### Cull - back face

```c
    SubShader
    {
        Tags { "RenderType"="Transparent" }
        Blend SrcAlpha OneMinusSrcAlpha
        // Default "Cull back"
        Cull Off
        Pass{
            SetTexture [_MainTex] {combine texture}
        }
    }
```

### Blender two image

```c++
Shader "Holistic/BasicTextureBlend" {
Properties{
		_MainTex ("MainTex", 2D) = "white" {}
		_DecalTex ("Decal", 2D) = "white" {}
		[Toggle] _ShowDecal("Show Decal?", Float) = 0
	}
	SubShader{
		Tags{
			"Queue" = "Geometry"
		}

		CGPROGRAM
		#pragma surface surf Lambert

		sampler2D _MainTex;
		sampler2D _DecalTex;
		float _ShowDecal;

		struct Input {
			float2 uv_MainTex;
		};

		void surf(Input IN, inout SurfaceOutput o) {
			fixed4 a = tex2D(_MainTex, IN.uv_MainTex);
			fixed4 b = tex2D(_DecalTex, IN.uv_MainTex) * _ShowDecal;
			o.Albedo = b.r > 0.9 ? b.rgb: a.rgb;
		}
		ENDCG
	}
	FallBack "Diffuse"
}
```



## Misc

### 	_SinTime

[Built-in shader variables](https://docs.unity3d.com/Manual/SL-UnityShaderVariables.html)

In this case the **_SinTime** returns 4 values that change overtime

```c++
c.rgb = (s.Albedo * _LightColor0.rgb * diff + _LightColor0.rgb * spec) * atten * _SinTime;
```

![](/assets/pic/sin.gif)
