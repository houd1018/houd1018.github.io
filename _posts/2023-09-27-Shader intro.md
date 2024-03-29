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

### Stencil Buffer

![](/assets/pic/142241.png)

![](/assets/pic/222548.png)

**Wall (be seen through)**

```c++
		Stencil
		{
			Ref 1
			Comp notequal
			Pass keep
		}
```

**Hole (see-through glass)**

```c++
		Tags { "Queue"="Geometry-1" }

		ColorMask 0
		ZWrite off
		Stencil
		{
			Ref 1
			Comp always
			Pass replace
		}
```

**Select Function in Inspector**

```c++
	Properties
	{
		_Color("Main Color", Color) = (1,1,1,1)

		_SRef("Stencil Ref", Float) = 1
		[Enum(UnityEngine.Rendering.CompareFunction)]	_SComp("Stencil Comp", Float)	= 8
		[Enum(UnityEngine.Rendering.StencilOp)]	_SOp("Stencil Op", Float)		= 2
	}
			Stencil
		{
			Ref[_SRef]
			Comp[_SComp]	
			Pass[_SOp]	
		}
```

![](/assets/pic/222046.png)

![](/assets/pic/magicbox.gif)

## Vertex & Fragment

![](/assets/pic/224309.png)

![](/assets/pic/230236.png)

**Basic Structure**

```c++
Shader "Unlit/ColorVF"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 100

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
            };

            struct v2f
            {
                // vertex value from world space -> clipping space
                float4 vertex : SV_POSITION;
                float4 color : COLOR;
            };

            sampler2D _MainTex;
            float4 _MainTex_ST;

            v2f vert (appdata v)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(v.vertex);
                return o;
            }

            // vert -> return 0
            // o -> i > frag (can't see)

            fixed4 frag (v2f i) : SV_Target
            {
                // sample the texture
                fixed4 col = fixed4(0, 1, 0, 1);
                return col;
            }
            ENDCG
        }
    }
}
```

### Material

- Ripple UV
- GrabPass [Mirror effect] [capture the screen]

```c
SubShader
{
	Tags{ "Queue" = "Transparent"}
	// draw last -> avoid mirror inside the mirror
	GrabPass{}
	Pass
	{
		CGPROGRAM
		#pragma vertex vert
		#pragma fragment frag
		
		#include "UnityCG.cginc"

		struct appdata
		{
			float4 vertex : POSITION;
			float2 uv : TEXCOORD0;
		};

		struct v2f
		{
			float2 uv : TEXCOORD0;
			float4 vertex : SV_POSITION;
		};

		sampler2D _GrabTexture;
		sampler2D _MainTex;
		float4 _MainTex_ST;
		float _ScaleUVX;
		float _ScaleUVY;
		
		v2f vert (appdata v)
		{
			v2f o;
			o.vertex = UnityObjectToClipPos(v.vertex);
			o.uv = TRANSFORM_TEX(v.uv, _MainTex);
			o.uv.x = sin(o.uv.x * _ScaleUVX);
			o.uv.y = sin(o.uv.y * _ScaleUVY);
			return o;
		}
		
		fixed4 frag (v2f i) : SV_Target
		{
			fixed4 col = tex2D(_GrabTexture, i.uv);
			return col;
		}
		ENDCG
	}
```

![](/assets/pic/123852.png)

### Lighting

```c++
    SubShader
    {
        Pass
        {
            Tags {"LightMode"="ForwardBase"}
            // calculate lighting at the beginning
            // not deferred Lighting
        
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc" 
            #include "UnityLightingCommon.cginc" 
	
			struct appdata {
			    float4 vertex : POSITION;
			    float3 normal : NORMAL;
			    float4 texcoord : TEXCOORD0;
			};

            struct v2f
            {
                float2 uv : TEXCOORD0;
                fixed4 diff : COLOR0; 
                float4 vertex : SV_POSITION;
            };

            v2f vert (appdata v)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = v.texcoord;

                // convert normal in the mesh(local space) to world space
                // To compare the noraml with lighting(in world space)
                half3 worldNormal = UnityObjectToWorldNormal(v.normal);

                // Lambert -> dot product
                half nl = max(0, dot(worldNormal, _WorldSpaceLightPos0.xyz));
                o.diff = nl * _LightColor0;
                return o;
            }
            
            sampler2D _MainTex;

            fixed4 frag (v2f i) : SV_Target
            {
                fixed4 col = tex2D(_MainTex, i.uv);
                col *= i.diff;
                return col;
            }
            ENDCG
        }
```

