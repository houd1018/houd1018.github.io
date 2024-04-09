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
