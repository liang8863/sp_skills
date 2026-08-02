---
name: naming-conventions
description: 'Slot 遊戲平台的命名規則。當建立新檔案、新類別、新介面、新變量、新事件、 code review、或任何涉及命名決策時使用。涵蓋文件、目錄、類、接口、方法、 變量、常量、事件、Service 識別符、Cocos 節點、資源路徑的命名規範。'
---


# 命名規則

> 所有回覆必須使用繁體中文。

## 快速參考表

| 類型 | 規則 | 例子 |
|------|------|------|
| 文件 | PascalCase | Logger.ts, ILogger.ts |
| 目錄 | camelCase | core/, uiCocos/, gameLogic/ |
| 類 | PascalCase | class Logger |
| 接口 | I+PascalCase | interface ILogger |
| 方法 | camelCase | getLogger() |
| 變量 | camelCase | playerBalance |
| 常量 | UPPER_SNAKE_CASE | MAX_PLAYERS |
| 布林 | is/has+camelCase | isValid, hasError |
| Symbol | UPPER_SNAKE_CASE | LOGGER: Symbol |
| Event | lowercase:name | game:spin |
| Config/JSON | camelCase | externalModulesUrl |
| Cocos 節點 | camelCase | reelContainer |
| 資源 | PascalCase | SymbolA.png |

---

## 文件命名

**規則：** PascalCase（大駝峰）

```
✅ Logger.ts, EventSystem.ts, NetworkService.ts, ServiceBridge.ts
✅ ILogger.ts, IToastManager.ts（介面檔案）
❌ logger.ts, event-system.ts, loggerService.ts
```

**配置檔案例外：** 保持 camelCase

```
✅ cocosConfig.json, tsconfig.json, package.json
```

---

## 目錄命名

**規則：** camelCase，語義清晰

```
✅ core/, uiCocos/, gameLogic/, services/, types/
✅ controllers/, models/, views/, config/
```

---

## 類命名

**規則：** PascalCase

```typescript
✅ class Logger {}
✅ class EventSystem {}
✅ class GameController {}
❌ class logger {}, class event_system {}
```

**Service 類：** [功能名] + Service/Manager

```typescript
✅ class Logger implements ILogger {}
✅ class GameService {}       // 遊戲業務邏輯
✅ class AudioManager {}      // 音頻管理
✅ class SettingsManager {}   // 設定管理
```

---

## 接口命名

**規則：** 以 `I` 開頭 + PascalCase

```typescript
✅ interface ILogger {}
✅ interface IEventSystem {}
✅ interface IToastManager {}
✅ interface IPlayerData {}
❌ interface Logger {}, interface I_Logger {}
```

---

## 方法/函數命名

**規則：** camelCase，動詞開頭

```typescript
// 查詢/獲取
getLogger(), getEventSystem(), fetchGameState(), queryUserInfo()

// 設定/修改
setVolume(volume: number), updateGameState(state), setPlayerBalance(balance)

// 操作
initialize(), start(), stop(), destroy(), reset(), clear(), flush()

// 檢查
isValid(), isBound(), canPlay(), shouldRetry(), hasBalance()

// 事件
on(event, callback), off(event, callback), emit(event, data), once(event, callback)

// 異步
async request(config), async fetchData(url), async loadConfig(path)
```

**Cocos 生命週期方法：**

```typescript
onLoad(), onEnable(), onDisable(), start(), update(dt), lateUpdate(dt), onDestroy()
```

**管理器常用方法：**

```typescript
show(), hide(), play(), stop(), pause(), resume(), reset(), clear()
```

**避免：**

```typescript
❌ get()           // 太模糊
❌ logger()        // 看起來像類
❌ GetLogger()     // PascalCase
❌ get_logger()    // snake_case
```

---

## 變量/屬性命名

**規則：** camelCase

```typescript
✅ private logger: ILogger;
✅ private currentGameState: GameState;
✅ private isLoading: boolean;
❌ private Logger: ILogger;
❌ private logger_service: ILogger;
```

**布林變量：** 加 is/has/can/should 前綴

```typescript
✅ isValid, isLoading, hasError, canPlay, shouldUpdate, isEnabled, isVisible
❌ valid, loading, error, enabled
```

**Getter/Setter：**

