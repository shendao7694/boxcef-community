## MinecraftData 数据接口

MinecraftData 是游戏核心数据类，提供物品、方块、药水、附魔、合成配方等所有游戏数据的访问和修改接口。通过 `globalThis.MinecraftData` 全局调用，您可以读取或动态修改这些数据来扩展游戏功能。

**注意：**修改数据时请确保格式正确，错误的修改可能导致游戏崩溃。建议在模组初始化时（Run函数中）进行数据修改。

### 一、itemType - 物品类型映射

```
{
    "material": "材料",   // 材料类型
    "tool": "工具",       // 工具类型
    "weapen": "武器",     // 武器类型
    "block": "方块",      // 方块类型
    "null": "错误"        // 错误类型
}
```

### 二、effectTypes - 状态效果列表

```
[
    {
        id: "speed",              // 效果ID
        name: {
            chinese: "速度",      // 中文名
            english: "Speed"      // 英文名
        },
        maxLevel: 255,            // 最大等级
        minLevel: 2               // 最小等级（药水等级）
    },
    {
        id: "slowness",           // 效果ID
        name: {
            chinese: "缓慢",      // 中文名
            english: "Slowness"   // 英文名
        },
        maxLevel: 255,            // 最大等级
        minLevel: 6               // 最小等级（药水等级）
    }
]
```

### 三、potionTypes - 药水类型列表

```
[
    {
        id: "speed",                    // 药水ID
        effects: [                      // 药水效果数组
            {
                type: "speed",          // 效果类型
                time: 180,              // 持续时间（秒）
                level: 1                // 效果等级
            }
        ],
        create: ["粗制的药水", "糖"],   // 酿造配方（材料）
        canCreate: true,                // 是否可酿造
        name: {
            chinese: "速度药水",        // 中文名
            english: "Speed Potion"     // 英文名
        }
    }
]
```

### 四、smithingData - 锻造配方数据

```
[
    {
        material: ["下界合金升级锻造模板", "钻石剑", "下界合金锭"],  // 材料数组 [模板, 装备, 升级锭]
        newItem: "下界合金剑",      // 产出物品
        isExtends: true,           // 是否继承原物品属性（附魔、耐久等）
        num: 1                     // 产出数量
    }
]
```

### 五、enchantmentRegistry - 附魔注册表

```
{
    0: { 
        chinese: "耐久",           // 附魔中文名
        english: "unbreaking"      // 附魔英文ID
    },
    1: { 
        chinese: "锋利",           // 附魔中文名
        english: "sharpness"       // 附魔英文ID
    },
    9: { 
        chinese: "精准采集",       // 附魔中文名
        english: "jinzhuncaiji",   // 附魔英文ID
        isOne: true                // 是否只有1级
    },
    10: { 
        chinese: "绑定诅咒",       // 附魔中文名
        english: "zuzhou",         // 附魔英文ID
        isDeEnchant: true,         // 是否为诅咒附魔（无法移除）
        isOne: true                // 是否只有1级
    }
}
```

### 六、itemData - 物品数据（最重要）

```
{
    "物品ID": {
        name: "diamond_sword",           // 内部标识符（英文ID）
        usename: {
            chinese: "钻石剑",            // 中文显示名
            english: "Diamond Sword"     // 英文显示名
        },
        type: 2,                         // 类型:0=普通物品 1=方块 2=工具 3=装备 4=食物/药水 5=材料
        maxstack: 1,                     // 最大堆叠数
        durability: 1561,                // 耐久度（可选，工具/装备）
        damage: 8,                       // 攻击伤害（武器）
        restTime: 0.5,                   // 攻击冷却时间（秒）（武器）
        dig_speed: 8,                    // 挖掘速度（工具）
        dig_level: 6,                    // 挖掘等级（工具）
        dig_type: 0,                     // 挖掘类型:0=镐 1=斧 2=锹
        enchantType: "sword",            // 附魔类型:sword/tool/equiment/book
        equipmentType: "sword",          // 装备类型:helmet/chestplate/leggings/boots/sword
        armorValue: 8,                   // 护甲值（装备）
        knockbackResistance: 1,          // 抗击退（装备）
        useType: "eat",                  // 使用类型:eat=食物/potion=药水/fluid_away=流体移除/fluid_put=流体放置
        useTime: 1,                      // 使用时间（秒）
        canAlwaysEat: true,              // 是否可随时食用（饱食度满也能吃）
        effects: [                       // 食物效果数组
            { type: "hunger", value: 4 },     // 恢复饥饿值
            { type: "saturat", value: 2.4 }   // 恢复饱和度
        ],
        block: 56,                       // 对应的方块ID（方块类型物品）
        awayId: [8, 10],                 // 流体移除ID（桶类物品）8=水 10=岩浆
        fluidId: 8,                      // 流体放置ID（桶类物品）
        awayItem: "bucket"               // 使用后返还的物品
    }
}
```

