## 特殊的颜色字体结构规范(.ct)

*类型：num数字类型 str字符串类型 arr数组类型 obj对象类型 bol布尔值(true/false) json任意可能的类型 rule规则类型 sle选择器*

### 1. \[.objs]结构规范

- 用“{}”包裹所有数据
- {}里有很多项 每一项要用“,”(英文逗号分开) 例如 {item,item}
- 下面每一分类的标题（就是“1.XX”中的"XX"(XX需要加英文引文)）就是这个项的键 完整的项为 键加 “:” 加值 例如: {key:value,key2:value2}

### 2. \[.ct]结构规范

- 用“\[]”包裹所有数据
- \[]有很多项 每一项要用“,”(英文逗号分开) 例如 \[item,item]
- **项的规范：**
  
  - 项目只可以是\[.objs]或者string格式
  - string格式中目前只可以是"\\n"
  - \[.objs]格式只能是这样的：`{"text":"文本(必填)","color":"颜色(必填 建议只用普通的颜色例如“red”“blue”“yellow”)","colorful":true}` colorful(选填)是bol值 决定该文本是否彩虹

### 指令使用实例：

```
/hpset 3 20
```

```
/hungerset 28 50
```

```
/give @p diamond 64
```

```
/give @a diamond_sword 1 99999 [{"id":0,"level":255}]
```

```
/givec @p 钻石
```

```
/save
```

```
/kill @a
```

```
/rule attack.player off
```

```
/clear @p
```

```
/tp 7694
```

```
/tphere @a
```