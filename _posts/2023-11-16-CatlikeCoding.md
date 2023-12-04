---
title: CatlikeCoding
date: 2023-11-16 23:00:00 -800
categories: [Shader]
tags: [unity, shader, rendering, CG]    # TAG names should always be lowercase
math: true
---

# CatlikeCoding

## Basics

![](/assets/pic/cat_wave.gif)

![](/assets/pic/cat_multiwave.gif)

![](/assets/pic/cat_ripple.gif)

![](/assets/pic/cat_sphere.gif)

![](/assets/pic/cat_torus.gif)

## Shader Fundamentals

`float4 position : SV_POSITION;` is transformed position after interpolation from `float4 position : POSITION;`

so we need one more value (eg. uv) stands for the local position

---------------------

```c++
i.uv = TRANSFORM_TEX(v.uv, _MainTex);
i.uv = v.uv * _MainTex_ST.xy + _MainTex_ST.zw;
// equivalent
// used for tilling and offest
```

--------------

```c++
            struct VertexData {
                float4 position : POSITION;
                float2 uv : TEXCOORD0;
            };
// uv here is the uv from the mesh
```

## Combine Texture

```c++
Shader "Custom/Texture Splatting" {

    Properties {
        _MainTex ("Splat Map", 2D) = "white" {}
        [NoScaleOffset] _Texture1 ("Texture 1", 2D) = "white" {}
        [NoScaleOffset] _Texture2 ("Texture 2", 2D) = "white" {}
        [NoScaleOffset] _Texture3 ("Texture 3", 2D) = "white" {}
        [NoScaleOffset] _Texture4 ("Texture 4", 2D) = "white" {}
    }

    SubShader {

        Pass {
            CGPROGRAM

            #pragma vertex MyVertexProgram
            #pragma fragment MyFragmentProgram

            #include "UnityCG.cginc"

            sampler2D _MainTex;
            float4 _MainTex_ST;
            sampler2D _Texture1, _Texture2, _Texture3, _Texture4;
            
            struct VertexData {
                float4 position : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct Interpolators {
                float4 position : SV_POSITION;
                float2 uv : TEXCOORD0;
                float2 uvSplat : TEXCOORD1;
            };

            Interpolators MyVertexProgram (VertexData v) {
                Interpolators i;
                i.position = UnityObjectToClipPos(v.position);
                i.uv = TRANSFORM_TEX(v.uv, _MainTex);
                i.uvSplat = v.uv;
                return i;
            }

            float4 MyFragmentProgram (Interpolators i) : SV_TARGET {
                float4 splat = tex2D(_MainTex, i.uvSplat);
                return
                tex2D(_Texture1, i.uv) * splat.r +
                tex2D(_Texture2, i.uv) * splat.g +
                tex2D(_Texture3, i.uv) * splat.b +
                tex2D(_Texture4, i.uv) * (1 - splat.r - splat.g - splat.b);
            }

            ENDCG
        }
    }
}
```

## Light

### Diffuse

``#include "UnityStandardBRDF.cginc"``: defines the convenient `DotClamped` function, It contains a lot of other lighting function

![](/assets/pic/include-files.png)

`float4 _WorldSpaceLightPos0`: It has four components, because these are homogeneous coordinates. So the fourth component is 0 for our directional light.

`fixed4 _LightColor0`: This variable contains the light's color, multiplied by its intensity. Although it provides all four channels, we only need the RGB components.

```c++
Tags {
    "LightMode" = "ForwardBase"
}
.

float4 MyFragmentProgram (Interpolators i) : SV_TARGET {
    i.normal = normalize(i.normal);
    float3 lightDir = _WorldSpaceLightPos0.xyz;
    float3 lightColor = _LightColor0.rgb;
    float3 albedo = tex2D(_MainTex, i.uv).rgb * _Tint.rgb;
    float3 diffuse =
        albedo * lightColor * DotClamped(lightDir, i.normal);
    return float4(diffuse, 1);
}
```

### Specular

`float3 _WorldSpaceCameraPos`: The position of the camera can be accessed

