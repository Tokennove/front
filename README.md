# 质押投资组合（示例项目）

这是一个最小示例项目，包含一个简单的后端（Node/Express）与静态前端页面。后端通过接口返回三项汇总（本金总金、今日总收益、总体收益）以及 `originalData` 原始数据，前端负责拉取数据并渲染表格、支持排序、分页和搜索。

## 项目结构（重要文件）

- `server.js` - 后端服务（Express），暴露 `GET /api/portfolio` 接口并托管静态文件
- `index.html` - 前端页面入口（项目根）
- `assets/script.js` - 前端脚本：请求后端、渲染表格、排序、分页、搜索等逻辑
- `assets/styles.css` - 页面样式（可调整）


## 环境要求

- Node.js（建议 >= 14）
- npm（随 Node 一起）

## 快速开始

1. 安装依赖（如果尚未安装）

```powershell
npm install express cors
```

2. 启动后端服务

```powershell
node server.js
```

> 推荐（开发时）使用 `nodemon` 自动重启：
>
```powershell
npm install -g nodemon
nodemon server.js
```

3. 在浏览器打开页面

浏览器地址栏访问：

```
http://localhost:3000/
```

注意：请务必通过 HTTP(S) 访问页面（例如上面的地址），不要直接用 `file://` 打开 `index.html`，否则脚本的 fetch 可能因跨域或路径问题无法正确请求后端。


## API 说明

- GET /api/portfolio
  - 返回 JSON，格式示例：

```json
{
  "principalTotal": 271610,
  "todayTotal": 421.85,
  "overallTotal": 13887,
  "originalData": [ /* 数组，包含每条持仓记录 */ ]
}
```

- 向后端添加或修改示例数据：编辑 `server.js` 中的 `originalData` 数组并重启服务。


## 前端（关键点）

- 脚本文件 `assets/script.js` 会在 DOMContentLoaded 时：
  - 绑定排序、分页与搜索交互
  - 发起请求到 `/api/portfolio`（会按顺序尝试相对路径、当前 origin 以及 `http://localhost:3000`）
  - 渲染顶部三项汇总（HTML 中的 id 分别为 `principalTotal`, `todayTotal`, `overallTotal`）
  - 渲染表格（tbody id 为 `tbody`）并支持搜索（输入框 id 为 `search`）

- 如果搜索无效，请在浏览器 DevTools 中查看 Console 是否显示 `search input:` 日志，或 Network 面板中确认 `/api/portfolio` 请求是否成功返回 200。


## 常见问题（Troubleshooting）

- 页面没有数据：
  1. 确认后端服务正在运行（`node server.js` 或 `nodemon server.js`）。
  2. 必须通过 `http://localhost:3000/` 打开页面，而非 `file://`。
  3. 在浏览器 DevTools -> Network 检查 `/api/portfolio` 返回状态与响应体。
  4. 在 Console 查看脚本日志：会打印“尝试从后端获取数据”和“成功从后端获取数据”等信息。

- 修改 `server.js` 数据后没生效：你需要重启 node 进程（或使用 `nodemon` 自动重启）。例如：

```powershell
# 手动结束 node 进程（Windows）
taskkill /F /IM node.exe
# 再次启动
node server.js
```

- 脚本未加载或样式不生效：在 Network 面板中确认 `assets/script.js` 与 `assets/styles.css` 返回 200。

- 缓存问题：强制刷新页面（Windows）：`Ctrl+F5`。


## 可能的下一步改进（建议）

- 把示例数据从 `server.js` 拆分到 `data.json` 并在服务器启动时读取，便于维护。
- 增加 POST/PUT 接口以动态管理持仓数据，并持久化到文件或数据库。
- 添加单元测试（例如使用 Jest）覆盖后端逻辑。
- 增强前端 UI（高亮、图表、导出 CSV 等）。


## 联系与授权

此示例项目供学习与演示使用，你可以自由修改和扩展。
