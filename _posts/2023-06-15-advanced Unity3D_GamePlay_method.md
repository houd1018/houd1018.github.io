---
title: advanced Unity3D_Gameplay_method
date: 2023-06-15 20:00:00 -800
categories: [Unity]
tags: [unity, C#]    # TAG names should always be lowercase
---
# advanced Unity3D_Gameplay_method

## Backpack UI

- Grid Layout Group
- Slot Holder
![](/assets/pic/212451.png)
![](/assets/pic/223834.png)

## DragItem
[EventSystem](https://docs.unity3d.com/2019.1/Documentation/ScriptReference/EventSystems.EventSystem.html)

[RectTransform: record four corners](https://docs.unity3d.com/ScriptReference/RectTransform.html)

[PointerEventData](https://docs.unity3d.com/2018.3/Documentation/ScriptReference/EventSystems.PointerEventData.html)
```c#
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;

public class DragItem : MonoBehaviour, IBeginDragHandler, IDragHandler, IEndDragHandler
{
    ItemUI currentItemUI;
    SlotHolder currentHolder;
    SlotHolder targetHolder;

    private void Awake()
    {
        currentItemUI = GetComponent<ItemUI>();
        currentHolder = GetComponentInParent<SlotHolder>();
    }
    public void OnBeginDrag(PointerEventData eventData)
    {
        // the first item data -> temp data
        InventoryManager.Instance.currentDrag = new InventoryManager.DragData();
        InventoryManager.Instance.currentDrag.originalHolder = GetComponentInParent<SlotHolder>();
        InventoryManager.Instance.currentDrag.originalParent = (RectTransform)transform.parent;


        // To avoid being overlaid by the other canvas, set the itemslot to the DragCanvas
        transform.SetParent(InventoryManager.Instance.dragCanvas.transform, true);
    }

    public void OnDrag(PointerEventData eventData)
    {
        // follow with the mouse
        transform.position = eventData.position;
    }

    public void OnEndDrag(PointerEventData eventData)
    {
        // put down the item -> exchange data

        // whether pointing at the UI item
        if (EventSystem.current.IsPointerOverGameObject())
        {
            // whether it is an slotholder
            if (InventoryManager.Instance.CheckInActionUI(eventData.position) || InventoryManager.Instance.CheckInEquipmentUI(eventData.position)
            || InventoryManager.Instance.CheckInInventoryUI(eventData.position))
            {
                // if it doesn't have a slot holder, then it is the original slot. It shouldn't move to the other slot.
                if (eventData.pointerEnter.gameObject.GetComponent<SlotHolder>())
                {
                    targetHolder = eventData.pointerEnter.gameObject.GetComponent<SlotHolder>();
                }
                else
                {
                    // In case that it doesn't get the image component
                    targetHolder = eventData.pointerEnter.gameObject.GetComponentInParent<SlotHolder>();
                }

                switch (targetHolder.slotType)
                {
                    case SlotType.BAG:
                        SwapItem();
                        break;
                    case SlotType.ACTION:
                        break;
                    case SlotType.WEAPON:
                        break;
                    case SlotType.ARMOR:
                        break;
                }

                // update SO database -> UI
                targetHolder.UpdateItem();
                currentHolder.UpdateItem();
            }
        }

        // return to the original canvas
        transform.SetParent(InventoryManager.Instance.currentDrag.originalParent);

        // return to the original position
        RectTransform t = transform as RectTransform;
        t.offsetMax = -Vector2.one * 5;
        t.offsetMin = Vector2.one * 5;


    }

    public void SwapItem()
    {
        var targetItem = targetHolder.itemUI.Bag.items[targetHolder.itemUI.Index];
        var tempItem = currentHolder.itemUI.Bag.items[currentHolder.itemUI.Index];

        bool isSameItem = tempItem.itemData == targetItem.itemData;

        if (isSameItem && targetItem.itemData.stackable)
        {
            targetItem.amount += tempItem.amount;
            tempItem.itemData = null;
            tempItem.amount = 0;
        }
        else
        {
            currentHolder.itemUI.Bag.items[currentHolder.itemUI.Index] = targetItem;
            targetHolder.itemUI.Bag.items[targetHolder.itemUI.Index] = tempItem;

        }
    }
}

```

## 实现映射渲染： RawImage / 独立 Camera / render Texture

render Texture

![](/assets/pic/154709.png)

RawImage
![](/assets/pic/154752.png)

独立 Camera
![](/assets/pic/154824.png)

## ToolTip
### Content Size Fitter: auto-resize UI
![](/assets/pic/112151.png)

```c#
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class ItemToolTip : MonoBehaviour
{
    public TextMeshProUGUI itemNameText;
    public TextMeshProUGUI itemInfoText;
    public RectTransform rectTransform;


    private void Awake()
    {
        rectTransform = GetComponent<RectTransform>();
    }
    public void SetupTooltip(ItemData_SO item)
    {
        itemNameText.text = item.itemName;
        itemInfoText.text = item.description;
    }

    private void OnEnable()
    {
        UpdatePosition();
    }
    private void Update()
    {
        UpdatePosition();
    }

    public void UpdatePosition()
    {
        Vector3 mousePos = Input.mousePosition;
        Vector3[] cornors = new Vector3[4];
        rectTransform.GetWorldCorners(cornors);

        float width = cornors[3].x - cornors[0].x;
        float height = cornors[1].y - cornors[0].y;

        if (mousePos.y < height)
        {
            rectTransform.position = mousePos + Vector3.up * height * 0.6f;
        }
        else if (Screen.width - mousePos.x > width)
        {
            rectTransform.position = mousePos + Vector3.right * width * 0.6f;
        }
        else
        {
            rectTransform.position = mousePos + Vector3.left * width * 0.6f;
        }
    }
}

```
### [RectTransform.GetWorldCorners](https://docs.unity.cn/cn/current/ScriptReference/RectTransform.GetWorldCorners.html)
![](/assets/pic/112012.png)

## Dialogue
![](/assets/pic/211315.png)
![](/assets/pic/211333.png)
### OnValidate(): for Dic in the SO Scripts

```c#
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

[CreateAssetMenu(fileName = "New Dialogue", menuName = "Dialogue/Dialogue Data")]
public class DialogueData_SO : ScriptableObject
{
    public List<DialoguePiece> dialoguePieces = new List<DialoguePiece>();
    public Dictionary<string, DialoguePiece> dialogueIndex = new Dictionary<string, DialoguePiece>();

// synchornize the id and index
#if UNITY_EDITOR
// only run when making changes in the SO file from the Inspector Panel
    void OnValidate()//仅在编辑器内执行导致打包游戏后字典空了
    {
        dialogueIndex.Clear();
        foreach (var piece in dialoguePieces)
        {
            if (!dialogueIndex.ContainsKey(piece.ID))
                dialogueIndex.Add(piece.ID, piece);
        }
    }
#else
    void Awake()//保证在打包执行的游戏里第一时间获得对话的所有字典匹配 
    {
        dialogueIndex.Clear();
        foreach (var piece in dialoguePieces)
        {
            if (!dialogueIndex.ContainsKey(piece.ID))
                dialogueIndex.Add(piece.ID, piece);
        }
    }
#endif
}
```

## Task
### Find tasks in the list
[Linq usage](https://houd1018.github.io/posts/C-_intro/#linq-%E6%9F%A5%E8%AF%A2%E6%93%8D%E4%BD%9C)
```c#
    public List<QuestTask> tasks = new List<QuestTask>();

    public bool HaveQuest(QuestData_SO data)
    {
        if (data != null)
        {
            return tasks.Any(q => q.questData.questName == data.questName);
        }
        else
        {
            return false;
        }
    }

    public QuestTask GetTask(QuestData_SO data)
    {
        return tasks.Find(q => q.questData.questName == data.questName);
    }
```
```c#
    public void CheckQuestProgress()
    {
        var finishRequires = questRequires.Where(r => r.requireAmount <= r.currentAmount);
        isComplete = questRequires.Count == finishRequires.Count();

        if (isComplete)
        {
            Debug.Log("Complete!");
        }
    }
```

## Editor Script
### New Inspector
```c#
// define which file should be chousen
[CustomEditor(typeof(DialogueData_SO))]
public class DialogueCustomEditor : Editor
{
    public override void OnInspectorGUI()
    {
        if (GUILayout.Button("Open in Editor"))
        {
            DialogueEditor.InitWindow((DialogueData_SO)target);
        }
        base.OnInspectorGUI();
    }
}
```
### ReorderableList: render enumerable object
![](/assets/pic/014543.png)
```c#
piecesList = new ReorderableList(currentData.dialoguePieces, typeof(DialoguePiece), true, true, true, true);
piecesList.drawHeaderCallback += OnDrawPieceHeader;
piecesList.drawElementCallback += OnDrawPieceListElement;
piecesList.elementHeightCallback += OnHightChanged;
```
### OnSelectionChange()
```c#
    // when change to another file without quit
    private void OnSelectionChange()
    {
        var newData = Selection.activeObject as DialogueData_SO;
        if (newData != null)
        {
            currentData = newData;
            SetupReorderableList();
        }
        else
        {
            currentData = null;
            piecesList = null;
        }
        Repaint();
    }
```
### Create & Save New File
```c#
            if (GUILayout.Button("Create New Dialogue"))
            {
                string dataPath = "Assets/Game Data/Dialogue/";
                if (!Directory.Exists(dataPath))
                {
                    Directory.CreateDirectory(dataPath);
                }
                DialogueData_SO newData = ScriptableObject.CreateInstance<DialogueData_SO>();
                AssetDatabase.CreateAsset(newData, dataPath + "/" + "New Dialogue.asset");
                currentData = newData;
            }
```
### Scroller
```c#
        if (currentData != null)
        {
            EditorGUILayout.LabelField(currentData.name, EditorStyles.boldLabel);
            GUILayout.Space(10);

            // scoller
            scrollPos = GUILayout.BeginScrollView(scrollPos, GUILayout.ExpandWidth(true), GUILayout.ExpandHeight(true));
            if (piecesList == null)
            {
                SetupReorderableList();
            }

            // draw the list
            piecesList.DoLayoutList();
            GUILayout.EndScrollView();
        }
```
### Dirty Object: auto-save, Undo ... in the inspector
```c#
        // SetDirty -> make data in the new panel be auto-save, Undo...
        EditorUtility.SetDirty(currentData);
```
### Expand
```c#
            // pointer -> sync with currentPiece.canExpand
            currentPiece.canExpand = EditorGUI.Foldout(tempRect, currentPiece.canExpand, currentPiece.ID);
```