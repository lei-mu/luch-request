# luch-request v4 文档站

这是 v4 的独立 VitePress 文档应用，生产构建的 URL 基准固定为
`/luch-request/v4/`。

## 本地开发

在加载真实 fnm 环境后执行：

```powershell
. 'E:\user_document\PowerShell\Microsoft.PowerShell_profile.ps1'

pnpm install
pnpm dev
```

开发服务器固定运行在 `http://localhost:8911/luch-request/v4/`。如果端口已被
占用，命令会直接失败，不会自动切换到其他端口。

## 验证与构建

```powershell
. 'E:\user_document\PowerShell\Microsoft.PowerShell_profile.ps1'

pnpm typecheck
pnpm build
```

构建产物位于 `.vitepress/dist/`，部署时应发布到站点的
`/luch-request/v4/` 路径。`/luch-request/` 作为 latest 文档入口，由部署层复用
当前推荐版本的构建产物或重定向到对应版本路径。
