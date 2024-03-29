---
title: basic Unity2D_Gameplay_method
date: 2023-03-30 20:00:00 -800
categories: [Unity]
tags: [unity, C#]    # TAG names should always be lowercase
---
# Basic Unity Method
## Transform.Rotate
```c#
void Transform.Rotate(float xAngle, float yAngle, float zAngle) (+ 5 多个重载)
/*The implementation of this method applies a rotation of zAngle degrees around the z axis, xAngle degrees around the x axis, and yAngle degrees around the y axis (in that order).*/
    
    // Update is called once per frame
    void Update()
    {
        
        transform.Rotate(0, 0, 0.1f);
        
    }
```

## Transform.Translate

```c#
void Transform.Translate(float x, float y, float z) (+ 5 多个重载)
//Moves the transform by x along the x axis, y along the y axis, and z along the z axis
      
    void Update()
    {
        transform.Translate(0, 0.01f, 0);
    }
```

## SerializeField

```c#
//Force Unity to serialize a private field. -> access in the inspector
// the value in inspector overide the script
// difference between "public": can be inspected in the unity and be private at the same time
[SerializeField] float moveSpeed = 0.01f;
```
### Header
```c#
    [Header("Questions")]
    [SerializeField] TextMeshProUGUI questionText;
    [SerializeField] QuestionSO question;

    [Header("answers")]
    [SerializeField] GameObject[] ansButtons;
    int correctAnsIdx;
    [SerializeField] Sprite CorrectSprite;
    [SerializeField] Sprite DefaultSprite;
```
```c#
    [Header("General")]
    [SerializeField] GameObject projectilePrefab;
    [SerializeField] float projectileSpeed = 10f;
    [SerializeField] float projectileLifetime = 5f;
    [SerializeField] float baseFiringRate = 0.2f;

    [Header("AI")]
    [SerializeField] bool isAI;
    [SerializeField] float firingRateVariance = 0f;
    [SerializeField] float minimumFiringRate = 0.1f;
    [HideInInspector] public bool isFiring;
```

## Input.GetAxis()

```c#
    void Update()
    {
        float steerAmount = Input.GetAxis("Horizontal") * steerSpeed;
        float MoveAmount = Input.GetAxis("Vertical") * moveSpeed;
        transform.Rotate(0, 0, -steerAmount);
        transform.Translate(0, MoveAmount, 0);
    }
```

## Time.deletaTime()

![deltaTime](/assets/pic/deltaTime.jpg)

## Rigid Body and Collider

![deltaTime](/assets/pic/rigid_collider.png)
[Rigidbody.interpolation](https://docs.unity3d.com/ScriptReference/Rigidbody-interpolation.html)

插帧平滑分为`Interpolate`根据上一帧插帧，和`Extrapolate`根据下一帧插帧，可分别尝试
- 碰撞监测模式通常设置为Discrete离散即可，高速运动时可使用连续监测，但性能消耗较大。
- Continuous用于会撞上纯碰撞体的高速刚体，Continurous Dynamic用于会撞上其他刚体的高速刚体。
- Continuous Speculative 比t Dynamic节约性能，对高速旋转扫掠的监测效果更好，但移动类监测更差
## OnCollisionEnter2D & OnTrigger

Collider -> is Trigger√

```c#
public class Collision : MonoBehaviour
{
    void OnCollisionEnter2D(Collision2D other) 
    {
        Debug.Log("Ouch!");
    }
    private void OnTriggerEnter2D(Collider2D other) {
        Debug.Log("triiger");
    }
}
```

## pixel per unit

pixel per unit get less -> image shows bigger -> resolution get less

![pixelPerUnit](/assets/pic/pixelPerUnit.png)  

## FollowCamera

we need a reference to access this game object

```c#
[SerializeField] GameObject thingToFollow;
    void LateUpdate()
    {
        transform.position = thingToFollow.transform.position + new Vector3(0, 0, -10);
    }
```

## Destory

```c#
//Removes a GameObject, component or asset.
Destroy(other.gameObject, destoryDelay);
```

## color32

```c#
Color32.Color32(byte r, byte g, byte b, byte a) 
//Constructs a new Color32 with given r, g, b, a components.
```

## GetComponent

```c#
// collide -> color switch
// get the component -> spriteRenderer.color
	SpriteRenderer spriteRenderer;
    private void Start() {
        spriteRenderer = GetComponent<SpriteRenderer>();
    }
    private void OnTriggerEnter2D(Collider2D other) {
        if(other.tag == "package" && !hasPackage){
            Debug.Log("1");
            hasPackage = true;
            spriteRenderer.color = hasPackagecolor;
            Destroy(other.gameObject, destoryDelay);
        }
        if(other.tag == "customer" && hasPackage == true){
            Debug.Log("2");
            spriteRenderer.color = noPackagecolor;
            hasPackage = false;
            
        }
    }
}
```

## Sprite Shape

collider -> offset -> make object closer to the sprite shape

height -> make the surrounding sprite higher

## Cinemathine [unity package]

- mange multiple cameras
- create rules for our cameras

**follow Camera**: Follow -> game object

Body -> Screen X/Y -> adjust the position of the camera -> show more what's to come 
![112231](/assets/pic/112231.png)
### Cinemachine Confiner
![112231](/assets/pic/113909.png)
### FreeLook
三个维度 自由设置摄像机
![](/assets/pic/195455.png)
## Location

The position of children is **relative** to the parents

## Surface Effector 2D

applies tangent forces along the surfaces of **colliders**

[Unity Doc: Surface Effector 2D](https://docs.unity3d.com/Manual/class-SurfaceEffector2D.html) 

not gonna stucked

![continous_collision](/assets/pic/continous_collision.png)  

## AddTorque()

```c#
public class PlayerController : MonoBehaviour
{
    Rigidbody2D rb2d;
    [SerializeField] float torqueAmout = 1f;
    // Start is called before the first frame update
    void Start()
    {
        rb2d = GetComponent<Rigidbody2D>();
    }

    // Update is called once per frame
    void Update()
    {
        if(Input.GetKey(KeyCode.LeftArrow)){
            rb2d.AddTorque(torqueAmout);
        }
    }
}
```

## SceneManagenment

```c#
    private void OnTriggerEnter2D(Collider2D other) {
        if(other.tag == "Player"){
            SceneManager.LoadScene(0);
        }
    }
```

## Invoke()

```c#
//Invokes the method methodName in time seconds.
private void OnTriggerEnter2D(Collider2D other) {
    if(other.tag == "Player"){
        Invoke("Reload", reloadTime);
    }
}
void Reload(){
    SceneManager.LoadScene(0);
}
```

## ParticleSystem

````c#
    [SerializeField] ParticleSystem finishEffect;
    private void OnTriggerEnter2D(Collider2D other) {
        if(other.tag == "Player"){
            finishEffect.Play();
            Invoke("Reload", reloadTime);
        }
    }
````
````c#
    void playHitEffect()
    {
        if (hitEffect != null)
        {
            ParticleSystem instance = Instantiate(hitEffect, transform.position, Quaternion.identity);
            Destroy(instance.gameObject, instance.main.duration + instance.main.startLifetime.constantMax);
        }
    }
````
Uncheck "Play on awake"
![playonawake](/assets/pic/playonawake.png)

## FindObjectOfType

````c#
    void Start()
    {
        rb2d = GetComponent<Rigidbody2D>();
        surfaceEffector2D = FindObjectOfType<SurfaceEffector2D>();
    }
// (automatically) The first active loaded object that matches the specified type.
````

## Audio

[audio listener](https://docs.unity3d.com/Manual/class-AudioListener.html)

[audio speaker](https://docs.unity3d.com/Manual/class-AudioSource.html)

[AudioSource](https://docs.unity3d.com/ScriptReference/AudioSource.html)

![1843](/assets/pic/IMG_3483.JPG)

```c#
    void playClip(AudioClip audioClip, float Volum)
    {
        if (audioClip != null)
        {
            AudioSource.PlayClipAtPoint(audioClip, Camera.main.transform.position, Volum);
        }
    }
```
![0026](/assets/pic/002603.png)
```c#
[SerializeField] AudioClip coinPickupSFX;
    
    void OnTriggerEnter2D(Collider2D other) 
    {
        if (other.tag == "Player")
        {
            // one shot audio
            AudioSource.PlayClipAtPoint(coinPickupSFX, Camera.main.transform.position);
            Destroy(gameObject);
        }
    }
```
## UI Canvas
[Canvas](https://docs.unity3d.com/Packages/com.unity.ugui@1.0/manual/UICanvas.html)
### Background
![RecTrans](/assets/pic/RectTrans.png)
### TextMashPRO
[TextMeshPro](https://docs.unity3d.com/Manual/com.unity.textmeshpro.html)
![textMeshPro](/assets/pic/textMeshPro.png)
For more fonts: https://www.dafont.com/
### Button layout
![buttonLayout](/assets/pic/buttonLayout.png)
### Get child component
```c#
    void Start()
    {
        questionText.text = question.GetQuestion();

        for (int i = 0; i < ansButtons.Length; i++)
        {
            TextMeshProUGUI buttonText = ansButtons[i].GetComponentInChildren<TextMeshProUGUI>();
            buttonText.text = question.GetAns(i);
        }
    }
```
### Image type: Filled -> make the image change
![filled](/assets/pic/filled.png)

### slider
[Unity Doc Slider](https://docs.unity3d.com/2018.3/Documentation/ScriptReference/UI.Slider.html)

## Scriptable Objects
1. Create SO Script
2. instantiate SO objects
3. Create **stats** (MonoBehavior) script including each arribute in SO with `get` and `set`
4. bind the **stats** to your "Player" / "Enemy" Object
5. Fill in the SO objects in step 2
````c#
[CreateAssetMenu(menuName = "Quiz Question", fileName = "New Question")]
public class QuestionSO : ScriptableObject
{
    [TextArea(2, 6)]
    [SerializeField] string question = "Enter new question text here";
}
````
![scriptable](/assets/pic/scriptable.png)
### How to make a indivudual Data (每个个人不会共享数据)
- uncheck the chararcterData in the inspector
- put scriptable objects in the templateData
- it will instantiate a new object for the individual object
```c#
    public CharacterStats_SO templateData;
    public CharacterStats_SO characterData;
        private void Awake()
    {
        if (templateData != null)
        {
            characterData = Instantiate(templateData);
        }
    }
```

## Lock the Inspector
[InspectorOptions](https://docs.unity3d.com/Manual/InspectorOptions.html)

## GameManager
```c#
    Quiz quiz;
    EndScreen endScreen;

    void Awake()
    {
        quiz = FindObjectOfType<Quiz>();
        endScreen = FindObjectOfType<EndScreen>();
    }

    void Start()
    {
        quiz.gameObject.SetActive(true);
        endScreen.gameObject.SetActive(false);
    }

    void Update()
    {
        if (quiz.isComplete)
        {
            quiz.gameObject.SetActive(false);
            endScreen.gameObject.SetActive(true);
            endScreen.ShowFinalScore();
        }
    }

    public void OnReplayLevel()
    {
        // get the current scene again
        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
    }

```

## Sprite Sheet
Multiple sprite fill in the area
![100922](/assets/pic/100922.png)
Automatic -> no space around

Grid by cell size -> maintain the space around intentionally
![101214](/assets/pic/101214.png)
![103031](/assets/pic/103031.png)

## TileMap
![103854](/assets/pic/103854.jpg)
[Creating a Tile Palette](https://docs.unity3d.com/Manual/Tilemap-Palette.html)
![104520](/assets/pic/104520.png)

### rule tile (assest)
[rule tile](https://docs.unity3d.com/Packages/com.unity.2d.tilemap.extras@1.6/manual/RuleTile.html)
![203056](/assets/pic/203056.png)

## Animation
**Terminology**

- **Animator Component** - Assigns animations to GameObjects through an Animator Controller
- **Animator Controller** - Arrangement of animations and transitions (state machine).
- **Animation** - Specific pieces of motion
- **Sprite Renderer** - displays the 2D sprite on screen

**Set Up Your Character's Idle**

- Import spritesheet and slice
- Add sprite renderer to Player
- Create idle animation clip
- Create Character Animator Controller,
- Add idle animation to Animator Controller
- Add Animator to Player
- Assign Character Animator Controller to Player

idle -> loop check
![idle](/assets/pic/205207.png)

```c#
    void Start()
    {
        MyRgdb = GetComponent<Rigidbody2D>();
        MyAnimator = GetComponent<Animator>();
        MyCapsuleCollider = GetComponent<CapsuleCollider2D>();
    }

        void run()
    {
        // only control the x axis
        // maintain the original rgbd velocity
        Vector2 playerVelocity = new Vector2(moveInput.x * runSpeed, MyRgdb.velocity.y);
        MyRgdb.velocity = playerVelocity;

        // running state check
        bool HasHorizontalSpeed = Mathf.Abs(MyRgdb.velocity.x) > Mathf.Epsilon;
        MyAnimator.SetBool("isRunning", HasHorizontalSpeed);
    }
```
[LayerMask.GetMask](https://docs.unity3d.com/ScriptReference/LayerMask.GetMask.html)

[Collider2D.IsTouchingLayers](https://docs.unity3d.com/ScriptReference/Collider2D.IsTouchingLayers.html)
### transition
![transition](/assets/pic/222318.png)

### Switch in different layers
- create a new layer
- create an empty state
- make a bool parameter to transition to any state

## [input system](https://docs.unity3d.com/Packages/com.unity.inputsystem@1.0/manual/QuickStartGuide.html)
![4412](/assets/pic/4412.jpg)
![235119](/assets/pic/235119.png)
```C#

using UnityEngine.InputSystem;


    void OnMove(InputValue value)
    {
        // value.Get<Vector2>()!!!
        moveInput = value.Get<Vector2>();
        Debug.Log(moveInput);
    }

    void OnJump(InputValue value)
    {
        if (!MyCapsuleCollider.IsTouchingLayers(LayerMask.GetMask("Ground"))) { return; }
        if (value.isPressed)
        {
            MyRgdb.velocity += new Vector2(0f, jumpSpeed);
        }
    }

    void run()
    {
        // only control the x axis
        // maintain the original rgbd velocity
        Vector2 playerVelocity = new Vector2(moveInput.x * runSpeed, rgdb.velocity.y);
        rgdb.velocity = playerVelocity;
    }
```

## Filp
```c#
    void FlipSprite()
    {
        bool HasHorizontalSpeed = Mathf.Abs(rgdb.velocity.x) > Mathf.Epsilon;

        // only there is speed when moving
        if(HasHorizontalSpeed)
        {
            transform.localScale = new Vector2(Mathf.Sign(rgdb.velocity.x), 1f);
            // Sign consider 0 as positive
        }
    }
```

## Physic Material
![](/assets/pic/165329.png)

## [Object.Instantiate](https://docs.unity3d.com/ScriptReference/Object.Instantiate.html)
```c#
    void OnFire(InputValue value)
    {
        if (!isAlive) { return; }
        Instantiate(bullet, gun.position, transform.rotation);
    }
```

## [Coroutine](https://www.youtube.com/watch?v=kUP6OK36nrM)

- Coroutines are another way for us to create a **delay** in our game.
- The core concept to understand is that we start a process (ie. Start Coroutine) and then go off and do other things (ie. Yield) until our condition (eg. we've waited 2 seconds) is met.

```c#
    void OnTriggerEnter2D(Collider2D other) 
    {
        StartCoroutine(LoadNextLevel());
        // things here will be excuted first
    }
    
    IEnumerator LoadNextLevel()
    {
        yield return new WaitForSecondsRealtime(levelLoadDelay);
        int currentSceneIndex = SceneManager.GetActiveScene().buildIndex;
        int nextSceneIndex = currentSceneIndex + 1;

        if (nextSceneIndex == SceneManager.sceneCountInBuildSettings)
        {
            nextSceneIndex = 0;
        }

        SceneManager.LoadScene(nextSceneIndex);
    }
```

### Instantiate with nesting parent
```c#
// the transform of parents
    private void spawnEnemy()
    {
        Instantiate(currentWave.getEnemyPrefeb(0),
                    currentWave.getStartingWaypoint().position,
                    Quaternion.identity,
                    transform);
    }
```

## Game Session

![4820](/assets/pic/4820.jpg)
[Object.FindObjectsOfType](https://docs.unity3d.com/ScriptReference/Object.FindObjectsOfType.html)
```c#
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class GameSession : MonoBehaviour
{
    [SerializeField] int playerLives = 3;
    
    void Awake()
    {
        int numGameSessions = FindObjectsOfType<GameSession>().Length;
        if (numGameSessions > 1)
        {
            Destroy(gameObject);
        }
        else
        {
            DontDestroyOnLoad(gameObject);
        }
    }

    public void ProcessPlayerDeath()
    {
        if (playerLives > 1)
        {
            TakeLife();
        }
        else
        {
            ResetGameSession();
        }
    }

    void TakeLife()
    {
        playerLives--;
        int currentSceneIndex = SceneManager.GetActiveScene().buildIndex;
        SceneManager.LoadScene(currentSceneIndex);
    }

    void ResetGameSession()
    {
        SceneManager.LoadScene(0);
        Destroy(gameObject);
    }
}

```


## Singleton Pattern (Scene Persist)
Put persistant stuff as `Scene Persist`'s children
```c#
   void Awake()
    {
        int numScenePersists = FindObjectsOfType<ScenePersist>().Length;
        if (numScenePersists > 1)
        {
            Destroy(gameObject);
        }
        else
        {
            DontDestroyOnLoad(gameObject);
        }
    }
    public void ResetScenePersist()
    {
        Destroy(gameObject);
    }
```
```c#
    static AudioPlayer instance;

    void Awake()
    {
        ManageSingleton();
    }

    void ManageSingleton()
    {
        if(instance != null)
        {
            gameObject.SetActive(false);
            Destroy(gameObject);
        }
        else
        {
            instance = this;
            // do not destory when switch the scene
            DontDestroyOnLoad(gameObject);
        }
    }

// ------------------------ another example -------------------
        private void Awake()
    {
        if (Instance != null)
        {
            Destroy(gameObject);
        }
        Instance = this;
    }

```
### Generic Singleton
```c#
public class Singleton<T> : MonoBehaviour where T : Singleton<T>
{
    private static T instance;
    public static T Instance
    {
        get { return instance; }
    }

    protected virtual void Awake()
    {
        if (instance != null)
        {
            Destroy(gameObject);
        }
        else
        {
            instance = (T)this;
        }
    }

    public static bool IsInitialized
    {
        get { return instance != null; }
    }

    protected virtual void OnDestory()
    {
        if (instance == this)
        {
            instance = null;
        }
    }
}
```
Override on the Subclass
```c#
    protected override void Awake()
    {
        base.Awake();
        // DontDestroyOnLoad(this);
    }
```

## [Prefab Variants](https://docs.unity3d.com/Manual/PrefabVariants.html)

## [ViewPoint](https://www.udemy.com/course/unitycourse/learn/lecture/28711404#questions)
![4412](/assets/pic/4742.jpg)
```c#
    void initBounds()
    {
        Camera mainCamera = Camera.main;
        minBounds = mainCamera.ViewportToWorldPoint(new Vector2(0, 0));
        maxBounds = mainCamera.ViewportToWorldPoint(new Vector2(1, 1));
    }

    void Move(){
        Vector2 delta = rawInput * moveSpeed * Time.deltaTime;
        Vector2 newPos = new Vector2();
        newPos.x = Mathf.Clamp(transform.position.x + delta.x, minBounds.x + paddingLeft, maxBounds.x - paddingRight);
        newPos.y = Mathf.Clamp(transform.position.y + delta.y, minBounds.y + paddingBottom, maxBounds.y - paddingTop);
        transform.position = newPos;

    }
```

## background Scroller
```c#
    [SerializeField] Vector2 moveSpeed;

    Vector2 offset;
    Material material;

    void Awake()
    {
        material = GetComponent<SpriteRenderer>().material;
    }

    // Update is called once per frame
    void Update()
    {
        offset = moveSpeed * Time.deltaTime;
        material.mainTextureOffset += offset;
    }
```