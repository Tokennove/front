# Alpha 投资组合 - Web3 风格看板

一个专为加密货币投资组合设计的可视化看板，采用现代 Web3 UI 风格，提供实时收益追踪和数据分析功能。

## ✨ 特性

### 🎨 Web3 视觉风格（白色主题）
- **明亮简洁**：纯白色背景配合浅色渐变光效，确保最佳可读性
- **霓虹渐变色系**：使用青色（#00b8ff）、绿色（#00e676）、紫色（#9c27ff）等鲜艳的 Web3 配色
- **彩色边框**：卡片和组件采用彩虹渐变边框（绿→青→紫）
- **动态交互**：悬停光晕效果、渐变背景动画、平滑过渡
- **智能图表**：收益曲线根据涨跌自动变色（绿色上涨/红色下跌）

### 📊 核心功能
- **投资组合总览**：实时显示本金总额、今日收益、总体收益
- **多平台支持**：支持 Binance、Coinbase、Kraken、OKX 等主流交易平台
- **数据可视化**：
  - 收益曲线迷你图表（带渐变填充和光晕效果）
  - 实时价格监控
  - APY 标签展示
  - 正负收益颜色区分
- **智能搜索**：按平台或币种快速筛选
- **排序功能**：点击列标题按任意字段升序/降序排列
- **分页浏览**：每页显示 10 条记录，支持翻页

### 🛠 技术栈
- **前端**：原生 HTML5 + CSS3 + JavaScript (ES6+)
- **后端**：Node.js + Express
- **样式**：自定义 CSS（无依赖框架）
- **图表**：SVG 原生渲染

## 🚀 快速开始

### 环境要求
- Node.js >= 14.x
- npm >= 6.x

### 安装步骤

1. **克隆或下载项目**
```bash
cd earn-view
```

2. **安装依赖**
```bash
npm install
```

3. **启动服务**
```bash
node server.js
```

4. **访问应用**
```
打开浏览器访问：http://localhost:3000
```

## 📁 项目结构

```
earn-view/
├── server.js           # Express 后端服务器
├── index.html          # 主页面 HTML
├── package.json        # 项目依赖配置
├── README.md          # 项目说明文档
└── assets/
    ├── script.js      # 前端 JavaScript 逻辑
    └── styles.css     # Web3 风格样式表
```

## 🎯 数据结构

### API 接口
**GET** `/api/portfolio`

返回格式：
```json
{
  "principalTotal": 271610,
  "todayTotal": 371.45,
  "overallTotal": 13982.00,
  "originalData": [
    {
      "id": 1,
      "platform": "Binance",
      "coin": "ETH",
      "price": 3245.67,
      "principal": 50000,
      "today": 125.50,
      "total": 3766.50,
      "apy": "7.53%",
      "duration": "30天",
      "strategy": "稳健复利策略",
      "yieldCurve": [50000, 50030, 50065, 50090, 50120, 50155, 50180]
    }
    // ... 更多记录
  ]
}
```

### 数据字段说明
- `platform`: 交易平台名称
- `coin`: 本金币种（如 BTC、ETH）
- `price`: 当前币种价格（美元）
- `principal`: 本金金额（美元）
- `today`: 今日收益（美元）
- `total`: 总体收益（美元）
- `apy`: 年化收益率（百分比）
- `duration`: 策略运行时长
- `strategy`: 投资策略名称
- `yieldCurve`: 收益曲线数据点数组

## 🎨 样式定制

### 颜色变量
在 `assets/styles.css` 中可修改以下 CSS 变量来定制配色：

```css
:root {
    --bg: #ffffff;            /* 背景色（纯白） */
    --accent: #00e676;        /* 主强调色（亮绿） */
    --accent-2: #00b8ff;      /* 次强调色（亮青） */
    --purple: #9c27ff;        /* 紫色点缀 */
    --text: #1e293b;          /* 文字颜色（深灰） */
    --border: rgba(100, 150, 255, 0.2);  /* 边框颜色 */
}
```

### 动画效果
- `pulse-glow`: 脉冲光晕效果
- `gradient-shift`: 渐变色移动效果

可通过修改 CSS 底部的 `@keyframes` 来调整动画速度和效果。

## 📱 响应式设计

- **桌面端**（> 900px）：完整功能 + 所有动画效果
- **移动端**（≤ 900px）：
  - 表格转换为卡片式布局
  - 禁用部分动画以提升性能
  - 优化触摸交互

## 🔧 开发指南

### 添加新数据
修改 `server.js` 中的 `originalData` 数组：

```javascript
const originalData = [
    {
        id: 11,
        platform: "新平台",
        coin: "新币种",
        price: 100.00,
        principal: 10000,
        today: 50.00,
        total: 500.00,
        apy: "5.0%",
        duration: "30天",
        strategy: "新策略",
        yieldCurve: [10000, 10050, 10100, 10150, 10200, 10250, 10300]
    },
    // ... 其他数据
];
```

### 修改每页显示条数
在 `assets/script.js` 中修改 `PAGE_SIZE` 常量：

```javascript
const PAGE_SIZE = 10;  // 改为你想要的数量
```

### 自定义搜索字段
在 `assets/script.js` 的搜索事件监听器中添加更多字段：

```javascript
currentFiltered = originalData.filter(r => {
    const p = (r.platform || '').toString().toLowerCase();
    const c = (r.coin || '').toString().toLowerCase();
    const s = (r.strategy || '').toString().toLowerCase(); // 新增策略搜索
    return p.includes(term) || c.includes(term) || s.includes(term);
});
```

## 🌟 最佳实践

1. **性能优化**：
   - 收益曲线数据点建议控制在 7-15 个
   - 移动端自动禁用动画以节省性能
   - 使用防抖（debounce）优化搜索输入

2. **数据安全**：
   - 生产环境建议连接真实数据库
   - 添加用户认证和授权
   - 启用 HTTPS

3. **可扩展性**：
   - 模块化的代码结构便于添加新功能
   - CSS 变量系统支持快速主题切换
   - RESTful API 设计便于集成

## 📄 License

MIT License - 可自由使用和修改

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**打造极致的 Web3 投资组合体验** 🚀✨

