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

## [鼠标点击检测](https://docs.unity3d.com/ScriptReference/Camera.ScreenPointToRay.html)
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
### carve - bake后 可移动分割区域
![](/assets/pic/234939.png)
### 规划可移动路线
标记为static => not walkable => bake

## objects pool
predefined pool (**Queue**) to store instance, so that improve the efficiency. There is no more `instantiate` and `destory `.
- 初始池可以为空，也可以携带一批默认对象，节约第一次生成对象的性能开销
- 由于对象池中的「存货」，只有场中对象最大存量大于池中存货时才生成对象。因此池中对象数量到达峰值后，几乎不再需要生成对象，也无需销毁（需要消失时关闭并入队即可）
```c#
    public GameObject bulletOrigin;
    Queue<GameObject> bulletPool = new Queue<GameObject>();
    void Start()
    {
        if(bulletPool.Count == 0){
            Instantiate(bulletOrigin);
        }else{
            bulletPool.Dequeue().SetActive(true);
        }
    }

    // if the encountered object is bullet => enqueue
    private void OnTriggerEnter(Collider other) {
        if (other.name == bulletOrigin.name + "(Clone)"){
            other.gameObject.SetActive(false);
            bulletPool.Enqueue(other.gameObject);
        }
    }
```

## UnityWebRequest
```c#
    private void Start() {
        StartCoroutine(Request());
    }
    IEnumerator Request()
    {
        UnityWebRequest request = UnityWebRequest.Get("unity.cn");
        yield return request.SendWebRequest();
        print(request.downloadHandler.text);
    }
```

## URP设置
![](/assets/pic/215302.png)
![](/assets/pic/215113.png)

## shortcut
- 按住 `v` 可以吸附两个物体的顶点
- 按住 `ctrl`+`shift` 可以吸附两个物体的平面
- `ctrl`+`shift`+`f` -> 把摄像机调整到当前视角 

## animation
### Blend tree
- Control mutiple animations with blend tree using one parameter like speed.
- instead of using bool / trigger
![](/assets/pic/144712.png)
```c#
    private void SwitchAnimation(){
        // vector 3 => magnitude
        anim.SetFloat("Speed", agent.velocity.sqrMagnitude);
    }
```

## post-processing
![](/assets/pic/142910.png)

## ShaderGraph
Create ShaderGraph => Create Material
### 遮挡剔除
By adjusting URP global renderer to achieve optional render.
![](/assets/pic/152223.png)

## 需要应用于很多物体 / 需要挂很多component => 如何确保添加Component
```c#
// 当脚本挂载的gameobject没有 NavmeshAgent时，自动挂载NavMeshAgent
[RequireComponent(typeof(NavMeshAgent))]
public class EnemyController : MonoBehaviour
{
    private NavMeshAgent agent;

    private void Awake()
    {
        agent = GetComponent<NavMeshAgent>();
    }
}
```

## StateMachine

```c#

    public enum EnemyStates { GUARD, PATROL, CHASE, DEAD }
    void SwitchStates()
    {
        switch (enemyStates)
        {
            case EnemyStates.GUARD:
                break;
            case EnemyStates.PATROL:
                break;
            case EnemyStates.CHASE:
                break;
            case EnemyStates.DEAD:
                break;
        }
    }
```

## Gizmos - visualize parameter in Scene
```c#
    private void OnDrawGizmosSelected() {
        Gizmos.color = Color.blue;
        Gizmos.DrawWireSphere(transform.position, sightRadius);
    }
```

## StateMachineBehaviour
![](/assets/pic/193427.png)

## UI
`scale with screen size` -> resolution independent

![](/assets/pic/105541.png)

### health silder

![](/assets/pic/110307.png)

### Button
```c#
using UnityEngine.UI;

public class MainMenu : MonoBehaviour
{
    Button newGameBtn;
    Button continueBtn;
    Button quitBtn;

    private void Awake()
    {
        newGameBtn = transform.GetChild(1).GetComponent<Button>();
        continueBtn = transform.GetChild(2).GetComponent<Button>();
        quitBtn = transform.GetChild(3).GetComponent<Button>();

        quitBtn.onClick.AddListener(QuitGame);
        newGameBtn.onClick.AddListener(NewGame);
        continueBtn.onClick.AddListener(ContinueGame);
    }

    void QuitGame()
    {
        Application.Quit();
        Debug.Log("Quit");
    }

    void NewGame()
    {
        PlayerPrefs.DeleteAll();
        SceneController.Instance.TransitionToFirstLevel();
    }

    void ContinueGame()
    {
        SceneController.Instance.TransitionToLoadGame();
    }
}
```

## [异步加载场景SceneManager.LoadSceneAsync](https://docs.unity3d.com/ScriptReference/SceneManagement.SceneManager.LoadSceneAsync.html)
```c#
    IEnumerator Transition(string sceneName, TransitionDestination.DestinationTag destinationTag)
    {
        // TODO: save data
        if (SceneManager.GetActiveScene().name != sceneName)
        {
            // load scene and player
            // asy -> make sure load everything in next scene, and current scene didn't freeze at the same time
            yield return SceneManager.LoadSceneAsync(sceneName);
            yield return Instantiate(playerPrefeb, GetDestination(destinationTag).transform.position, GetDestination(destinationTag).transform.rotation);
            yield break;
        }
    }
```

## Awake -> OnEnable -> Start
```c#
// subscribe the function when load the scene
    private void OnEnable()
    {
        // move at ground
        MouseManager.Instance.OnMouseClicked += MoveToTarget;

        MouseManager.Instance.OnEnemyClicked += EventAttack;
    }

    private void Start()
    {
        GameManager.Instance.RegisterPlayer(characterStats);
    }

// unsubscribe the function when switch the scene
    private void OnDisable()
    {
        if(!MouseManager.IsInitialized) return;
        
        MouseManager.Instance.OnMouseClicked -= MoveToTarget;

        MouseManager.Instance.OnEnemyClicked -= EventAttack;
    }
```

## Save Data
[PlayerPrefs: stores Player preferences](https://docs.unity3d.com/ScriptReference/PlayerPrefs.html)

[JsonUtility: Generate a JSON representation of the public fields of an object(SO/Mono)](https://docs.unity3d.com/ScriptReference/JsonUtility.ToJson.html)
```c#
    public void Save(Object data, string key)
    {
        var jsonData = JsonUtility.ToJson(data, true);
        PlayerPrefs.SetString(key, jsonData);
        PlayerPrefs.Save();
    }

    public void Load(Object data, string key)
    {
        if (PlayerPrefs.HasKey(key))
        {
            JsonUtility.FromJsonOverwrite(PlayerPrefs.GetString(key), data);
        }
    }
```
**clear prefs before building 删除存档**

![](/assets/pic/165420.png)

## Timeline 动画
![](/assets/pic/155054.png)
![](/assets/pic/153416.png)
```c#
using UnityEngine.Playables;

    PlayableDirector director;

    private void Awake()
    {
        newGameBtn = transform.GetChild(1).GetComponent<Button>();
        director = FindObjectOfType<PlayableDirector>();
        newGameBtn.onClick.AddListener(PlayTimeline);
        director.stopped += NewGame;
    }

    void PlayTimeline()
    {
        director.Play();
    }

    void NewGame(PlayableDirector obj)
    {
        PlayerPrefs.DeleteAll();
        SceneController.Instance.TransitionToFirstLevel();
    }
```
