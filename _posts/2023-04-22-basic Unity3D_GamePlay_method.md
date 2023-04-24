---
title: basic Unity3D_Gameplay_method
date: 2023-04-22 20:00:00 -800
categories: [Unity]
tags: [unity, C#]    # TAG names should always be lowercase
---
# basic Unity3D_Gameplay_method

## transform
```c#
        // 都是 vector3
        // 全局位置
        print(transform.eulerAngles);
        print(transform.position);
        print(transform.lossyScale);

        // 相对位置
        print(transform.localEulerAngles);
        print(transform.localPosition);
        print(transform.localScale);
```

## Camera
- 用于将视锥内的模型渲染到屏幕上的组件, 可以设置视锥的近远面来控制渲染范團, 通过设置`Projection` 投影可以切换`Perspective`/`Orthographic`模式，因此2D项目在Unity中本质上也是3D的此外相机还支持分层剔除，将不同层的对象分开渲染
- 相机的移动要放在`LateUodate`中以避免其他运动物体闪烁卡顿

## Joint
- 关节所在物体必须挂载刚体，关节连接的刚体仍可以是关节，因此可以模拟一些复杂机械结构.
- 通过调节参数，可以实现很多常见的物理效果，比如降低弹簧关节的弹性即可模拟吊灯
- 除了常规关节，Configurablevoint可配置关节，可以进行非常详细的定制
- CharacterJoint角色关节可用来制作“布娃娃”系统，在很多游戏中用来模拟死亡的角色身体

## Ray - Unity物理系统提供的一种检测方式
`Pyhsics.Raycast`, `Pyhsics.RaycastAll`

规定射线的原点、方向、距离等，即可沿线检测是否有碰撞体存在，检测信息hitinfol以out参数形式带出一些不追求真实弹道模拟的射击游戏，经常使用射线检测来代替高速子弹判定，以节省性能开销
将鼠标的屏幕位置换算成摄像机视口位置，就可以利用射线制作MOBA游戏的点击移动效果
一些角色脚部贴合地面的的功能，也用到了射线检测（测量脚下地面法线）
```c#
    RaycastHit hitInfo;
    // Start is called before the first frame update
    void Start()
    {
        if (Physics.Raycast(Vector3.zero, Vector3.forward, out hitInfo))
        {
            // hitInfo.collider;
            // hitInfo.point;
            // hitInfo.normal;
        }
    }
```

## 鼠标点击检测
```c#
    RaycastHit hitInfo;
    Ray mouseRay;
    private void Update()
    {
        if (Input.GetMouseButtonDown(0))
        {
            mouseRay = Camera.main.ScreenPointToRay(Input.mousePosition);
            if(Physics.Raycast(mouseRay, out hitInfo)){
                print("点击了" + hitInfo.point);
            }
        }
    }
```

## Navigation System
A* algorithm