```typescript
get playerData(): IPlayerData { return this._playerData; }
set playerData(data: IPlayerData) { this._playerData = data; }
```

---

## 常量命名

**規則：** UPPER_SNAKE_CASE

```typescript
✅ const MAX_PLAYERS = 4;
✅ const DEFAULT_TIMEOUT = 30000;
✅ const SPIN_DURATION = 2000;
✅ const API_BASE_URL = 'https://api.example.com';
❌ const maxPlayers = 4;
```

**配置常量對象（內部 key 用 camelCase）：**

```typescript
const GAME_CONFIG = {
  spinDuration: 2000,
  animationSpeed: 1.5,
  maxBet: 1000,
};

const API_ENDPOINTS = {
  spin: '/api/spin',
  result: '/api/result',
  balance: '/api/balance',
};
```

---

## Service 識別符

**規則：** 集中在 SERVICE_IDENTIFIERS 物件，UPPER_SNAKE_CASE

```typescript
✅ export const SERVICE_IDENTIFIERS = {
  LOGGER: Symbol.for('ILogger'),
  EVENT_SYSTEM: Symbol.for('IEventSystem'),
  TOAST_MANAGER: Symbol.for('IToastManager'),
  AUDIO_MANAGER: Symbol.for('IAudioManager'),
};

// 使用
@inject(SERVICE_IDENTIFIERS.LOGGER) private logger: ILogger

❌ @inject(Symbol.for('ILogger'))  // 分散，易出錯
```

---

## Event 名稱

**規則：** 小寫，冒號分隔模組和事件名

```typescript
✅ 'game:start', 'game:spin', 'game:spinEnd', 'game:result'
✅ 'player:win', 'player:balance:update'
✅ 'ui:buttonClick', 'ui:panelOpen'
✅ 'system:error', 'system:networkError'
❌ 'gameStart', 'GAME_START', 'game_start'
```

**集中定義 Event 常量：**

```typescript
export const GAME_EVENTS = {
  START: 'game:start',
  SPIN: 'game:spin',
  SPIN_END: 'game:spinEnd',
} as const;

export const PLAYER_EVENTS = {
  WIN: 'player:win',
  BALANCE_UPDATE: 'player:balance:update',
} as const;

// 使用
eventSystem.emit(GAME_EVENTS.SPIN);
eventSystem.on(PLAYER_EVENTS.WIN, handleWin);
```

---

## Cocos 組件/節點命名

**組件類：** PascalCase

```typescript
class GameScene extends cc.Scene {}
class GameController extends cc.Component {}
class UIPanel extends cc.Component {}
```

**節點名稱（編輯器中）：** camelCase

```
✅ mainCamera, gameContainer, reelContainer, spinButton, betInput
❌ MainCamera, game_container
```

**節點引用變量：**

```typescript
@property(cc.Node) reelContainer: cc.Node;
@property(cc.Button) spinButton: cc.Button;
@property([cc.Sprite]) symbolSprites: cc.Sprite[];
```

---

## 資源路徑命名

**規則：** PascalCase，按功能分類

```
assets/
├─ scenes/        GameScene1.scene, LobbyScene.scene
├─ prefabs/       SymbolSprite.prefab, ReelContainer.prefab
├─ sprites/       SymbolA.png, ButtonNormal.png
├─ animations/    SymbolSpin.anim, WinAnimation.anim
├─ audio/
│  ├─ bgm/        GameLobbyBgm.mp3
│  └─ sfx/        SpinStart.wav, WinSound.wav
├─ fonts/         DefaultFont.fnt
└─ data/          gameConfig.json, paylines.json
```

---

## 常見錯誤和修正

| ❌ 錯誤 | ✅ 正確 | 原因 |
|---------|---------|------|
| logger.ts | Logger.ts | 文件用 PascalCase |
| external-modules/ | externalModules/ | 目錄用 camelCase |
| GetLogger() | getLogger() | 方法首字小寫 |
| GAME_STATE | gameState 或 GameState | 根據用途選擇 |
| game_event | game:spin | Event 用冒號 |
| showUI() | show() 或 displayUI() | 簡潔明瞭 |
| canSpinFlag | canSpin | 去冗餘後綴 |
| APIUrl | apiBaseUrl | 配置用 camelCase |
| symbol-a.png | SymbolA.png | 資源用 PascalCase |
