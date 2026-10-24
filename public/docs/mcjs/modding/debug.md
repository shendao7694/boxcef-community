## DebugLogger 调试日志接口

| 接口                                                                | 说明     |
|-------------------------------------------------------------------|--------|
| `debugLogger.log(modName, modSubname, Content)`                   | 输出普通日志 |
| `debugLogger.error(modName, modSubname, ErrorType, ErrorMessage)` | 输出错误信息 |
| `debugLogger.warn(modName, modSubname, WarnType, WarnMessage)`    | 输出警告信息 |

**参数说明：**

- `modName` - 模组名称
- `modSubname` - 子模块/函数名称
- `Content/ErrorType/WarnType` - 日志内容/错误类型/警告类型
- `ErrorMessage/WarnMessage` - 错误详情/警告详情

```
// 使用示例
debugLogger.log(systemType.my_mod, "init", "模组初始化完成");
debugLogger.error(systemType.my_mod, "loadData", "FileError", "配置文件不存在");
debugLogger.warn(systemType.my_mod, "check", "LowMemory", "内存不足");
```

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