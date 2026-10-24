## 模组编写与使用

欢迎来到Minecraft JS Edition 模组开发专区！通过编写模组，您可以扩展游戏功能、添加新物品、新方块、新维度等。本指南将帮助您快速上手模组开发。

**什么是模组？**  
模组（Modification）是对游戏功能的扩展和修改。Minecraft JS Edition 支持使用 JavaScript 编写模组，通过接口与游戏核心交互。

**资源下载:**  
[点我下载](../asset/MCUP.zip)  
解压后将资源放入神岛之内，如果觉得麻烦可以寻找7694为你复制地图使用。

**快速开始**  
创建一个新的 .js 文件，按照入口规范编写代码，放入\[神岛服务端]即可加载。  
然后前往index.js修改配置例如:

```
let config = {
    boot:{
        dimension:"overworld"/*以什么维度启动世界*/
    },
    debug:false,/*是否是debug模式*/
    mod:{
        list:[
            {
                name:"yourmod",/*模组名称 随便起*/
                id:"my_mod",/*模组id 只能是英文+数字+下划线*/
                ram:require('./yourmod.js'),/*加载的模组路径*/
            }
        ]
    }
};
```

### 模组入口规范

**每个模组必须拥有两个出口函数：Run 和 End**

```
module.exports = {
    Run,
    End
};
```

**Run函数**：模组加载时调用，用于初始化。  
**End函数**：模组卸载时调用，用于清理资源。

## System 系统接口

| 接口                     | 说明          |
|------------------------|-------------|
| `systemType.(自己的模组id)` | 获取自己的模组类型名称 |

**使用示例：**

```
const myType = systemType.my_mod;
```

获取后可用于类型判断和接口调用。