### Shadow

- one more draw call

  ```c
  Pass
  {
      Tags {"LightMode"="ShadowCaster"}
  
      CGPROGRAM
      #pragma vertex vert
      #pragma fragment frag
      #pragma multi_compile_shadowcaster
      #include "UnityCG.cginc"
      
      struct appdata {
          float4 vertex : POSITION;
          float3 normal : NORMAL;
          float4 texcoord : TEXCOORD0;
      };
  
      struct v2f { 
          // take vertex position and normal
          V2F_SHADOW_CASTER;
      };
  
      v2f vert(appdata v)
      {
          v2f o;
          
          // create the shadow data
          TRANSFER_SHADOW_CASTER_NORMALOFFSET(o)
          return o;
      }
  
      float4 frag(v2f i) : SV_Target
      {
          // spit out the shadow color
          SHADOW_CASTER_FRAGMENT(i)
      }
      ENDCG
  }
  ```

- accept shadow

  ```c
  Pass
  {
      Tags {"LightMode"="ForwardBase"}
      // calculate lighting at the beginning
      // not deferred Lighting
  
      CGPROGRAM
      #pragma vertex vert
      #pragma fragment frag
  
      // ignore stuff to show shadow
      #pragma multi_compile_fwdbase nolightmap nodirlightmap nodynlightmap novertexlight
      #include "UnityCG.cginc" 
      #include "UnityLightingCommon.cginc"
      #include "Lighting.cginc" 
      #include "AutoLight.cginc"
  
  	struct appdata {
  	    float4 vertex : POSITION;
  	    float3 normal : NORMAL;
  	    float4 texcoord : TEXCOORD0;
  	};
  
      struct v2f
      {
          float2 uv : TEXCOORD0;
          fixed4 diff : COLOR0; 
  
          // TRANSFER_SHADOW is looking for "pos"
          float4 pos : SV_POSITION;
          SHADOW_COORDS(1)
      };
  
      v2f vert (appdata v)
      {
          v2f o;
          o.pos = UnityObjectToClipPos(v.vertex);
          o.uv = v.texcoord;
  
          // convert normal in the mesh(local space) to world space
          // To compare the noraml with lighting(in world space)
          half3 worldNormal = UnityObjectToWorldNormal(v.normal);
  
          // Lambert -> dot product
          half nl = max(0, dot(worldNormal, _WorldSpaceLightPos0.xyz));
          o.diff = nl * _LightColor0;
          
          // shadow(world space) -> v2f
          TRANSFER_SHADOW(o)
          return o;
      }
      
      sampler2D _MainTex;
  
      fixed4 frag (v2f i) : SV_Target
      {
          fixed4 col = tex2D(_MainTex, i.uv);
  
          // calculate the shadow
          fixed shadow = SHADOW_ATTENUATION(i);
          col.rgb *= i.diff * shadow;
          return col;
      }
      ENDCG
  }
  ```

  ![](/assets/pic/193239.png)

## Effect Examples

### Vertex Extruding

-  use the vertex shader inside the code with a surface shader --> no need to write the lighting / shadow from vertex shader

- inout: indicates that the parameter can be both an input (read-only) and an output (writable) parameter. In this case, `appdata v` is both provided as input data for the function, and the function is allowed to modify it to change the vertex position.

  ```c
      SubShader {
  
        CGPROGRAM
  		  // declear using vertex in the surface shader
  	      #pragma surface surf Lambert vertex:vert
  	      
  
  		  // --------- vertex part -----------
  	      struct appdata {
  	      	float4 vertex: POSITION;
  	      	float3 normal: NORMAL;
  	      	float4 texcoord: TEXCOORD0;
  	      };
  
  	      float _Amount;
  
  		  // inout:  the function is allowed to modify it to change the vertex position
  	      void vert (inout appdata v) {
  	          v.vertex.xyz += v.normal * _Amount;
  	      }
  
  	      sampler2D _MainTex;
  		  
  		  // ---------- surface part--------
  	      struct Input {
  	          float2 uv_MainTex;
  	      };
  
  	      void surf (Input IN, inout SurfaceOutput o) {
  	          o.Albedo = tex2D (_MainTex, IN.uv_MainTex).rgb;
  	      }
  
        ENDCG
      } 
  ```

  ![](/assets/pic/extrude.gif)

### Outlining

#### Simple Outline

