---
title: Blender introTutorial
date: 2023-07-02 20:00:00 -800
categories: [DCC]
tags: [Blender]    # TAG names should always be lowercase
---
# Blender introTutorial

## 基础篇

### 下载Blender

https://www.blender.org/

视频链接：[基础篇：下载与安装](https://www.bilibili.com/video/BV14u41147YH?p=2&vd_source=b3dd25013db68693b4a0fff3bf691805)

### 快捷键以及基础操作

视频链接（配合视频了解）：[基础篇：让手听话](https://www.bilibili.com/video/BV14u41147YH?p=3&vd_source=b3dd25013db68693b4a0fff3bf691805)

**试试各个操作（不需要记住快捷键，大致试试即可）**

**视角控制**

- 鼠标中键：旋转视图
- 鼠标滚轮：缩放视图
- shift+鼠标中键：平移视图
- ctrl+alt+Q：切换四视图

**视图切换**

- 小键盘数字5：正交视图 （没有小键盘的话，可以在preference里设置）
- 小键盘7：顶视图（ctrl+7底视图）
- 小键盘1：前视图（ctrl+1后视图）
- 小键盘3：右视图（ctrl+36左视图）
- 小键盘9：反转视角
- 小键盘2468：上下左右小角度视角调整
- 小键盘0：摄像机视角
- 小键盘.：聚焦选中物体
- `~: 转盘目录代替上述操作
- alt + 移动鼠标中键：代替上述操作
- alt + z: 切换正常模式和透视模式
- 窗口四角的 “+” 用来合并和分割窗口

**控制物体**

- G：选中物体后进入移动模式（G+X/Y/Z 沿单一轴向移动，排除某一轴向加shift；或结合鼠标中键选择轴向，右键退出）（R和S 同理）
- R：旋转
- S：缩放
- alt + G/R/S : 清除上述操作 回到默认值
- H：隐藏物体 （shift+H：把没有选中的物体隐藏）
- T：隐藏/显示 左侧工具栏
- N：显示/隐藏 右侧工具栏
- W:  切换选择工具
- shift+鼠标右键：移动3D游标
- shift+C：游标回到世界坐标原点
- shift+A：添加元素
- shift+D: 移动并复制
- shift+S：3D游标设置转盘
- shift+C: 将游标设置到世界中心
- tab:物体编辑模式切换快捷键（需要设置中开启）
- ctrl+空格：最大化显示当前窗口（Mac是control+空格，如果不可用可能是被输入法切换占用，系统设置里改一下）

### 界面

视频链接（配合视频了解）：[基础篇：认识界面](https://www.bilibili.com/video/BV14u41147YH?p=4&vd_source=b3dd25013db68693b4a0fff3bf691805)

- 面板可替换 可拆分
- 和Unity一样可以保存面板
- 理解 **游标**和**原点**
- 理解 世界坐标 和 local坐标

**快捷键**

- G移动状态下，按住ctrl，可以以每个方格增量为单位进行吸附。

- 切换全局和局部坐标系:在G移动状态下按两次X，Y，Z,

### 练习

视频链接：[基础篇：珍珠耳环少女](https://www.bilibili.com/video/BV14u41147YH?p=5&vd_source=b3dd25013db68693b4a0fff3bf691805)

**跟着教程尝试一个完整的建模Pipeline**

- 记得在preference中选择cuda/optiX任一tab后，在左下角点保存（不然不生效，渲染速度慢）、

  右侧Scene窗口也要选择GPU Compute

---------------------

## 建模篇 (edit mode)

### 点线面的控制

视频链接：[建模篇：点线面的控制](https://www.bilibili.com/video/BV14u41147YH?p=6&vd_source=b3dd25013db68693b4a0fff3bf691805)

- 选择工具的切换:W
- 框选:B
- 刷选: C (滚动鼠标可以改变鼠标大小，右键或者Esc结束刷选状态)
- 反选:ctrl+I
- 选择两个元素最短路径: ctrl
- 选择相连元素:L
- 循环选择:按住alt +双击，就可以选择一个循环边
- 垂直方向的循环选择:ctrl alt + 双击
- 随机选择: 左上方选择菜单- select random
- 加选: ctrl+ 数字键盘加号
- 减选:ctrl+ 数字键盘减号
- A: 全选 选中的物体
- 法相/法线: 指始终垂直某平面或者某切面的虚线，用来定义光线如何从曲面反弹的向量。

-----------------

- 按两次G：点在线上滑动

### 十大建模操作

视频链接：[建模篇：十大建模操作](https://www.bilibili.com/video/BV14u41147YH?p=7&vd_source=b3dd25013db68693b4a0fff3bf691805)

1. 挤出 Extrude: E （连续挤出:CTRL+ 右键）
2. 向内挤出 Inset: I
3. 倒角 Bevel: CTRL+B
4. 循环切割 Loop Cut: CTRL+R -> 把面与面分开
5. 合并: M
6. 断开: V
7. 填充: F （栅格填充CTRL+F，栅格填充必须是偶数面）
8. 切刀 Knife: K （按鼠标右键或者空格键退出）
9. 桥接: CTRL+E （桥接必须是同一个物体）合并物体:CTRL+J
10. 分离: P

**Cautions:** 

1. 尽量不要在物体模式下缩放，尽量在编辑模式下缩放。
2. 假如你在物体模式下做过缩放:记得应用下这个缩放。（CTRL+A -> Apply Scale）

-----------

**复制**: shift + D (复制出新物体) alt + D (复制出关联物体 -> 数据会同步修改) 

**设置父级**：

- 点父级 -> shift + left click 子级 -> ctrl + P
- 清除父级: ALT+P
- 用Curve时，选择Vertex -> 跟随父物体的曲线曲率移动
- inspector中选择Select Hierarchy -> 拖动整个合集

**吸附** (eg. 树上的苔藓)

![](/assets/pic/141807.png)

**衰减边界** （拉伸时, 同时拉伸周围的面）

![](/assets/pic/144045.png)

**Spin** (围绕哪个中心点旋转)

![](/assets/pic/150835.png)

**关联材质**: Ctrl + L

**聚焦选中物体**：/

选中单个物体中**独立的一部分**：L


### Modifier

视频链接：[建模篇：什么是修改器](https://www.bilibili.com/video/BV14u41147YH/?p=8&vd_source=b3dd25013db68693b4a0fff3bf691805)

*常用操作*

**Subdivision**: 细分 -> 光滑（**很常用**）(Ctrl + 2: 快速添加细分为2的modifier)

**Solidify**：获取任意网格的表面，然后为之添加深度，使之变厚

**Boolean**：可以对两个物体进行交集，差集，并集运算偶尔会出现奇怪的问题，慎用 （eg.镂空）

**Bevel**： 宽度是坡口形成的两条新边的距离，段数是增加细分

**Simple Deform**: Twist / Bend / Taper / Stretch (可叠加使用)

**Shirnkwrap**: 贴在另一个物体上 （eg.苔藓）

**Array**: 以一定规律生成同一物体 （eg.花瓣）

**Mirror**：镜像对称生成

**Lattice**: Ctrl + P (Bind object with Lattice) 用晶格框住物体，通过晶格控制形变

**Curve**: 绑定曲线（比起Simple Deform更加灵活）（eg. 头发/藤曼/尾巴）

- Alt + S: 曲线倒角半径（无需绑定 直接建模）
- 闭合曲线:
  - 方法1:选中要闭合的两个点,F
  - 方法2:选中一个点，ALT+C

**Skin**: 蒙皮 -> 从线段 -> 快速建模（eg. 树干） 

- Ctrl + A：改变半径
- 勾选蒙皮修改器的平滑着色可以让模型平滑着色

**Displace**: 使用材质的灰度来映射出平面 -> 快速建模（eg. 石头/山峰地形）

## 材质篇

- 学会如何添加和删除材质 | 用两个节点做简单材质 
- 会添加有纹理的材质 | 会改变纹理投影的方式和角度
- 学会使用蒙版做材质
- 做出来有凹凸感和形变的材质
- 学会做混合材质 | Node Wrangler插件
- 学会简单的UV绘制

### 材质基础 | Principled BSDF

视频链接：[材质篇：材质基础与原理化BSDF](https://www.bilibili.com/video/BV14u41147YH/?p=14&vd_source=b3dd25013db68693b4a0fff3bf691805)

#### 属性：

- **GGX** - 是一种微表面反射光照模型模型,有比较好的染效果
- **多重散射 multiscatter GGX **- 比这个GGX会在多计算一些微平面间的光线反弹和散射但是这个会比GGX慢，一般肉眼也看不出来，所以基本上就默认GGX就行了
- **随机游走 Random Walk** - 这一种模拟次表面的染方式，不支持EEVEE染器

#### 输入参数：(多试试)

- **基础色 Base Color** - 模型的颜色，也可以接一个颜色贴图，一般不要纯黑或者纯白
- **金属度 Metallic** - 0 是非金属，1是金属,一般我们要么选0，要么选1
- **糙度 Roughness** - 0代表越平滑，1代表越粗，确定**漫反射和镜面反射**时候物体表面的粗糙程度
- **次表面 Subsurface** - 决定你的模型是不是**透光**的，比如皮肤，窗帘等的通透程度，一般不会调太大，没有那么通透的东西
  - **次表面半径** - 决定半透光散射的距离，三个值分别代表RGB三个通道的散射半径，
  - **次表面颜色** - 次表面颜色决定透过去的颜色是什么样的，最终显示的是跟次表面半径相乘后显示的效果所以如果你想完全显示次表面颜色，次表面半径就全部设定为1
  - **次表面IOR** - 次表面散射的折射率，仅支持cycles
  - **次表面各向异性**-次表面散射的方向，仅支持cycles
- **高光 Specular** - 代表物体的菲尼尔效应反射率程度，数值越大，高光反射量越大，高光越亮，因为所有物体都是有一些菲尼尔反射的，所以高光这个值不要设为零，多少给一点。默认是0.5
  - **高光染色 Specular Tint** - 默认不设置的时候，物理默认的高光是白色的，
    但是你把高光染色调到1，就会被物体本身的颜色和谐，一般金属高光会染色，非金属高光不会染色
  - **各向异性过滤 Anisotropic** - 调大的时候可以把一点的高光转换成沿切线方向的细长高光，仅支持cycles
  - **各向异性旋转** - 比较常使用的是金属的部分，他可以控制你的金属的高光分布的方向，仅支持cycles
- **光泽 Sheen** - 用于**布料**的部分，调到1，有天鹅绒的效果，控制的是褶皱反光的反射数量，数值越大越明显
  - **光泽染色Sheen Tint** - 会把材质颜色和白色光色混合
- **清漆 Clear Coat** - 这个类似于给你的材质加了一层包光。多一层白色高光，常用与制作车漆材质
- **透射 Transmission**-让你的模型**透明**，只有打开这个，IOR折射率和透射粗度才起作用
  - **透射粗糙度**-物体**内部**的粗度，可以做**毛玻璃**
  - **IOR折射率** - 透明材质常用的光折射率，可以网上搜索各种材质的IOR
- **自发光 Emission** - 可以**发光**，霓虹灯
- **法向 Normal**-通常这个会链接PBR的normalmap法线贴图
- **切向 Tangent** - 这个就是各向异性这种**金属高光的方向**。可以作为切向贴图接口

### 纹理
- 不同颜色的node代表不同的数据类型 （eg. 紫色是vector，灰色是常量，黄色是color，绿色是shader输出）
![](/assets/pic/142331.png)

![](/assets/pic/142621.png)

#### Texture Coordinate 

- 制作动画时 使用全局坐标，不然贴图会跟着几何原点移动
- 可以设置第三个物体坐标，来控制贴图移动
- 默认为UV
![](/assets/pic/143754.png)
尝试不同的texture node
![](/assets/pic/150720.png)

### 蒙版

- Color Ramp -> 单色蒙版
- Mix - 多纹理蒙版
![](/assets/pic/154945.png)

### 凹凸感Bump & 置换形变 Displacement

**凹凸感Bump** （Bump并不是真形变，只是修改法线，光照也随之改变）

- 纹理 （灰度贴图）
- 凹凸节点 bump（转为矢量）
- Texture Coordinate + mapping
  ![](/assets/pic/165511.png)

**RBG -> vector**
![](/assets/pic/170507.png)

**置换**  （真形变）（如何导入在网上下载的材质）

- subdivision
- modifier -> displacement
- 导入置换贴图
  - 着色贴图
  - normal贴图 -> bump -> BSDF Normal （模拟光照） -> 形变 （需要bump modifier）（eevee & cycles）
  - DIsplacement贴图 -> 形变 （cycles）
  - Rough -> 修改光泽

----------------------------------------

**Node Wrangler 插件** : 

- 先选中你要加的节点，按**Ctrl+T** 就可以自动添加映射和纹理坐标

- Control + shift + left click：预览输出样式

- **Control + shift + T** -> principal BSDF：**快捷导入PBR材质** 

  (Displacement: 在右侧修改bump和displacement)（cycles）
  ![](/assets/pic/181709.png)

- Ctrl+shift 右键拖拉：可以快速增加一个混合BSDF节点（Mix Shader）

- ALT+S: 快速切换混合节点的上下顺序

### UV editing
- 需要在编辑模式
- [材质篇：简单的UV纹理绘制](https://www.bilibili.com/video/BV14u41147YH?p=19&vd_source=b3dd25013db68693b4a0fff3bf691805)

![](/assets/pic/212521.png)