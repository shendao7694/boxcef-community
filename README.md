# Boxcef 社区项目

## 快速开始
1. 执行 `npm install`
2. 执行 `npm run build && npm run server` 启动本地服务器
3. 进入/admin页面 -> 危险操作 -> 重置KV

   -> 全局设置 -> 根据自己需求修改即可

## 部署
1. 登录/注册 Cloudflare
2. 执行 `cp wrangler.toml.example wrangler.toml`
3. 修改 wrangler.toml：
```text
[[kv_namespaces]]
binding = "Community-Service"
id = "Your-id" //Cloudflare 控制台 -> kv 控制台 -> 创建 kv(name:Community-Service) -> 复制 kv-id -> 填入 "Your-id"

[[kv_namespaces]]
binding = "Community-Assets"
id = "Your-id" //Cloudflare 控制台 -> kv 控制台 -> 创建 kv(name:Community-Assets) -> 复制 kv-id -> 填入 "Your-id"

[[kv_namespaces]]
binding = "Community-Works"
id = "Your-id" //Cloudflare 控制台 -> kv 控制台 -> 创建 kv(name:Community-Works) -> 复制 kv-id -> 填入 "Your-id"

[[kv_namespaces]]
binding = "Community-Users"
id = "Your-id" //Cloudflare 控制台 -> kv 控制台 -> 创建 kv(name:Community-Users) -> 复制 kv-id -> 填入 "Your-id"

[vars]
ADMIN_TOKEN = "管理员Token"
JWT_SECRET = "32位长度的密钥"
DEFAULT_AVATAR_DATA = "..." // 你可以修改这个 (base64)
DEFAULT_AVATAR_TYPE = "image/bmp" // 对应类型
RESEND_API_KEY = "re_xxxx" //Resend 控制台（没有的话注册一个）-> 创建API Kek - 复制Api key -> 填入 "re_xxxx"
```
4. 进入/admin页面 -> 危险操作 -> 重置KV

   -> 全局设置 -> 根据自己需求修改即可