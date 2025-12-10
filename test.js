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
        const res = await fetch('https://api.hyperliquid.xyz/info', {
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

// 测试
if (require.main === module) {
    getHLPrices('bch').then(console.log);
}
