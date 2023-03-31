---
title: basic Unity method
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

