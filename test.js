const { Hyperliquid } = require('hyperliquid');

/**
 * 获取指定币种的当前价格（mid price）
 * @param {string[]} symbols - 例如 ['SOL', 'ETH', 'BTC']
 */
async function getPrices(symbols) {
    const sdk = new Hyperliquid({ enableWs: false }); // 不启用 WebSocket

    // 获取所有市场 mid price
    const allMids = await sdk.info.getAllMids();

    // 筛选出指定币种价格
    const result = {};
    symbols.forEach(sym => {
        if (allMids[sym] !== undefined) {
            result[sym] = allMids[sym];
        } else {
            result[sym] = null; // 币种不存在
        }
    });

    return result;
}

// 示例
getPrices(['SOL', 'ETH', 'BTC']).then(prices => {
    console.log(prices);
    // 输出示例: { SOL: 142.83, ETH: 3245.67, BTC: 68432.12 }
}).catch(console.error);