### 七、enchantReg - 附魔规则

```
{
    0: {                                 // 附魔索引（对应enchantmentRegistry的key）
        name: "锋利",                    // 附魔名称
        level: [1, 2, 3, 4, 5],         // 可用等级数组
        exp: [1, 1, 2, 2, 3],           // 所需经验等级（每个等级对应）
        lapis: [1, 1, 2, 2, 3],         // 所需青金石数量（每个等级对应）
        T_level: [1, 1, 2, 2, 3],       // 附魔台等级要求（每个等级对应）
        Type: "sword"                    // 适用类型:sword=剑/tool=工具/equiment=装备
    }
}
```

### 八、Makes - 合成配方

```
{
    "配方ID": {
        material: [                      // 3x3合成网格
            ["铁锭", "铁锭", "无"],      // 第一行，"无"表示空格
            ["橡木木板", "橡木木板", "无"],
            ["橡木木板", "橡木木板", "无"]
        ],
        newItem: "锻造台",               // 产出物品名称（需与itemData中的中文名匹配）
        num: 1                           // 产出数量
    }
}
```

### 九、blockData - 方块数据

```
{
    "方块ID": {
        type: 2,                         // 方块类型:0=空 1=流体 2=实体方块 3=模型方块 4=贴图方块 5=掉落方块
        id: 56,                          // 方块ID（基岩版数据值）
        dec: 56,                         // 方块数据值
        name: "diamond_ore",             // 方块内部名称
        gravity: false,                  // 是否受重力影响
        namespace: "minecraft",          // 命名空间
        tips: [],                        // 方块标签
        hex: "38",                       // 十六进制ID
        box: { x: 1, y: 1, z: 1 },      // 碰撞箱大小
        redstone: { conduction: 0 },     // 红石传导性
        usename: {
            chinese: "钻石矿",
            english: "Diamond ore"
        },
        boxid: 91,                       // BOX3Voxel的voxelId
        space: { x: 1, y: 1, z: 1 },    // 在map中占用的体积
        dig_type: 0,                     // 挖掘类型:0=镐 1=斧 2=锹
        dig_level: 4,                    // 挖掘等级要求
        hardness: { usual: 3 },          // 硬度
        dropped: {                       // 掉落物配置
            mesh: "mesh/VOXEL_diamond_ore.vb",  // 掉落物模型路径
            id: 123                      // 掉落物品ID
        },
        random_count: (eff) => { return randomInt(1, 2, eff); },  // 随机掉落数量函数
        model: "mesh/xxx.vb"             // 模型路径（type=3/4时使用）
    }
}
```

### 十、方法

| 方法                     | 参数          | 返回值       | 说明         |
|------------------------|-------------|-----------|------------|
| `findItemName(name)`   | name: 中文名称  | 物品对象或null | 根据中文名查找物品  |
| `findItemEName(Ename)` | Ename: 英文ID | 物品对象或null | 根据英文ID查找物品 |

### 修改示例

```
// 在模组Run函数中添加新物品
function Run() {
    // 添加新物品
    MinecraftData.itemData[999] = {
        name: "my_sword",
        usename: { chinese: "我的剑", english: "My Sword" },
        type: 2,
        maxstack: 1,
        damage: 100,
        restTime: 0.5,
        enchantType: "sword",
        durability: 9999
    };
    
    // 添加合成配方
    const newRecipeId = Object.keys(MinecraftData.Makes).length;
    MinecraftData.Makes[newRecipeId] = {
        material: [
            ["钻石", "钻石", "钻石"],
            ["无", "木棍", "无"],
            ["无", "木棍", "无"]
        ],
        newItem: "我的剑",
        num: 1
    };
    
    // 添加附魔
    const enchId = Object.keys(MinecraftData.enchantmentRegistry).length;
    MinecraftData.enchantmentRegistry[enchId] = {
        chinese: "我的附魔",
        english: "my_enchant"
    };
    
    debugLogger.log(systemType.my_mod, "init", "物品已添加");
}
```

**提示：**MinecraftData 是全局可修改的，您可以在模组中动态添加新物品、新配方、新附魔来扩展游戏内容。