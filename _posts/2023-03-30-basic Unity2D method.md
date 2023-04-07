---
title: basic Unity2D method
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

## Scriptable Objects
````c#
[CreateAssetMenu(menuName = "Quiz Question", fileName = "New Question")]
public class QuestionSO : ScriptableObject
{
    [TextArea(2, 6)]
    [SerializeField] string question = "Enter new question text here";
}
````
![scriptable](/assets/pic/scriptable.png)

## Lock the Inspector
https://docs.unity3d.com/Manual/InspectorOptions.html