`unity_ObjectToWorld`: object-to-world matrix

 [`reflect`](https://developer.download.nvidia.com/cg/reflect.html): It takes the direction of an incoming light ray and reflects it based on a surface normal.

```c++

                float3 reflectionDir = reflect(-lightDir, i.normal);
```

`Blinn-Phong`: It uses a vector **halfway between the light direction and the view direction**. The dot product between the normal and the half vector determines the specular contribution.

```c++
			float4 MyFragmentProgram (Interpolators i) : SV_TARGET {
				i.normal = normalize(i.normal);
				float3 lightDir = _WorldSpaceLightPos0.xyz;
                float3 viewDir = normalize(_WorldSpaceCameraPos - i.worldPos);
				float3 lightColor = _LightColor0.rgb;
				float3 albedo = tex2D(_MainTex, i.uv).rgb * _Tint.rgb;
				float3 diffuse =
					albedo * lightColor * DotClamped(lightDir, i.normal);
                float3 halfVector = normalize(lightDir + viewDir);

				return pow(
					DotClamped(halfVector, i.normal),
					_Smoothness * 100
				);
```

### Energy Conservation

`EnergyConservationBetweenDiffuseAndSpecular`:  utility function to take care of the energy conservation

(too bright, need to be absorbed)

```c++
                #include "UnityStandardUtils.cginc"
                
			float4 MyFragmentProgram (Interpolators i) : SV_TARGET {
				i.normal = normalize(i.normal);
				float3 lightDir = _WorldSpaceLightPos0.xyz;
                float3 viewDir = normalize(_WorldSpaceCameraPos - i.worldPos);
				float3 lightColor = _LightColor0.rgb;
				float3 albedo = tex2D(_MainTex, i.uv).rgb * _Tint.rgb;
                float oneMinusReflectivity;
				albedo = EnergyConservationBetweenDiffuseAndSpecular(
					albedo, _SpecularTint.rgb, oneMinusReflectivity
				);
				float3 diffuse =
					albedo * lightColor * DotClamped(lightDir, i.normal);
                float3 halfVector = normalize(lightDir + viewDir);
                float3 specular = _SpecularTint.rgb * lightColor * pow(
					DotClamped(halfVector, i.normal),
					_Smoothness * 100
				);

				return float4(diffuse + specular, 1);
			}
            ENDCG
        }
```

`metals`: strong specular tint, monochrome, do not have albedo

`nonmetals / dielectric`: weak monochrome specular, don't have a colored specular

`DiffuseAndSpecularFromMetallic`: Even pure dielectrics still have some specular reflection. *UnityStandardUtils* also has the `DiffuseAndSpecularFromMetallic` function, which takes care of this for us.

```c++
			float4 MyFragmentProgram (Interpolators i) : SV_TARGET {
				i.normal = normalize(i.normal);
				float3 lightDir = _WorldSpaceLightPos0.xyz;
                float3 viewDir = normalize(_WorldSpaceCameraPos - i.worldPos);
				float3 lightColor = _LightColor0.rgb;
				float3 albedo = tex2D(_MainTex, i.uv).rgb * _Tint.rgb;
                float3 specularTint;
				float oneMinusReflectivity;
				albedo = DiffuseAndSpecularFromMetallic(
					albedo, _Metallic, specularTint, oneMinusReflectivity
				);
				float3 diffuse =
					albedo * lightColor * DotClamped(lightDir, i.normal);
                float3 halfVector = normalize(lightDir + viewDir);
                float3 specular = specularTint * lightColor * pow(
					DotClamped(halfVector, i.normal),
					_Smoothness * 100
				);

				return float4(diffuse + specular, 1);
			}
```

### Physically-Based Shading

`#pragma target 3.0`: To make sure that Unity selects the best BRDF function, we have to target at least shader level 3.0

`BRDF`: stands for bidirectional reflectance distribution function.

`UNITY_BRDF_PBS`: The algorithm is accessible via the `**UNITY_BRDF_PBS**` macro, which is defined in *UnityPBSLighting*, The functions each have eight parameters.

```c++
			float4 MyFragmentProgram (Interpolators i) : SV_TARGET {
				i.normal = normalize(i.normal);
				float3 lightDir = _WorldSpaceLightPos0.xyz;
				float3 viewDir = normalize(_WorldSpaceCameraPos - i.worldPos);

				float3 lightColor = _LightColor0.rgb;
				float3 albedo = tex2D(_MainTex, i.uv).rgb * _Tint.rgb;

				float3 specularTint;
				float oneMinusReflectivity;
				albedo = DiffuseAndSpecularFromMetallic(
					albedo, _Metallic, specularTint, oneMinusReflectivity
				);
				
				UnityLight light;
				light.color = lightColor;
				light.dir = lightDir;
				light.ndotl = DotClamped(i.normal, lightDir);
				UnityIndirect indirectLight;
				indirectLight.diffuse = 0;
				indirectLight.specular = 0;

				return UNITY_BRDF_PBS(
					albedo, specularTint,
					oneMinusReflectivity, _Smoothness,
					i.normal, viewDir,
					light, indirectLight
				);
			}
```

## Multiple Lights

**Include Files**

```c++
#if !defined(MY_LIGHTING_INCLUDED)
#define MY_LIGHTING_INCLUDED

#include "UnityPBSLighting.cginc"

…

#endif
```

### Second Light

`Blend One One`: The default mode is no blending, which is equivalent to `One Zero`. The result of such a pass replaced anything that was previously in the frame buffer. To add to the frame buffer, we'll have to instruct it to use the `One One` blend mode. This is known as additive blending.

```c++
        Pass {
			Tags {
				"LightMode" = "ForwardAdd"
			}

            Blend One One
            ZWrite Off

			CGPROGRAM

			#pragma target 3.0

			#pragma vertex MyVertexProgram
			#pragma fragment MyFragmentProgram

			#include "MyLighting.cginc"

			ENDCG
		}
```

### Point Light

The `_WorldSpaceLightPos0` variable contains the current light's position.

But in case of a directional light, it actually holds the direction towards the light. 

This is done by subtracting the fragment's world position and normalizing the result.

```c++
light.dir = normalize(_WorldSpaceLightPos0.xyz - i.worldPos);
```

`UNITY_LIGHT_ATTENUATION`

`#define POINT`: there are multiple versions of it, one per light type. By default, it's for the directional light, which has no attenuation at all.

```c++
        Pass {
			Tags {
				"LightMode" = "ForwardAdd"
			}

            Blend One One
            ZWrite Off

			CGPROGRAM

			#pragma target 3.0

			#pragma vertex MyVertexProgram
			#pragma fragment MyFragmentProgram

            #define POINT

			#include "MyLighting.cginc"

			ENDCG
		}
    }
....
UnityLight CreateLight (Interpolators i) {
    UnityLight light;
    light.dir = normalize(_WorldSpaceLightPos0.xyz - i.worldPos);
    UNITY_LIGHT_ATTENUATION(attenuation, 0, i.worldPos);    
    light.color = _LightColor0.rgb * attenuation;
    light.ndotl = DotClamped(i.normal, light.dir);
    return light;
}
```

### Mixing Light

**Shader Variants**

`#pragma multi_compile DIRECTIONAL POINT`: This statement defines a list of keywords. Unity will create multiple shader variants for us, each defining one of those keywords.

Unity decides which variant to use based on the current light and the shader variant keywords. When rendering a directional light, it uses the `DIRECTIONAl` variant. When rendering a point light, it uses the `POINT` variant. And when there isn't a match, it just picks the first variant from the list.

```c++
            UnityLight CreateLight (Interpolators i) {
                UnityLight light;
                
                #if defined(POINT)
                    light.dir = normalize(_WorldSpaceLightPos0.xyz - i.worldPos);
                #else
                    light.dir = _WorldSpaceLightPos0.xyz;
                #endif
                
                float3 lightVec = _WorldSpaceLightPos0.xyz - i.worldPos;
                UNITY_LIGHT_ATTENUATION(attenuation, 0, i.worldPos);
                light.color = _LightColor0.rgb * attenuation;
                light.ndotl = DotClamped(i.normal, light.dir);
                return light;
            }
```

### Vertex Lights

Every visible object always gets rendered with its base pass. This pass takes care of the main directional light. Every additional light will add an extra additive pass on top of that. Thus, many lights will result in many draw calls. 

The problem is so bad, because lights are completely switched off. Fortunately, there is another way to render lights much cheaper, without completely turning them off. We can render them **per vertex**, instead of per fragment.

Vertex lighting is **only supported for point lights**.

`unity_LightColor[0].rgb`: *UnityShaderVariables* defines an array of vertex light colors.

### Spherical Harmonics

`ShadeSH9`: *UnityCG* contains the `ShadeSH9` function, which computes lighting based on the spherical harmonics data, and a normal parameter.

https://catlikecoding.com/unity/tutorials/rendering/part-5/

## Bumpiness

### Height map

**how to process height map -> normal**

```c++
[NoScaleOffset] _HeightMap ("Heights", 2D) = "gray" {}

```

**Central Difference**: We've used **finite difference approximations** to create normal vectors. Specifically, by using the forward difference method. We take a point, and then look in one direction to determine the slope. As a result, the normal is biased in that direction. To get a better approximation of the normal, we can instead offset the sample points in **both directions**. This centers the linear approximation on the current point, and is known as the central difference method.

```c++
            void InitializeFragmentNormal(inout Interpolators i) {
                float2 delta = float2(_HeightMap_TexelSize.x * 0.5, 0);
                float h1 = tex2D(_HeightMap, i.uv - delta);
                float h2 = tex2D(_HeightMap, i.uv + delta);
                i.normal = float3(h1 - h2, 1, 0);
                i.normal = normalize(i.normal);
            }
```

$$
{
{{f}^{'}{\left({u}\right)}}=\lim_{{\delta\to{0}}}\frac{{ f{{\left({u}+\frac{\delta}{{2}}\right)}}- f{{\left({u}-\frac{\delta}{{2}}\right)}}}}{\delta}
}
$$

**Using Both Dimensions** ->**cross product**


$$
{
{A}\times{B}={\left|{\left|{A}\right|}\right|}{\left|{\left|{B}\right|}\right|} \sin{{\left(\theta\right)}}{N}
}
$$



we can construct the vector directly, instead of having to rely on the `cross` function.
```c++
            void InitializeFragmentNormal(inout Interpolators i) {
                float2 du = float2(_HeightMap_TexelSize.x * 0.5, 0);
                float u1 = tex2D(_HeightMap, i.uv - du);
                float u2 = tex2D(_HeightMap, i.uv + du);

                float2 dv = float2(0, _HeightMap_TexelSize.y * 0.5);
                float v1 = tex2D(_HeightMap, i.uv - dv);
                float v2 = tex2D(_HeightMap, i.uv + dv);

                i.normal = float3(u1 - u2, 1, v1 - v2);
                i.normal = normalize(i.normal);
            }
```
