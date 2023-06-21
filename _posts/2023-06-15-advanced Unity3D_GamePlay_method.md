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