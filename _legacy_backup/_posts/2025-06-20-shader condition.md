---
title: shader condition
date: 2025-06-19 01:00:00 -800
categories: [Shader]
tags: [shader]    # TAG names should always be lowercase
typora-root-url: ..
---

# shader condition

**if** vs **step**

https://iquilezles.org/articles/gpuconditionals/

| 使用场景                                  | 推荐写法                  | 理由说明                                    |
| ------------------------------------- | --------------------- | --------------------------------------- |
| ✅ **分支内逻辑很轻（如返回常量 color）**            | `if / else`           | 逻辑清晰、代价极低，warp divergence 成本可以忽略        |
| ✅ **分支内逻辑代价较大（如 texture、函数等）**        | `if / else`           | 可以跳过不需要的计算，节省资源；即使发散也比每分支都执行更好          |
| ✅ **大多数像素走同一分支（分支高度一致）**              | `if / else`           | divergence 不明显，结构更清晰                    |
| ⚠️ **每个像素走的分支可能不同（高度发散）**             | `step + 加权混合`         | 所有路径同时执行，避免 warp divergence，但存在冗余计算     |
| ⚠️ **多个分支但都很轻，且差异性大**                 | `step + 加权混合`         | warp divergence 开销可能高；轻逻辑可忍受冗余计算带来的性能损失 |
| ❌ **希望减少冗余计算（只跑实际路径）**                | `if / else`           | `step` 会执行所有路径的表达式，反而更慢                 |
| ✅ **条件控制统一或 uniform 控制分支（全局一致）**      | 任意（推荐 `if/else`）      | warp 一致，性能差异极小，选择可读性更强的写法即可             |
| ❌ **条件中含有 discard、return、break 等控制流** | `if / else`（必须）       | 无法用 `step` 表达，只能靠真实控制流                  |
| ✅ **实现颜色插值、渐变、权重混合等效果**               | `step + 加权混合` 或 `mix` | 自然表达逻辑，用加权比 if/else 更清晰，也方便渐变插值         |


当if或者?:中return的内容不复杂时，GPU instruction会是select而不是branch，节约性能。