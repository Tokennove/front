// javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const {Pool} = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// 请求日志中间件（用于调试）
app.use((req, res, next) => {
    console.log(new Date().toISOString(), req.method, req.url);
    next();
});

const PORT = process.env.PORT || 3000;

const hyperliquidPriceUrl = process.env.HYPERLIQUID_PRICE || 'https://api.hyperliquid.xyz/info';

// PostgreSQL 数据库连接配置
const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'earn-view',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
});

// 1. 获取主表 t_yield_record 的所有记录
async function fetchMainTable() {
    try {
        const query = `
            SELECT id,
                   platform,
                   coin_symbol,
                   principal_usd,
                   duration,
                   strategy,
                   created_at,
                   updated_at
            FROM t_yield_record
            ORDER BY id
        `;
        const result = await pool.query(query);
        console.log(`✅ 查询主表成功，获取 ${result.rows.length} 条记录`);
        return result.rows;
    } catch (err) {
        console.error('❌ 查询主表出错：', err.message);
        return [];
    }
}

// 2. 获取子表 t_daily_earning_record 中今日日期的收益
async function fetchTodayEarnings(yieldId, today) {
    try {
        const query = `
            SELECT daily_earnings
            FROM t_daily_earning_record
            WHERE t_yield_id = $1
              AND DATE (created_at) = $2:: date
            ORDER BY created_at DESC
                LIMIT 1
        `;
        const result = await pool.query(query, [yieldId, today]);
        return result.rows.length > 0 ? Number(result.rows[0].daily_earnings) : 0;
    } catch (err) {
        console.error(`❌ 查询主表ID ${yieldId} 的今日收益出错：`, err.message);
        return 0;
    }
}

// 3. 获取子表 t_daily_earning_record 中该主表ID的所有收益（用于求和和收益曲线）
async function fetchAllEarnings(yieldId) {
    try {
        const query = `
            SELECT daily_earnings
            FROM t_daily_earning_record
            WHERE t_yield_id = $1
            ORDER BY created_at
        `;
        const result = await pool.query(query, [yieldId]);
        return result.rows.map(row => Number(row.daily_earnings) || 0);
    } catch (err) {
        console.error(`❌ 查询主表ID ${yieldId} 的所有收益出错：`, err.message);
        return [];
    }
}

// 4. 汇总数据：合并主表和子表数据
async function fetchPlatformDailyEarnings() {
    try {
        const today = new Date().toISOString().split('T')[0];
        console.log(`📅 查询日期: ${today}\n`);

        // 第一步：查询主表
        const mainTable = await fetchMainTable();

        if (mainTable.length === 0) {
            console.log('⚠️  主表中没有数据');
            return [];
        }

        // 第二步：为每个主表记录查询对应的子表数据
        const mappedData = [];
        for (const row of mainTable) {
            // 查询今日收益
            const todayEarnings = await fetchTodayEarnings(row.id, today);

            // 查询所有收益数据
            const allEarnings = await fetchAllEarnings(row.id);

            // 计算总体收益（所有收益求和）
            const totalEarnings = allEarnings.reduce((sum, val) => sum + val, 0);

            // 计算运行天数：根据子表中的记录条数（每天一条记录）
            const daysElapsed = allEarnings.length > 0 ? allEarnings.length : 1;
            const apy = calculateAPY(Number(row.principal_usd) || 0, totalEarnings, daysElapsed);

            // 组装数据
            const mapped = {
                id: row.id,
                platform: row.platform || '',
                coin: row.coin_symbol || '',
                price: await getHLPrices(row.coin_symbol || 0),
                principal: Number(row.principal_usd) || 0,
                // 今日收益（从子表查询当前日期）
                today: todayEarnings,
                // 总体收益（子表所有收益求和）
                total: totalEarnings,
                // 年化收益率 APY
                apy: apy,
                duration: row.duration || '',
                strategy: row.strategy || '',
                // 收益曲线（所有历史收益数组）
                yieldCurve: allEarnings
            };

            mappedData.push(mapped);
        }

        console.log('\n从数据库映射的数据条数：', mappedData.length);
        if (mappedData.length > 0) {
            console.log('示例记录（第一条）：');
            console.log(JSON.stringify(mappedData[0], null, 2));
        }
        return mappedData;
    } catch (err) {
        console.error('❌ 获取平台每日收益数据出错：', err.message);
        return [];
    }
}

// 从数据库读取 t_yield_record 表数据并进行字段映射
async function fetchDataFromDB() {
    try {
        const mappedData = await fetchPlatformDailyEarnings();
        return mappedData;
    } catch (err) {
        console.error('从数据库读取数据出错：', err);
        return [];
    }
}

// 计算总计数值
function calcTotals(data) {
    const principalTotal = data.reduce((s, r) => s + (Number(r.principal) || 0), 0);
    const todayTotal = data.reduce((s, r) => s + (Number(r.today) || 0), 0);
    const overallTotal = data.reduce((s, r) => s + (Number(r.total) || 0), 0);
    return {principalTotal, todayTotal, overallTotal};
}

// 计算年化收益率 APY (Annual Percentage Yield)
function calculateAPY(principal, totalEarnings, daysElapsed) {
    if (principal <= 0 || daysElapsed <= 0) {
        return '0.00';
    }

    // 公式：APY = (总收益 / 本金) * (365 / 运行天数) * 100
    const apy = (totalEarnings / principal) * (365 / daysElapsed) * 100;

    return apy.toFixed(2);
}

// 从 Hyperliquid 获取加密货币价格
async function getHLPrices(coinSymbol) {
    // 转换为大写
    const coin = coinSymbol.toUpperCase();

    // 稳定币列表（直接返回1）
    const stableCoins = ['USDT', 'USDC', 'DAI', 'USDE'];

    if (stableCoins.includes(coin)) {
        return 1;
    }

    // 非稳定币从 Hyperliquid 获取价格
    try {
        const res = await fetch(hyperliquidPriceUrl, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({type: "allMids"})
        });

        const mids = await res.json();
        const price = mids[coin];

        return price ? Number(price) : null;
    } catch (err) {
        console.error(`❌ 获取 ${coin} 价格出错：`, err.message);
        return null;
    }
}

// 异步 API 端点：读取数据库数据并返回
app.get('/api/portfolio', async (req, res) => {
    try {
        const originalData = await fetchDataFromDB();
        const totals = calcTotals(originalData);

        res.json({
            principalTotal: totals.principalTotal,
            todayTotal: totals.todayTotal,
            overallTotal: totals.overallTotal,
            originalData
        });
    } catch (err) {
        console.error('/api/portfolio 错误：', err);
        res.status(500).json({
            error: 'Failed to fetch portfolio data',
            message: err.message
        });
    }
});

// 明确托管 assets 目录
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// 托管 image 目录
app.use('/image', express.static(path.join(__dirname, 'image')));

// 返回根页面 index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