```c++
   SubShader {
	  Tags { "Queue"="Transparent" } // make it on top of everything
   	  ZWrite off // to overlay the orginal vertex
      CGPROGRAM
	      #pragma surface surf Lambert vertex:vert
	      struct Input {
	          float2 uv_MainTex;
	      };
	      float _Outline;
	      float4 _OutlineColor;
	      void vert (inout appdata_full v) {
	          v.vertex.xyz += v.normal * _Outline;
	      }
	      sampler2D _MainTex;
	      void surf (Input IN, inout SurfaceOutput o) 
	      {
	          o.Emission = _OutlineColor.rgb;
	      }
      ENDCG
	  // --------- draw the mainTex ------------
      ZWrite on

      CGPROGRAM
	      #pragma surface surf Lambert
	      struct Input {
	          float2 uv_MainTex;
	      };

	      sampler2D _MainTex;
	      void surf (Input IN, inout SurfaceOutput o) {
	          o.Albedo = tex2D (_MainTex, IN.uv_MainTex).rgb;
	      }
      ENDCG
    } 
```

#### Advanced Outline - Geometry

```c++
v2f vert(appdata v) {
    v2f o;
    o.pos = UnityObjectToClipPos(v.vertex);

    /* the normal vector (v.normal) of the vertex is transformed from object space to view space 
    by multiplying it with the inverse transpose of the Model-View matrix */
    float3 norm   = normalize(mul ((float3x3)UNITY_MATRIX_IT_MV, v.normal));

    // 2D offset -> transforms the x and y components of the normalized normal vector into screen space
    float2 offset = TransformViewToProjection(norm.xy);

    // on Geometry, not vertex position
    o.pos.xy += offset * o.pos.z * _Outline;
    o.color = _OutlineColor;
    return o;
}
```

![](/assets/pic/224201.png)

### Glass - GrabPass

