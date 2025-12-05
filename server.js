// javascript
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 请求日志中间件（用于调试）
app.use((req, res, next) => {
    console.log(new Date().toISOString(), req.method, req.url);
    next();
});

const PORT = process.env.PORT || 3000;

// 如果你注释掉了内嵌的测试数据，确保服务器仍然有一个安全的默认值
// let originalData = []; // 默认空数组，可在以后从文件或数据库加载真实数据

const originalData = [
    {
        id: 1,
        platform: 'Binance',
        coin: 'ETH',
        price: 3245.67,
        principal: 50000,
        today: 125.50,
        total: 3766.50,
        apy: '7.53%',
        duration: '30天'
    },
    {
        id: 2,
        platform: 'Coinbase',
        coin: 'BTC',
        price: 68432.12,
        principal: 100000,
        today: 245.80,
        total: 7374.00,
        apy: '7.37%',
        duration: '60天'
    },
    {
        id: 3,
        platform: 'Kraken',
        coin: 'SOL',
        price: 142.83,
        principal: 20000,
        today: -52.40,
        total: 1572.00,
        apy: '7.86%',
        duration: '90天'
    },
    {
        id: 4,
        platform: 'Binance',
        coin: 'USDT',
        price: 1.00,
        principal: 30000,
        today: 45.00,
        total: -1350.00,
        apy: '4.5%',
        duration: '15天'
    },
    {
        id: 5,
        platform: 'OKX',
        coin: 'MATIC',
        price: 0.85,
        principal: 15000,
        today: 28.50,
        total: 855.00,
        apy: '5.7%',
        duration: '45天'
    },
    {
        id: 6,
        platform: 'Huobi',
        coin: 'DOT',
        price: 7.42,
        principal: 25000,
        today: -68.75,
        total: 2062.50,
        apy: '8.25%',
        duration: '30天'
    },
    {
        id: 7,
        platform: 'Coinbase',
        coin: 'AVAX',
        price: 38.56,
        principal: 18000,
        today: 41.40,
        total: -1242.00,
        apy: '6.9%',
        duration: '60天'
    },
    {
        id: 8,
        platform: 'Kraken',
        coin: 'ADA',
        price: 0.62,
        principal: 12000,
        today: 26.40,
        total: 792.00,
        apy: '6.6%',
        duration: '90天'
    },
    {
        id: 9,
        platform: 'AVAE',
        coin: 'XRP',
        price: 620,
        principal: 1600,
        today: 2.40,
        total: 12.00,
        apy: '5.6%',
        duration: '90天'
    },
    {
        id: 10,
        platform: 'LIDO',
        coin: 'BCH',
        price: 22.62,
        principal: 10,
        today: 28,
        total: 45.00,
        apy: '9.6%',
        duration: '90天'
    }
];

function calcTotals(data) {
    const principalTotal = data.reduce((s, r) => s + (Number(r.principal) || 0), 0);
    const todayTotal = data.reduce((s, r) => s + (Number(r.today) || 0), 0);
    const overallTotal = data.reduce((s, r) => s + (Number(r.total) || 0), 0);
    return {principalTotal, todayTotal, overallTotal};
}

app.get('/api/portfolio', (req, res) => {
    const totals = calcTotals(originalData);
    res.json({
        principalTotal: totals.principalTotal,
        todayTotal: totals.todayTotal,
        overallTotal: totals.overallTotal,
        originalData
    });
});

// 可选：把前端文件放到项目根目录，以便通过 http://localhost:PORT/ 直接访问 index.html
// 明确托管 assets 目录
app.use('/assets', express.static(path.join(__dirname, 'assets')));
// 返回根页面 index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
