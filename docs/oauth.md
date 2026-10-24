# Boxcef Community OAuth 授权指南

Boxcef Community 提供 OAuth 授权接口，第三方应用可以获取用户信息。

## 一、请求授权

在第三方应用的登录按钮上挂一个链接：

```
https://<boxcef-domain>/oauth.html?uri=<回调地址>&scope=<权限>&name=<应用名>&icon=<应用图标>
```

| 参数 | 必填 | 说明 |
|------|------|------|
| `uri` | 是 | 授权后跳转的回调地址，需要 URL 编码。不做白名单校验 |
| `scope` | 是 | 权限范围，逗号分隔，如 `user:name,user:email` |
| `name` | 是 | 应用名称，显示在授权页 |
| `icon` | 否 | 应用图标 URL，留空使用站点默认图标 |

用户未登录时，会跳转到登录页，登录成功后自动回到授权页。

## 二、Scope 权限

| Scope | 返回字段 | 说明 |
|-------|----------|------|
| `user:all` | 全部 | 返回全部字段 |
| `user:token` | `token` | 用户的访问令牌 |
| `user:session` | `session` | 会话标识（sessionKey） |
| `user:name` | `name` | 用户昵称 |
| `user:email` | `email` | 邮箱 |
| `user:group` | `group` | 用户组 |
| `user:ip` | `ip` | 客户端 IP |

## 三、授权回调

用户点“授权”后跳转到：

```
<uri>?<params>
```

参数追加到 `uri` 已有的 query 上。**只返回被授权的 scope 对应的字段**，例如 `scope=user:name,user:email` 就只返回 `name` 和 `email`。

用户点“拒绝”后跳转：

```
<uri>?error=canceled&error_description=用户拒绝授权
```

错误码：

| error | 说明 |
|-------|------|
| `canceled` | 用户拒绝授权 |
| `not_logged_in` | 用户未登录 |
| `invalid_uri` | 回调地址格式无效 |
| `missing_uri` | 缺少回调地址 |
| `server_error` | 服务器内部错误 |

## 四、验证用户信息（必做）

**回调参数可以伪造，第三方必须用 `token` 调用 Boxcef 的用户信息接口做验证，不能直接信任回调里的 `name` / `email` / `group`。**

### 接口

```
POST /api/data/oauth/userinfo
```

### 请求头

```
Authorization: Bearer <token>
Content-Type: application/json
```

`token` 来自 OAuth 回调。

### 请求体

```json
{ "scope": ["user:name", "user:email", "user:group"] }
```

`scope` 数组里写你需要的权限，只返回这些字段。特殊值 `user:all` 表示全部。

### 返回

```json
{
  "success": true,
  "user": {
    "name": "冷鱼",
    "email": "user@example.com",
    "group": "user"
  }
}
```

字段对应关系：

| scope | 返回字段 |
|-------|----------|
| `user:all` | 全部 |
| `user:token` | `token` |
| `user:session` | `session` |
| `user:name` | `name` |
| `user:email` | `email` |
| `user:group` | `group` |
| `user:ip` | `ip` |

### 错误

| HTTP | error | 说明 |
|------|-------|------|
| 401 | `未登录` | token 无效或已过期 |
| 500 | `数据损坏` | 服务端数据异常 |

## 五、验证流程

1. 用户在 OAuth 回调里带回 `token`（前提是 scope 里请求了 `user:token`）
2. 第三方服务端用这个 `token` 调 `POST /api/data/oauth/userinfo`
3. 如果返回 200，`user` 就是可信的用户信息
4. 如果返回 401，说明 token 无效或已过期，让用户重新授权

**必须请求 `user:token`**，否则你拿不到 token，无法完成验证。

### scope 建议

- 只做登录：`user:token` 即可，验证时再按需请求 `user:name,user:email`
- 需要展示用户信息：`user:token,user:name,user:email,user:group`

## 六、token 有效期

`token` 会过期，有效时长由站点 `globalSettings.tokenValidTime` 决定（默认 720 分钟）。过期后 `POST /api/data/oauth/userinfo` 返回 401，需要让用户重新走一次 OAuth。

## 七、注意事项

1. **回调参数不可信**：回调 URL 里的 `name` / `email` 等字段可能被中间人篡改，必须用 `token` 调 `POST /api/data/oauth/userinfo` 二次验证
2. **`token` 是敏感凭证**：等同用户登录态，不要写进前端日志、不要暴露给浏览器之外的第三方
3. **`session` 敏感**：`user:session` 会返回用户的 sessionKey，非必要不请求
4. **`uri` 不做白名单**：任何地址都会被跳转，第三方要自己判断回调来源
5. **没有 PKCE / state**：当前实现只做简单跳转，如需防 CSRF 请自行在回调里加 `state`