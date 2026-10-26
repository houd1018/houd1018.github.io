---
title: Interactive Desert
date: 2024-04-04 01:00:00 -800
categories: [Shader]
tags: [unity, shader, urp]    # TAG names should always be lowercase
typora-root-url: ..
---

# Interactive Desert

## **Tessellation**: Camera distance & Noise Displacement

![](/assets/pic/Tessellation.gif)

![](/assets/pic/Tessellation_1.gif)

![](/assets/pic/20240408213250.png)

![](/assets/pic/shader-programs (1).png)

![](/assets/pic/hull.png)

- domain: 指定patch的类型，可选的有：tri(三角形)、quad（四边形）、isoline（线段，苹果的metal api不支持：2018/8/21）。不同的patch类型，细分的方式也有差别，后面会详细介绍。

- partitioning：分割模式，有三种：integer，fractional_even，fractional_odd

- outputtopology：输出拓扑结构。有三种：triangle_cw（顺时针环绕三角形）、triangle_ccw（逆时针环绕三角形）、line（线段）。

- outputcontrolpoints：输出的控制点的数量（每个图元），不一定与输入数量相同，也可以新增控制点。

- patchconstantfunc：指定ConstHS。

- maxtessfactor：最大细分度，告知驱动程序shader用到的最大细分度，硬件可能会针对这个做出优化。Direct3D 11和OpenGL Core都至少支持64。

- InputPatch：输入的patch，尖括号第二个参数，代表输入的控制点的数量（“quad”为4个），由API设置，并且ConstHS里对应的数值要与这里相同。

- SV_OutputControlPointID：给出控制点在path中的ID，与outputcontrolpoints对应，例如outputcontrolpoints为4，那么i的取值就是[0,4)的整数。

- SV_PrimitiveID：给出patch的ID。

  https://zhuanlan.zhihu.com/p/42550699

  **Hull Shader**: not primitive, but patch with control point

```c++
// info so the GPU knows what to do (triangles) and how to set it up , clockwise, fractional division
// hull takes the original vertices and outputs more
[UNITY_domain("tri")]
[UNITY_outputcontrolpoints(3)]
[UNITY_outputtopology("triangle_cw")]
[UNITY_partitioning("fractional_odd")]

// --------------- tessellation method -> uncomment to use -------------
//[UNITY_partitioning("fractional_even")]
//[UNITY_partitioning("pow2")]
//[UNITY_partitioning("integer")]
[UNITY_patchconstantfunc("patchConstantFunction")]

ControlPoint hull(InputPatch<ControlPoint, 3> patch, uint id : SV_OutputControlPointID)
{
	return patch[id];
}
```

**Domain Shader**: might be followed with **geometry shader** or fragment shader

```c++
    [UNITY_domain("tri")]
    Varyings domain(TessellationFactors factors, OutputPatch<ControlPoint, 3> patch, float3 barycentricCoordinates : 		SV_DomainLocation)
    {
        Attributes v;
        // interpolate the new positions of the tessellated mesh
        Interpolate(vertex)
        Interpolate(uv)
        Interpolate(color)
        Interpolate(normal)

        return vert(v);
    }
```

- 在Hull Shader和Domain Shader之间传递顶点数据 -> 用于输出处理过的顶点数据

```c++
// Extra vertex struct
struct ControlPoint
{
	float4 vertex : INTERNALTESSPOS;
	float2 uv : TEXCOORD0;
	float4 color : COLOR;
	float3 normal : NORMAL;
};

// tessellation data
struct TessellationFactors
{
	float edge[3] : SV_TessFactor; // factor for each edge
	float inside : SV_InsideTessFactor; // internal factor
};

```

- subdivision based on **camera distance**
- `UnityCalcTriEdgeTessFactors`: 边的细分程度是由其两端顶点的因子决定的，从而确保了细分的一致性和平滑性。

