## 补充说明

**模组开发补充说明**  
模组初步会开放很多接口，目前编写模组可以不访问接口，直接使用 DAO3 的接口完成编写。

**完整示例模组：**

```
// myMod.js
function Run() {
    debugLogger.log(systemType.my_mod, "init", "模组已加载");
}

function End() {
    debugLogger.log(systemType.my_mod, "unload", "模组已卸载");
}

module.exports = { Run, End };
```