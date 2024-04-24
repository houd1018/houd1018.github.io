---
title: ToonShader
date: 2024-03-24 23:00:00 -800
categories: [Shader]
tags: [unity, shader]    # TAG names should always be lowercase
typora-root-url: ..
---

# ToonShader

![](/assets/pic/Toon.gif)

Unity Buit-in Pipeline

[Built-in shader variables](https://docs.unity3d.com/Manual/SL-UnityShaderVariables.html)

## Outline

- post-processing
- Back facing
- rim

**Back facing**

- vertex -> move with dir of normal

- cull front

- 法线变换到投影空间要乘以transform的转置逆再乘projection矩阵，这样法线不会受到非等比缩放的影响 -> 保证outline不会随着camera变粗细

  https://carmencincotti.com/2022-05-02/homogeneous-coordinates-clip-space-ndc/

```c#
float3 viewNormal = mul((float3x3)UNITY_MATRIX_IT_MV, v.normal.xyz);
float3 ndcNormal = normalize(TransformViewToProjection(viewNormal.xyz)) * pos.w;//将法线变换到NDC空间
```

- 缺点：不光滑物体断边

  - 解决：**相同位置顶点(cube的顶点有多条转角法线)的法线数据，进行平均计算**，将算出来的新法线写入模型切线数据中 -> 使用这个切线数据进行法线外扩

  - 因为只有法线和切线数据会随着骨骼动画而改变。所以如果渲染的是有骨骼动画的角色，写入切线数据里就不用做额外处理

  - 如果碰到了角色使用法线贴图或者各项异性材质这种需要原始切线数据的情况，那么可以先把平均法线转换到切线空间，再保存到UV或者顶点颜色上

  - Tool

    - ```c#
      using UnityEngine;
      using UnityEditor;
      using System.Collections.Generic;
      
      
      public class PlugTangentTools
      {
          [MenuItem("Tools/Normal2Tangent")]
          public static void WirteAverageNormalToTangentToos()
          {
              MeshFilter[] meshFilters = Selection.activeGameObject.GetComponentsInChildren<MeshFilter>();
              foreach (var meshFilter in meshFilters)
              {
                  Mesh mesh = meshFilter.sharedMesh;
                  WirteAverageNormalToTangent(mesh);
              }
      
              SkinnedMeshRenderer[] skinMeshRenders = Selection.activeGameObject.GetComponentsInChildren<SkinnedMeshRenderer>();
              foreach (var skinMeshRender in skinMeshRenders)
              {
                  Mesh mesh = skinMeshRender.sharedMesh;
                  WirteAverageNormalToTangent(mesh);
              }
          }
      
          private static void WirteAverageNormalToTangent(Mesh mesh)
          {
              var averageNormalHash = new Dictionary<Vector3, Vector3>();
              for (var j = 0; j < mesh.vertexCount; j++)
              {
                  if (!averageNormalHash.ContainsKey(mesh.vertices[j]))
                  {
                      averageNormalHash.Add(mesh.vertices[j], mesh.normals[j]);
                  }
                  else
                  {
                      averageNormalHash[mesh.vertices[j]] =
                          (averageNormalHash[mesh.vertices[j]] + mesh.normals[j]).normalized;
                  }
              }
      
              var averageNormals = new Vector3[mesh.vertexCount];
              for (var j = 0; j < mesh.vertexCount; j++)
              {
                  averageNormals[j] = averageNormalHash[mesh.vertices[j]];
              }
      
              var tangents = new Vector4[mesh.vertexCount];
              for (var j = 0; j < mesh.vertexCount; j++)
              {
                  tangents[j] = new Vector4(averageNormals[j].x, averageNormals[j].y, averageNormals[j].z, 0);
              }
              mesh.tangents = tangents;
          }
      }
      ```

**Full Codec**

```c#
Shader "Unlit/Ouline"
{
    Properties
    {
        _OutlineWidth ("Outline Width", Range(0.01, 10)) = 0.24
        _OutLineColor ("OutLine Color", Color) = (0.5, 0.5, 0.5, 1)
    }
    SubShader
    {
        Tags { "RenderType" = "ForwardBase" }

        pass
        {
            Tags { "LightMode" = "ForwardBase" }
            
            Cull Back
            
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"

            float4 vert(appdata_base v) : SV_POSITION
            {
                return UnityObjectToClipPos(v.vertex);
            }

            half4 frag() : SV_TARGET
            {
                return half4(1, 1, 1, 1);
            }

            ENDCG
        }

        Pass
        {
            Tags { "LightMode" = "ForwardBase" }
            
            Cull Front
            
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"

            half _OutlineWidth;
            half4 _OutLineColor;

            struct a2v
            {
                float4 vertex : POSITION;
                float3 normal : NORMAL;
                float2 uv : TEXCOORD0;
                float4 vertColor : COLOR;
                float4 tangent : TANGENT;
            };

            struct v2f
            {
                float4 pos : SV_POSITION;
                float3 vertColor : COLOR0;
            };


            v2f vert(a2v v)
            {
                v2f o;
                UNITY_INITIALIZE_OUTPUT(v2f, o);
                float4 pos = UnityObjectToClipPos(v.vertex);
                float3 viewNormal = mul((float3x3)UNITY_MATRIX_IT_MV, v.tangent.xyz);
                float3 ndcNormal = normalize(TransformViewToProjection(viewNormal.xyz)) * pos.w;//将法线变换到NDC空间
                float4 nearUpperRight = mul(unity_CameraInvProjection, float4(1, 1, UNITY_NEAR_CLIP_VALUE, _ProjectionParams.y));//将近裁剪面右上角的位置的顶点变换到观察空间
                float aspect = abs(nearUpperRight.y / nearUpperRight.x);//求得屏幕宽高比
                ndcNormal.x *= aspect;
                pos.xy += 0.01 * _OutlineWidth * ndcNormal.xy * v.vertColor.a;//顶点色a通道控制粗细
                o.pos = pos;
                o.vertColor = v.vertColor.rgb;
                return o;
            }

            fixed4 frag(v2f i) : SV_TARGET
            {
                return fixed4(_OutLineColor * i.vertColor, 0);//顶点色rgb通道控制描边颜色

            }
            ENDCG
        }
    }
}
```

![](/assets/pic/20240326203042.png)

## Shade

**Celluloid Style** - **双色阶的渲染** - **Lambert**

- *实现明暗边界分明的光照，并且单独设置明面和暗面的颜色来区分色调*
- smoothstep + lerp 柔化明暗边界  / 或者使用**Ramp贴图

```c#
                half4 col = 1;
                half4 mainTex = tex2D(_MainTex, i.uv);
                half3 viewDir = normalize(_WorldSpaceCameraPos.xyz - i.worldPos.xyz);
                half3 worldNormal = normalize(i.worldNormal);
                half3 worldLightDir = normalize(_WorldSpaceLightPos0.xyz);

                // [-1,1] -> [0,1]
                half halfLambert = dot(worldNormal, worldLightDir) * 0.5 + 0.5;

                // halfLambert - _ShadowRange > 0 -> 是受光面 -> 开始缓和
                // half3 diffuse = halfLambert > _ShadowRange ? _MainColor : _ShadowColor;
                // smoothstep 在edge0外 -> 0 在edge1外 -> 1
                half ramp = smoothstep(0, _ShadowSmooth, halfLambert - _ShadowRange);
                
                // 双色阶
                // 只在 halfLambert - _ShadowRange的值在（0, _ShadowSmooth）内lerp，其余是0和1
                half3 diffuse = lerp(_ShadowColor, _MainColor, ramp);
                diffuse *= mainTex.rgb;
```

## RimLight & Bloom

- Rimlight = 1.0 - saturate(dot(viewDir, worldNormal)) -> `fresnel`
- bloom的曝光主要集中在光照方向，边缘光的部分。将边缘光乘以漫反射公式，来获得比较符合光照方向边缘光。将它的值赋给Alpha通道。

```c#
                // rim light
                half f = 1.0 - saturate(dot(viewDir, worldNormal));
                half3 rimColor = f * _rimColor.rgb * _rimColor.a;
                half rim = smoothstep(_RimMin, _RimMax, f);
                rim = smoothstep(0, _RimSmooth, rim);

                // Bloom
                half NdotL = max(0, dot(worldNormal, worldLightDir));
                half rimBloom = pow(f, _RimBloomExp) * _RimBloomMulti * NdotL;
```

![](/assets/pic/20240326230105.png)

## Misc

` struct a2v`: Model Space

` struct v2f`: Clip Space (Default)

# URP

## Outline

- extend Normal (内部描边)

```c++
            v2f vert(appdata v)
            {
                v2f o;

                float3 positionOS = v.positionOS;
                positionOS += normalize(v.normalOS) * _OutlineWidth * 0.01;
                o.positionCS = TransformObjectToHClip(positionOS);
                return o;
            }
```

- 等距描边宽度

  ```c++
              v2f vert(appdata v)
              {
                  v2f o;
  
                  //思路:
                  //描边的宽度本身不会变化，只是由于我们离的远了，所以感觉是变细了//因此只需要对描边宽度乘上一个越来越大的值做为弥补即可
                  //求出相机与顶点间的距离
                  float3 positionWS = TransformObjectToWorld(v.positionOS);
                  float distance = length(_WorldSpaceCameraPos - positionWS);
                  distance = lerp(1, distance, _UniformWidth); //调整等边随视角的影响
  				
                  float3 positionOS = v.positionOS;
                  float3 width = normalize(v.normalOS) * _OutlineWidth * 0.01;
                  width *= distance;
                  positionOS += width;
                  o.positionCS = TransformObjectToHClip(positionOS);
                  return o;
              }
  ```

- Vertex Color -> 存储与模型数据中
  - RGB -> outline Color
  - A -> width

```c++
width *= v.color.a;


half4 frag(v2f i) : SV_Target
{
	return i.color * _OutlineColor;	
}
```

- 使用houdini平滑法线，将平滑法线信息写入切线空间，保持skinnmesh动画随之变化

![](/assets/pic/微信截图_20240424192008.png)

### External Outline

- Zwrite -> overdraw

- **Stencil**

  ```c++
              Stencil //mainTex
              {
                  Ref 1
                  Comp Always
                  Pass Replace
              }
        
              Stencil  //Outline
              {
                  Ref 1
                  Comp NotEqual
              }
  ```

  先draw MainTex标记为1，写入Stencil buffer，replace -> 永远渲染

  只有当mainTex以外的Outline 才画 -> not Equal, 没有被标记为1的像素

  

- **Render Objects**: custom "LightMode"

```c++
Tags { "LightMode" = "Outline" }
```

![](/assets/pic/20240401172952.png)

![](/assets/pic/20240401173015.png)

解决重叠物体间，outline消失：

```c++
public class ToonStencil : MonoBehaviour
{
    public int RefValue;
    void Start()
    {
        var renders = GetComponentsInChildren<MeshRenderer>();
        foreach (var r in renders)
        {
            r.material.SetInt("_Ref", RefValue);
        }

    }
}
```

## 多色阶shade - ShadowRamp - **Lambert**

```c++
            half4 frag(v2f i) : SV_Target
            {
                half4 c;
                half4 baseMap = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, i.uv);
                c = baseMap * _BaseColor;

                // Lambert
                Light MainLight = GetMainLight();
                half3 L = MainLight.direction;
                half3 N = normalize(i.normalWS);
                half NdotL = dot(N, L) * 0.5 + 0.5;

                half4 level;
                {
                    
                    level = ceil(NdotL * _Step) / _Step;

                    //利用采样渐变图实现更灵活的
                    half4 shadowRampMap = SAMPLE_TEXTURE2D(_ShadowRampMap, sampler_ShadowRampMap, NdotL);
                    level = shadowRampMap;
                }
                c *= level;
                return c;
            }
```

![](/assets/pic/20240401204514.png)

### ShowRamp Generator Tool

```c#
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEditor;

[CustomEditor(typeof(GradientGenerator))]
public class GradientGeneratorEditor : Editor
{
    private GradientGenerator gradientGenerator;

    void OnEnable()
    {
        gradientGenerator = target as GradientGenerator;
    }

    public override void OnInspectorGUI()
    {
        base.DrawDefaultInspector();
        if (GUILayout.Button("Generate"))
        {
            string path = EditorUtility.SaveFilePanel("保持纹理", "", "ShadowRampMap", "png");
            System.IO.File.WriteAllBytes(path, gradientGenerator.RampTexture.EncodeToPNG());
        }

    }
}

```

```c#
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class GradientGenerator : MonoBehaviour
{
    public Gradient GradientRamp;
    public Texture2D RampTexture;




    void OnValidate()
    {
        //创建一家纹理图
        RampTexture = new Texture2D(128, 1);
        RampTexture.wrapMode = TextureWrapMode.Clamp;
        RampTexture.filterMode = FilterMode.Bilinear;
        int count = RampTexture.width * RampTexture.height;
        //为纹理图声明相对应相除数量的颜色数组
        Color[] cols = new Color[count];
        for (int i = 0; i < count; i++)
        {
            cols[i] = GradientRamp.Evaluate((float)i / count);
        }



        RampTexture.SetPixels(cols);
        RampTexture.Apply();

        Shader.SetGlobalTexture("_ShadowRampMap", RampTexture);
    }

}


```

![](/assets/pic/20240401203004.png)



## Specular

```c++
                half4 specular;
                {
                    half3 H = normalize(L + V);
                    half NdotH = dot(N, H);
                    specular = _Specular.x * pow(NdotH, _Specular.y);
                    specular = smoothstep(0.5, 0.5 + _Specular.z, specular);
                    specular *= _Specular.w;
                    c += specular;
                }
```



![](/assets/pic/20240401205034.png)

### RimLight

```c#
                half4 fresnel;
                {
                    half NdotV = 1 - saturate(dot(N, V));
                    fresnel = _Fresnel.x * pow(NdotV, _Fresnel.y);
                    fresnel = smoothstep(0.5, 0.5 + _Fresnel.z, fresnel);
                    fresnel *= fresnel.w;
                    fresnel *= _FresnelColor;
                    c += fresnel;
                }
```

![](/assets/pic/20240401210035.png)