```c++
TessellationFactors UnityCalcTriEdgeTessFactors (float3 triVertexFactors)
{
    TessellationFactors tess;

	// edge factor
    tess.edge[0] = 0.5 * (triVertexFactors.y + triVertexFactors.z);
    tess.edge[1] = 0.5 * (triVertexFactors.x + triVertexFactors.z);
    tess.edge[2] = 0.5 * (triVertexFactors.x + triVertexFactors.y);

	// internal factor
    tess.inside = (triVertexFactors.x + triVertexFactors.y + triVertexFactors.z) / 3.0f;
    return tess;
}
 
// fade tessellation at a camera distance
float CalcDistanceTessFactor(float4 vertex, float minDist, float maxDist, float tess)
{
				float3 worldPosition = mul(unity_ObjectToWorld, vertex).xyz;
				float dist = distance(worldPosition, _WorldSpaceCameraPos);
				float f = clamp(1.0 - (dist - minDist) / (maxDist - minDist), 0.01, 1.0);
 
				return f * tess;
}
 
TessellationFactors DistanceBasedTess(float4 v0, float4 v1, float4 v2, float minDist, float maxDist, float tess)
{
				// calculate factor for three vertex in the triangle
				float3 f;
				f.x = CalcDistanceTessFactor(v0, minDist, maxDist, tess);
				f.y = CalcDistanceTessFactor(v1, minDist, maxDist, tess);
				f.z = CalcDistanceTessFactor(v2, minDist, maxDist, tess);

				// calculate the factor for the whole triangle
				return UnityCalcTriEdgeTessFactors(f);
}

// part of the Hull Shader
// patch: a triangle with three control point
// actual tessellation
TessellationFactors patchConstantFunction(InputPatch<ControlPoint, 3> patch)
{
    float minDist = 2.0;
    float maxDist = _MaxTessDistance + minDist;
    TessellationFactors f;
 
    // distance based tesselation
    return DistanceBasedTess(patch[0].vertex, patch[1].vertex, patch[2].vertex, minDist, maxDist, _Tess);
}
```

- displacement

```c++
			Varyings vert(Attributes input)
			{
				Varyings output;
				
				float4 Noise = tex2Dlod(_Noise, float4(input.uv + (_Time.x * 0.1), 0, 0));

				input.vertex.xyz += normalize(input.normal) *  Noise.r * _Weight;
				output.vertex = TransformObjectToHClip(input.vertex.xyz);
				output.color = input.color;
				output.normal = input.normal;
				output.uv = input.uv;
				
				return output;
			}
```

`tex2Dlod`: 允许直接指定LOD（Level of Detail）级别。LOD是多级渐远纹理（Mipmaps）的一个概念，用于根据物体与摄像机的距离选择不同精度的纹理，以优化渲染性能。使用`tex2Dlod`可以精确控制采样的细节级别，而不是让GPU自动决定。

```
float4 tex2Dlod(sampler2D s, float4 coord)
```

`coord.w`用于指定想要采样的Mipmap级别。`coord.z`在大多数情况下用不到，可以设置为0。

## Interactive Mesh

- `RenderTexture`
- `orthographic camera`
- `particle system` on **a layer that only the orthographic camera can see**

![](/assets/pic/Sand.gif)

![](/assets/pic/1 (1).gif)

![](/assets/pic/20240410030138.png)

### Varying

- read RenderTexture in correct UV
- worldPosition.xz - _Position.xz: get relative distance to the object -> (0,1)

```c++
    //create local uv
    float2 uv = worldPosition.xz - _Position.xz;
    uv = uv / (_OrthographicCamSize * 2);
    uv += 0.5;

    // Effects RenderTexture Reading
    float4 RTEffect = tex2Dlod(_GlobalEffectRT, float4(uv, 0, 0));
    // smoothstep to prevent bleeding
   	RTEffect *=  smoothstep(0.99, 0.9, uv.x) * smoothstep(0.99, 0.9,1- uv.x);
	RTEffect *=  smoothstep(0.99, 0.9, uv.y) * smoothstep(0.99, 0.9,1- uv.y);
```

- Get noise map in world space -> move vertex
- set particle system as green -> RTEffect.g
- **Move Vertices with the guide of normal** (exclude path: 1-(RTEffect.g * _SnowDepth))

```c++
    // worldspace noise texture
    float SnowNoise = tex2Dlod(_Noise, float4(worldPosition.xz * _NoiseScale, 0, 0)).r;
    output.viewDir = SafeNormalize(GetCameraPositionWS() - worldPosition);

	// important: move vertices up where snow is
	input.vertex.xyz += SafeNormalize(input.normal) * saturate(( _SnowHeight) + (SnowNoise * _NoiseWeight)) * saturate(1-(RTEffect.g * _SnowDepth));
```

### Frag

- 因为是俯视图，所以要乘上worldPos.xz

```c++
                // worldspace Noise texture
                float3 topdownNoise = tex2D(_Noise, IN.worldPos.xz * _NoiseScale).rgb;

                // worldspace Snow texture
                float3 snowtexture = tex2D(_MainTex, IN.worldPos.xz * _SnowTextureScale).rgb;
                
```

- color the path

```c++
                //lerp between snow color and snow texture
                float3 snowTex = lerp(_Color.rgb,snowtexture * _Color.rgb, _SnowTextureOpacity);
                
                //lerp the colors using the RT effect path 
                float3 path = lerp(_PathColorOut.rgb * effect.g, _PathColorIn.rgb, saturate(effect.g * _PathBlending)); // depth
                float3 mainColors = lerp(snowTex,path, saturate(effect.g));

```

