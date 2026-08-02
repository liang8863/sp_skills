---
name: slot-reel-system
description: 'SlotReel 轉輪系統的架構與 Hooks。當開發轉軸動畫、圖標映射、 消除/掉落、Scatter 瞇牌、轉輪初始化、GameService Hooks 客製化時使用。'
---


# SlotReel 轉輪系統

> 所有回覆必須使用繁體中文。

---

## 架構：View / Logic 分離 + Hooks 組合

```
ExternalModules（共用，50+ 遊戲共享）
├── AbstractSlotReelLogic    — 單軸：狀態機、旋轉動畫、消除/掉落
├── AbstractSlotReelMgrLogic — 多軸：協調、Scatter 瞇牌、Turbo 模式
├── ISlotReelView / ISlotReelSymbolView（View 接口）
└── ISlotReelHooks / ISlotReelMgrHooks（Hooks 接口）

遊戲端（每款遊戲獨立客製化）
├── CustomSlotReelView / CustomSlotReelSymbolView（超薄殼，實現接口）
├── CustomSlotReelMgrView（編輯器可配置參數）
├── createMySlotReelHooks()（一包可選 callback）
└── createMySlotReelMgrHooks()（一包可選 callback）
```

遊戲端透過傳入 **hooks 物件**客製化行為，不需要建立子類。
不傳 hooks 則全部走預設行為。

---

## ISlotReelHooks（單軸）

| Hook | 說明 |
|------|------|
| `getIconAndBgIndex` | 後端數據 → 前端圖標映射 |
| `updateRandIcon` | 滾動中隨機圖標（如金底機率） |
| `onSetAllSymbol` | 初始設置圖標（回傳 true 跳過預設） |
| `onAfterStartSpin` | 開始旋轉後呼叫 |
| `onAfterFinishSpin` | 停輪後呼叫（特殊動畫 + 音效） |
| `onStartClearSequence` | 消除動畫（回傳 true 跳過預設） |
| `onBeforeStartDropSequence` | 掉落前呼叫 |
| `onAfterOverDropCallBack` | 掉落完成後呼叫 |

---

## ISlotReelMgrHooks（多軸管理器）

| Hook | 說明 |
|------|------|
| `checkScatterCount` | Scatter 計數邏輯 |
| `onAfterSpinCallBack` | 單輪完成後呼叫（瞇牌動畫、音效） |
| `onAfterAllSpinOver` | 全部轉完後呼叫（隱藏特效） |
| `onAfterStartClearShow` | 消除表演後呼叫 |
| `onBeforeStartDropShow` | 掉落表演前呼叫 |

---

## 初始化流程

在 Bootstrap 或 Controller 中，**ExternalModules 載入後**調用：

```typescript
private initSlotReelLogic(): void {
  const logger = ServiceBridge.getLogger();
  const { AbstractSlotReelLogic, AbstractSlotReelMgrLogic } = window.ExternalModules;

  // 為每個轉軸建立 Logic
  const reelLogicList = this.slotReelMgrView.getReelViewList().map((reelView) => {
    const hooks = createMySlotReelHooks(reelView as CustomSlotReelView);
    const logic = new AbstractSlotReelLogic(reelView, logger, hooks);
    logic.initialize();
    return logic;
  });
  this.slotReelMgrView.setReelLogicList(reelLogicList);

  // 建立管理器 Logic
  const mgrHooks = createMySlotReelMgrHooks(this.slotReelMgrView);
  this.slotReelMgrLogic = new AbstractSlotReelMgrLogic(
    this.slotReelMgrView, logger, mgrHooks
  );
  this.slotReelMgrLogic.initialize();
}
```

---

## GameService Hooks

GameService 處理通用 spin/auto-spin/cascade/free game 流程。
遊戲透過修改 `GameService.ts` 中的 hooks 客製化特有行為：

```typescript
// 可用 hooks（全部可選，有默認實現）
gameCode: GAME_ID,                          // 遊戲代碼（必填）
isCascade: (result) => ...,                 // 連消判斷
isLastSpinUnfinished: (result) => ...,      // lastSpin 未完成判斷
shouldEmitSpinStartEvents: () => ...,       // 是否發送 SPIN_START
getSpinResultEventName: (result) => ...,    // 自定義結果事件名
onSpinComplete: async (result) => ...,      // spin 完成後處理（如免費遊戲進入）
onCascadeStart: () => ...,                  // 連消開始回調
onCascadeEnd: () => ...,                    // 連消結束回調
```

模板默認不覆寫任何 hook，使用全部預設行為。根據遊戲需求在 GameService.ts 中新增。
