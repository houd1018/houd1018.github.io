---
title: URPShader
date: 2024-04-01 01:00:00 -800
categories: [Shader]
tags: [unity, shader]    # TAG names should always be lowercase
typora-root-url: ..
---

# URPShader

## Template

```c#
Shader "URP/unlit"
{
    Properties
    {
        _BaseColor ("Base Color", color) = (1, 1, 1, 1)
        _BaseMap ("BaseMap", 2D) = "white" { }
    }
    SubShader
    {
        Tags { "Queue" = "Geometry" "RenderType" = "0paque" "IgnoreProjector" = "True" "RenderPipeline" = "UniversalPipeline" }
        LOD 100

        Pass
        {
            Name "Unlit"
            HLSLPROGRAM

            // Pragmas
            #pragma target 2.0
            #pragma multi_compile_instancing
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_fog

            // Includes
            #include "Packages/com.unity.render-pipelines.core/ShaderLibrary/Color.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"


            struct appdata
            {
                float4 positionOS : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct v2f
            {
                float4 positionCS : SV_POSITION;
                float2 uv : TEXCOORD0;
            };

            CBUFFER_START(UnityPerMaterial)
            half4 _BaseColor;
            float4 _BaseMap_ST;
            CBUFFER_END

            TEXTURE2D(_BaseMap); 
            SAMPLER(sampler_BaseMap); 

            v2f vert(appdata v)
            {
                v2f o;
                o.positionCS = TransformObjectToHClip(v.positionOS.xyz);
                o.uv = TRANSFORM_TEX(v.uv, _BaseMap);
                return o;
            }

            half4 frag(v2f i) : SV_Target
            {
                half4 c;
                half4 baseMap = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, i.uv);
                c = baseMap * _BaseColor;
                return c;
            }
            ENDHLSL
        }
    }
}

```

## SRP Batcher & CBuffer

- Static Batching - Bake - same material different mesh
- Dynamic Batching - restrict on mesh - same material
- GPU Instancing - same mesh
- SRP Batcher - different material same shader. static mesh without rig

![](/assets/pic/20240401122517.png)

```c#
            CBUFFER_START(UnityPerMaterial) // 除了贴图，全放在同一CBuffer//UnityPerDraw -> 内部变量
            half4 _Color;
            CBUFFER_END
```

- 同一shader只batch一次

![](/assets/pic/20240401125219.png)

![](/assets/pic/20240401125348.png)

![](/assets/pic/20240401131227.png)

## Texture & Sampler

```c++
sampler2D _MainTex
tex2D(_MainTex, i.uv)
```

```c++
TEXTURE2D(_MainTex); // 纹理的定义，如果是编绎到GLES2.0平台，则相当于sampler2D_MainTex;否则就相当于Texture2D_MainTex;
SAMPLER(samlper_MainTex); //采样器的定义，如果是编绎到GLES2.0平台，就相当于空，否则就相当于SamplerState sampler_MainTex;
```

与Built in不同，Texture与Sampler分离定义(多个贴图用同个sampler)，不能被用于GLES2

- `SAMPLE_TEXTURE2D`

```c++
            half4 frag(Varyings i) : SV_TARGET
            {
                half4 c;
                half4 mainTex = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, i.uv);
                c = mainTex * _Color;
                return c;
            }
```

- sampler setting in inspector

![](/assets/pic/20240401134712.png)

```c
            #define smp SamplerState_Point_Repeat
            SAMPLER(SamplerState_Point_Repeat)
```