- Multiple Light

```c++
                // extra point lights support
                float3 extraLights;
                int pixelLightCount = GetAdditionalLightsCount();
                for (int j = 0; j < pixelLightCount; ++j) {
                    Light light = GetAdditionalLight(j, IN.worldPos, half4(1, 1, 1, 1));
                    float3 attenuatedLightColor = light.color * (light.distanceAttenuation * light.shadowAttenuation);
                    extraLights += attenuatedLightColor;			
                }

                float4 litMainColors = float4(mainColors,1) ;
                extraLights *= litMainColors.rgb;
```

- Sparkle from sparkle noise map

  ```c++
                  // add in the sparkles
                  float sparklesStatic = tex2D(_SparkleNoise, IN.worldPos.xz * _SparkleScale).r;
                  float cutoffSparkles = step(_SparkCutoff,sparklesStatic);				
                  litMainColors += cutoffSparkles  *saturate(1- (effect.g * 2)) * 4;
  ```

- rim light based on noise map height

  ```c++
                  // add rim light
                  half rim = dot((IN.viewDir), IN.normal) * topdownNoise.r;
                  litMainColors += _RimColor * pow(abs(rim), _RimPower);
  ```

- Blend all ambient and main light color

```c++
                // ambient and mainlight colors added
                half4 extraColors;
                extraColors.rgb = litMainColors.rgb * mainLight.color.rgb * (shadow + unity_AmbientSky.rgb);
                extraColors.a = 1;   
```

### Shadow

```c#
    #pragma multi_compile _ _MAIN_LIGHT_SHADOWS _MAIN_LIGHT_SHADOWS_CASCADE _MAIN_LIGHT_SHADOWS_SCREEN
    #pragma multi_compile _ _ADDITIONAL_LIGHT_SHADOWS
    #pragma multi_compile _ _SHADOWS_SOFT
```

**Receive: varying**

```c++
    // transform to clip space
    #ifdef SHADERPASS_SHADOWCASTER
        output.vertex = GetShadowPositionHClip(input);
    #else
        output.vertex = TransformObjectToHClip(input.vertex.xyz);
    #endif
```

**Receive: frag**

```c++
    // lighting and shadow information
    float shadow = 0;

	// 通过世界坐标获取阴影坐标位置
    half4 shadowCoord = TransformWorldToShadowCoord(IN.worldPos);

    #if _MAIN_LIGHT_SHADOWS_CASCADE || _MAIN_LIGHT_SHADOWS
        Light mainLight = GetMainLight(shadowCoord);
        shadow = mainLight.shadowAttenuation;
    #else
        Light mainLight = GetMainLight();
    #endif
```

```c#
    // colored shadows
    float3 coloredShadows = (shadow + (_ShadowColor.rgb * (1-shadow)));
    litMainColors.rgb = litMainColors.rgb * mainLight.color * (coloredShadows);
```

**Cast**

```c++
// 变化vertex位置 & 避免摩尔纹 -》 稍后创建一个深度贴图 用于计算阴影
float4 GetShadowPositionHClip(Attributes input)
{
    float3 positionWS = TransformObjectToWorld(input.vertex.xyz);
    float3 normalWS = TransformObjectToWorldNormal(input.normal);
 
    float4 positionCS = TransformWorldToHClip(ApplyShadowBias(positionWS, normalWS, 0));
 
    #if UNITY_REVERSED_Z
        positionCS.z = min(positionCS.z, positionCS.w * UNITY_NEAR_CLIP_VALUE);
    #else
        positionCS.z = max(positionCS.z, positionCS.w * UNITY_NEAR_CLIP_VALUE);
    #endif
        return positionCS;
}
    
    
    // transform to clip space
    #ifdef SHADERPASS_SHADOWCASTER
        output.vertex = GetShadowPositionHClip(input);
    #else
        output.vertex = TransformObjectToHClip(input.vertex.xyz);
    #endif
```

```c++
        // Shadow Casting Pass
        Pass
        {
            	Name "ShadowCaster"
            	Tags { "LightMode" = "ShadowCaster" }
            	ZWrite On
            	ZTest LEqual
            	Cull Off
            
            	HLSLPROGRAM
            	#pragma target 3.0
            
            	// Support all the various light  ypes and shadow paths
            	#pragma multi_compile_shadowcaster
            
            	// Register our functions
            
            	#pragma fragment frag
            	// A custom keyword to modify logic during the shadow caster pass

            	half4 frag(Varyings IN) : SV_Target{
                		return 0;
            	}
            
            	ENDHLSL
        }
```