- GrabPass{}: get `sampler2D _GrabTexture`
- bump map -> distort
- MainTex -> mirror texture (like blend)
- UnpackNormal: Vector4 -> Vector3
- [Accessing shader properties in Cg/HLSL](https://docs.unity3d.com/Manual/SL-PropertiesInPrograms.html)

```c++
Shader "Holistic/Glass"
{
	Properties
	{
		_MainTex ("Texture", 2D) = "white" {}
		_BumpMap ("Normalmap", 2D) = "bump" {}
		_ScaleUV ("Scale", Range(1,5000)) = 1
	}
	SubShader
	{
		Tags{ "Queue" = "Transparent"}
		GrabPass{}
		Pass
		{
			CGPROGRAM
			#pragma vertex vert
			#pragma fragment frag
			
			#include "UnityCG.cginc"

			struct appdata
			{
				float4 vertex : POSITION;
				float4 uv : TEXCOORD0;
			};

			struct v2f
			{
				float2 uv : TEXCOORD0;
				float4 uvgrab : TEXCOORD1;
				float2 uvbump : TEXCOORD2;
				float4 vertex : SV_POSITION;
			};

			sampler2D _GrabTexture; // captured using the GrabPass{} block
			float4 _GrabTexture_TexelSize;
			sampler2D _MainTex;
			float4 _MainTex_ST;
			sampler2D _BumpMap;
			float4 _BumpMap_ST;
			float _ScaleUV;
			
			v2f vert (appdata v)
			{
				v2f o;
				o.vertex = UnityObjectToClipPos(v.vertex);
                
                //add this to check if the image needs flipping
				# if UNITY_UV_STARTS_AT_TOP
                float scale = -1.0;
                # else
                float scale = 1.0f;
                # endif

				/*basing on where it positions itself within the screen space, 
				it calculates what the UVs would be 
				(or the equivalent UVs required) for our grab texture */

				/* 0.5  texture coordinates -> normalized texture space: 
				The entire expression is multiplied by 0.5 at the end. 
				This is used to map the calculated coordinates to a normalized texture space, 
				where both the horizontal and vertical components range from 0 to 1. */

                //include scale in this formulae as below
                o.uvgrab.xy = (float2(o.vertex.x, o.vertex.y * scale) + o.vertex.w) * 0.5;
				
                o.uvgrab.zw = o.vertex.zw;
				o.uv = TRANSFORM_TEX( v.uv, _MainTex );
				o.uvbump = TRANSFORM_TEX( v.uv, _BumpMap );
				return o;
			}
			
			fixed4 frag (v2f i) : SV_Target
			{
				// add distortion
				half2 bump = UnpackNormal(tex2D( _BumpMap, i.uvbump )).rg; 
				float2 offset = bump * _ScaleUV * _GrabTexture_TexelSize.xy;
				i.uvgrab.xy = offset * i.uvgrab.z + i.uvgrab.xy;
				
				// show mirror texture
				fixed4 col = tex2Dproj( _GrabTexture, UNITY_PROJ_COORD(i.uvgrab));
				fixed4 tint = tex2D(_MainTex, i.uv);
				col *= tint;
				return col;
			}
			ENDCG
		}
	}
}
```

![](/assets/pic/distortGlass.gif)

### Wave

- `void vert (inout appdata v, out Input o)`

- `_Time`

- Surface shader `struct Input`: ` float3 vertColor;` & `float2 uv_MainTex;` 

  ```c++
  Shader "Holistic/Waves" {
      Properties {
        _MainTex("Diffuse", 2D) = "white" {}
        _Tint("Colour Tint", Color) = (1,1,1,1)
        _Freq("Frequency", Range(0,5)) = 3
        _Speed("Speed",Range(0,100)) = 10
        _Amp("Amplitude",Range(0,1)) = 0.5
      }
      SubShader {
        CGPROGRAM
        #pragma surface surf Lambert vertex:vert 
        
        struct Input {
            float2 uv_MainTex;
            float3 vertColor;
        };
        
        float4 _Tint;
        float _Freq;
        float _Speed;
        float _Amp;
  
        struct appdata {
            float4 vertex: POSITION;
            float3 normal: NORMAL;
            float4 texcoord: TEXCOORD0;
            float4 texcoord1: TEXCOORD1;
            float4 texcoord2: TEXCOORD2;
        };
        
        // changes appdata and Input value (modify vertex color)
        void vert (inout appdata v, out Input o) {
          // HLSL compiler
            UNITY_INITIALIZE_OUTPUT(Input,o);
            float t = _Time * _Speed;
  
            // height value for vertex
            float waveHeight = sin(t + v.vertex.x * _Freq) * _Amp + 
                          sin(t*2 + v.vertex.x * _Freq*2) * _Amp;
            v.vertex.y = v.vertex.y + waveHeight;
            v.normal = normalize(float3(v.normal.x + waveHeight, v.normal.y, v.normal.z));
            
            
            // trough darker in the bottom
            // peak lighter in the top
            o.vertColor = waveHeight + 2; 
  
        }
  
        sampler2D _MainTex;
        void surf (Input IN, inout SurfaceOutput o) {
            float4 c = tex2D(_MainTex, IN.uv_MainTex);
            o.Albedo = c * IN.vertColor.rgb; // add vertex color
        }
        ENDCG
  
      } 
      Fallback "Diffuse"
    }
  ```

  ![](/assets/pic/Wave.gif)

### Scrolling Texture

```c++
void surf (Input IN, inout SurfaceOutput o) {
    _ScrollX *= _Time;
    _ScrollY *= _Time;
    float3 water = (tex2D (_MainTex, IN.uv_MainTex + float2(_ScrollX, _ScrollY))).rgb;
    float3 foam = (tex2D (_FoamTex, IN.uv_MainTex + float2(_ScrollX/2.0, _ScrollY/2.0))).rgb;
    o.Albedo = (water + foam)/2.0;

}
```

![](/assets/pic/scorll.gif)

### Plasma

```c++
void surf (Input IN, inout SurfaceOutput o) {
  const float PI = 3.14159265;
  float t = _Time.x * _Speed;

  //vertical
  float c = sin(IN.worldPos.x * _Scale1 + t);

  //horizontal
  c += sin(IN.worldPos.z * _Scale2 + t);

  //diagonal
  c += sin(_Scale3*(IN.worldPos.x*sin(t/2.0) + IN.worldPos.z*cos(t/3))+t);

  //circular
  float c1 = pow(IN.worldPos.x + 0.5 * sin(t/5),2);
  float c2 = pow(IN.worldPos.z + 0.5 * cos(t/3),2);
  c += sin(sqrt(_Scale4*(c1 + c2)+1+t));

  o.Albedo.r = sin(c/4.0*PI);
  o.Albedo.g = sin(c/4.0*PI + 2*PI/4);
  o.Albedo.b = sin(c/4.0*PI + 4*PI/4);
  o.Albedo *= _Tint;
}
```

![](/assets/pic/plasma.gif)



## Misc

### 	_SinTime

[Built-in shader variables](https://docs.unity3d.com/Manual/SL-UnityShaderVariables.html)

In this case the **_SinTime** returns 4 values that change overtime

```c++
c.rgb = (s.Albedo * _LightColor0.rgb * diff + _LightColor0.rgb * spec) * atten * _SinTime;
```

![](/assets/pic/sin.gif)

### [Concise Cg built-in function table](https://www.sjbaker.org/wiki/index.php?title=Concise_Cg_built-in_function_table)

### **Shader Cheat Sheet**

#### Lambert and BlinnPhong

```c++
struct SurfaceOutput
{
    fixed3 Albedo;  // diffuse color
    fixed3 Normal;  // tangent space normal, if written
    fixed3 Emission;
    half Specular;  // specular power in 01 range
    fixed Gloss;    // specular intensity
    fixed Alpha;    // alpha for transparencies
};
```

#### Standard

```c++
struct SurfaceOutputStandard
{
    fixed3 Albedo;      // base (diffuse or specular) color
    fixed3 Normal;      // tangent space normal, if written
    half3 Emission;
    half Metallic;      // 0=non-metal, 1=metal
    half Smoothness;    // 0=rough, 1=smooth
    half Occlusion;     // occlusion (default 1)
    fixed Alpha;        // alpha for transparencies
};
```

#### Standard Specular

```c++
struct SurfaceOutputStandardSpecular
{
    fixed3 Albedo;      // diffuse color
    fixed3 Specular;    // specular color
    fixed3 Normal;      // tangent space normal, if written
    half3 Emission;
    half Smoothness;    // 0=rough, 1=smooth
    half Occlusion;     // occlusion (default 1)
    fixed Alpha;        // alpha for transparencies
};
```

#### Vertex/Fragment Structures

##### **AppData**

```c++
struct appdata_full {
    float4 vertex : POSITION;       //vertex xyz position
    float4 tangent : TANGENT; 
    float3 normal : NORMAL;
    float4 texcoord : TEXCOORD0;    //uv coordinate for first set of UVs
    float4 texcoord1 : TEXCOORD1;   //uv coordinate for second set of UVs
    float4 texcoord2 : TEXCOORD2;   //uv coordinate for third set of UVs
    float4 texcoord3 : TEXCOORD3;   //uv coordinate for fourth set of UVs
    fixed4 color : COLOR;           //per-vertex colour
};
struct v2f
{
    float4 pos :  SV_POSITION;      //The position of the vertex in clipping space.
    float3 normal : NORMAL;         //The normal of the vertex in clipping space.
    float4 uv : TEXCOORD0;          //UV from first UV set.
    float4 textcoord1 : TEXCOORD1;  //UV from second UV set.
    float4 tangent : TANGENT;       //A vector that runs at right angles to a normal.
    float4 diff : COLOR0;           //Diffuse vertex colour.
    float4 spec : COLOR1;           //Specular vertex colour.
}
```

##### Multipass Shader Format

```c++
Shader "MultipassShader"
{
    Properties    //PROPERTIES BLOCK
    {
        _Color ("Main Color", Color) = (1,1,1,1)
        _MainTex ("Base (RGB)", 2D) = "white" {}
    }
   
    SubShader    //ENCLOSING SHADER BLOCK
    {                            
        //FIRST PASS - SURFACE SHADER DOES NOT REQUIRE PASS BLOCK
        Tags { "Queue" = "Geometry+1" }
 
        CGPROGRAM
        #pragma surface surf BlinnPhong 
       
        float4 _Color;
        struct Input
        {
        };
       
        void surf (Input IN, inout SurfaceOutput o)
        {
        }
        ENDCG
 
        //SECOND PASS - ANOTHER SURFACE SHADER, NO PASS BLOCK REQUIRED
        ZWrite Off      
        Blend DstColor Zero
        CGPROGRAM
        #pragma surface surf BlinnPhong
        float4 _Color;
        struct Input
        {
        };
     
        void surf (Input IN, inout SurfaceOutput o)
        {
        }
        ENDCG  
 
        //THIRD PASS -  VERT/FRAG NEEDS TO BE ENCLOSED IN PASS
        Pass
        {
            Tags { "LightMode" = "Always" }
            ZWrite Off
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"
            sampler2D _MainTex;
         
            struct v2f
            {
            };
            v2f vert (appdata_full v)
            {
            }
                        
            half4 frag( v2f i ) : COLOR
            {
            }
            ENDCG          
        }
       
        //FOURTH PASS - SIMPLE SHADER LAB FUNCTIONS
        Pass
        {          
            Tags { "LightMode" = "Always" }
            ZWrite Off
            SetTexture [_MainTex]
            {
                 combine constant* texture
            }
        } 
    }
    Fallback "Diffuse
 
}
```
