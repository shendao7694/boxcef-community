## 指令

### 指令例子：

假钻石

```
/give @p iron_ingot 1 null [{"id":0,"level":5},{"id":1,"level":5},{"id":2,"level":5},{"id":3,"level":5},{"id":4,"level":5},{"id":5,"level":5},{"id":6,"level":5},{"id":7,"level":5},{"id":8,"level":5},{"id":9,"level":1},{"id":10,"level":1}] {"item_name":{"text":"钻石","color":"yellow"},"lore":[{"text":"假的钻石不要相信哦~","color":"lightRed"},{"text":"其实是真的","color":"green"},{"text":"骗你的不是的","color":"red"}],"model":"钻石"}
```

耀眼·元式(原本是无尽剑)

```
/give @p infinity_sword 1 999999999 [{"id":8,"level":32767}] {"item_name":[{"text":"寰宇支配之剑[元式·耀阳]","color":"darkRed"}],"lore":[{"text":"无尽终焉，支配寰宇。","color":"lightRed"},"\n",{"text":"+∞攻击伤害","color":"yellow"},"\n",{"text":"+∞实体攻击距离","color":"green"}],"model":"Barrier"}
```

7694之剑

```
/give @p star_swrod 1 999999999 [{"id":8,"level":1e+999}] {"item_name":[{"text":"7694之剑","color":"yellow","colorful":true}],"lore":[{"text":"承载着7694的力量","color":"lightRed","colorful":true},"\n",{"text":"+未知 攻击伤害","color":"yellow","colorful":true},"\n",{"text":"+∞ 实体交互距离","color":"green","colorful":true},"\n",{"text":"+∞ 挖掘效率","color":"green","colorful":true},"\n",{"text":"+∞ 挖掘等级","color":"green","colorful":true},"\n",{"text":"Shift+右键杀死全图实体(不杀自己)=/kill @e","color":"lightRed","colorful":true}]}
```

震金碎片

```
/give @p stick 64 7694 [] {"model":"震金碎片","item_name":[{"text":"震金碎片","color":"yellow"}],"glint":true,"lore":[{"text":"世界上最硬的东西的碎片","color":"red","colorful":true}]}
```

自定义外形

```
/give @p stick 64 7694 [] {"model":"钻石"}
```

```
/give @p stick 64 7694 [] {"model":"https://image.dao3.fun"}
```

### Minecraft Command Help

*类型：num数字类型 str字符串类型 arr数组类型 obj对象类型 bol布尔值(true/false) json任意可能的类型 rule规则类型 sle选择器*

#### 1. 实体选择器

- `@p` -- 自己
- `@a` -- 全体玩家
- `XXX(玩家名称)` -- 指定玩家

#### 2. Commands (&lt;&gt;为必填项 \[]为选填项 admin为仅管理员使用 all所有人使用)

| 指令                                                                                | 说明          | 权限    |
|-----------------------------------------------------------------------------------|-------------|-------|
| `/hpset <血量[num]> <最大血量[num]>`                                                    | 调整血量        | admin |
| `/hungerset <饥饿值[num]> <最大饥饿值[num]>`                                              | 调整饥饿值       | admin |
| `/give <实体选择器[sle]> <物品名称(英文id版)[str]> <数量[num]> [耐久[num]] [附魔[arr]] [其他数据[obj]]` | 给予指令(英文id版) | admin |
| `/givec <实体选择器[sle]> <物品名称(中文版)> <数量[num]> [耐久[num]] [附魔[arr]] [其他数据[obj]]`       | 给予指令(中文版)   | admin |
| `/save`                                                                           | 保存自己的存档     | all   |
| `/kill <实体选择器[sle]>`                                                              | 杀死实体        | admin |
| `/rule <规制rule> <新值json>`                                                         | 更改规则(详见3)   | admin |
| `/clear <实体选择器[sle]>`                                                             | 清楚背包        | admin |
| `/tp <实体选择器[sle]>`                                                                | 传送到玩家       | admin |
| `/tphere <实体选择器[sle]>`                                                            | 将玩家传送到自己    | admin |
| `/checkBag <实体选择器[sle]>`                                                          | 检查某人背包      | admin |

#### 3. 游戏规则(rule)

- `attack` -- 攻击规则(attack的值因为on或off)
  
  - `attack.player` -- 玩家的攻击规则
  - `attack.biology` -- 生物的攻击规则

#### 4. give附魔规范

**注册表：**

```
enchantmentRegistry = {
    0: { chinese: "耐久", english: "unbreaking" },
    1: { chinese: "锋利", english: "sharpness" },
    2: { chinese: "保护", english: "protection" },
    3: { chinese: "效率", english: "xiaolv" },
    4: { chinese: "轻捷", english: "qinjie" },
    5: { chinese: "等级提升", english: "levelUp" },
    6: { chinese: "抗击退", english: "knockbackRes" },
    7: { chinese: "击退", english: "knockback" },
    8: { chinese: "手长", english: "handlong" },
    9: { chinese: "精准采集", english: "jinzhuncaiji", isOne: true },
    10: { chinese: "绑定诅咒", english: "zuzhou", isDeEnchant: true, isOne: true },
};
```

**示例：** `{"id":0,"level":255}` -- 锋利255

**数组格式：** `[{"id":0,"level":255},{"id":1,"level":33},{"id":8,"level":45}]`