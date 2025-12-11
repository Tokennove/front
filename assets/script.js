// 简洁实现：默认不排序，点击列头开始排序，支持翻页与每页条数选择。

// 原来的硬编码 originalData 已移除，改为从后端拉取
let originalData = []; // will be filled from API
let data = []; // will be a sorted/view copy of originalData
let currentFiltered = []; // 当前基于搜索过滤后的数据源
let currentSort = {key: null, asc: true}; // 默认不排序
let currentPage = 1;
let isLoading = false; // 数据加载状态
const tbody = document.getElementById('tbody');
const pageInfo = document.getElementById('pageInfo');
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
// 每页固定 10 条
const PAGE_SIZE = 10;

// 用于显示汇总的元素（页面中如无对应 id 则安全忽略）
const principalEl = document.getElementById('principalTotal');
const todayEl = document.getElementById('todayTotal');
const overallEl = document.getElementById('overallTotal');

// 渲染三个汇总值到页面（后端会返回这些值）
function renderTotals(principalTotal = 0, todayTotal = 0, overallTotal = 0) {
    if (principalEl) principalEl.textContent = '$' + Number(principalTotal).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    if (todayEl) {
        const sign = Number(todayTotal) >= 0 ? '+' : '-';
        todayEl.textContent = sign + '$' + Math.abs(Number(todayTotal)).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    if (overallEl) {
        const sign = Number(overallTotal) >= 0 ? '+' : '-';
        overallEl.textContent = sign + '$' + Math.abs(Number(overallTotal)).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
}

// 从后端拉取 originalData 与三个汇总并初始化视图（增强版：按序尝试多个 URL）
function initFromApi() {
    const candidates = ['/api/portfolio'];
    try {
        // 如果页面在 http(s) 下，尝试使用 window.location.origin
        if (window && window.location && /^https?:\/\//.test(window.location.origin)) {
            candidates.push(window.location.origin + '/api/portfolio');
        }
    } catch (e) {
        // ignore
    }
    // 最后兜底尝试默认本地端口（常见开发场景）
    candidates.push('http://localhost:3000/api/portfolio');

    // 设置加载中状态
    isLoading = true;
    renderTable();

    let tried = 0;

    function attemptNext() {
        if (tried >= candidates.length) {
            console.error('所有后端请求尝试失败：', candidates);
            isLoading = false;
            renderTable();
            return handleFetchError(new Error('无法连接到后端 API'));
        }
        const url = candidates[tried++];
        console.log('尝试从后端获取数据，URL：', url);
        fetch(url, {cache: 'no-cache'})
            .then(r => {
                if (!r.ok) throw new Error('Fetch failed: ' + r.status + ' ' + r.statusText + ' from ' + url);
                return r.json();
            })
            .then(json => {
                console.log('成功从后端获取数据，来自：', url);
                originalData = Array.isArray(json.originalData) ? json.originalData : [];
                // 根据当前输入重新应用过滤（如果用户在数据加载前输入了关键词）
                applyFilterFromInput();
                data = [...currentFiltered];
                renderTotals(Number(json.principalTotal) || 0, Number(json.todayTotal) || 0, Number(json.overallTotal) || 0);
                applySort();
                isLoading = false;
                renderTable();
            })
            .catch(err => {
                console.warn('从 URL 读取失败，准备尝试下一个候选项：', url, err);
                setTimeout(attemptNext, 150); // 短暂延迟后重试下一个
            });
    }

    function handleFetchError(err) {
        // 在控制台显示，并在页面顶部用 alert 显示（如果可用）
        console.error('initFromApi 错误：', err);
        try {
            // 创建或更新一个位于 header 下方的错误提示条
            let el = document.getElementById('apiError');
            if (!el) {
                el = document.createElement('div');
                el.id = 'apiError';
                el.style.cssText = 'background:#fff3f3;color:#8a1f1f;padding:10px;border-radius:4px;margin:12px 0;font-size:14px;';
                const header = document.querySelector('.page-header') || document.body;
                header.parentNode.insertBefore(el, header.nextSibling);
            }
            el.textContent = '无法从后端获取数据，请确保已通过 http://localhost:3000/ 访问页面并启动后端。详细错误见控制台。';
        } catch (e) {
            // ignore DOM errors
        }
    }

    attemptNext();
}

function renderTable() {
    if (isLoading) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:20px;color:#666;">加载中...</td></tr>`;
        pageInfo.textContent = '加载中...';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }

    const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageSlice = data.slice(start, start + PAGE_SIZE);

    if (pageSlice.length === 0) {
        tbody.innerHTML = `
      <tr><td colspan="10" style="text-align:center;padding:20px;color:#666;">没有匹配结果</td></tr>
    `;
    } else {
        tbody.innerHTML = pageSlice.map(row => {
            const todayClass = row.today > 0 ? 'num--green' : (row.today < 0 ? 'num--red' : 'num--muted');
            const totalClass = row.total > 0 ? 'num--green' : (row.total < 0 ? 'num--red' : 'num--muted');
            // 收益曲线：使用 SVG 图表展示
            const yieldCurveDisplay = renderSparkline(row.yieldCurve);
            // 币种图片（根据币种名称构造图片 URL）
            const coinImageHtml = row.coin
                ? `<img src="/image/${row.coin.toUpperCase()}.png" alt="${escapeHtml(row.coin)}" onerror="this.style.display='none'" />`
                : '';
            return `
      <tr>
        <td data-label="平台"><span class="platform">${escapeHtml(row.platform)}</span></td>
        <td data-label="本金币种"><span class="coin-name">${coinImageHtml}${escapeHtml(row.coin)}</span></td>
        <td data-label="当前价"><span class="price-val">$${formatSimpleNumber(row.price)}</span></td>
        <td data-label="本金">$${formatSimpleNumber(row.principal)}</td>
        <td data-label="今日收益" class="${todayClass}">${formatSignNumber(row.today)}</td>
        <td data-label="总体收益" class="${totalClass}">${formatSignNumber(row.total)}</td>
        <td data-label="APY"><span class="apy-pill">${escapeHtml(row.apy)}%</span></td>
        <td data-label="策略">${escapeHtml(row.strategy || '-')}</td>
        <td data-label="运行时长">${escapeHtml(row.duration)}天</td>
        <td data-label="收益曲线">${yieldCurveDisplay}</td>
      </tr>
    `
        }).join('');
    }

    pageInfo.textContent = `第 ${currentPage} 页 / ${totalPages} 页`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    updateSortIndicators();
}

function applySort() {
    if (!currentSort.key) {
        data = [...currentFiltered];
        return;
    }
    const key = currentSort.key;
    const asc = currentSort.asc ? 1 : -1;

    data = [...currentFiltered].sort((a, b) => {
        const va = a[key];
        const vb = b[key];
        // 数值字段按数值排序，否则按字符串排序
        if (typeof va === 'number' && typeof vb === 'number') {
            return (va - vb) * asc;
        }
        return String(va).localeCompare(String(vb), undefined, {numeric: true}) * asc;
    });
}

function updateSortIndicators() {
    // 通过设置/移除 aria-sort 来让 CSS 显示不同箭头，避免直接操作 span 内容
    document.querySelectorAll('.th-btn').forEach(btn => {
        const key = btn.getAttribute('data-key');
        if (currentSort.key === key) {
            btn.setAttribute('aria-sort', currentSort.asc ? 'ascending' : 'descending');
        } else {
            btn.removeAttribute('aria-sort');
        }
    });
}

function init() {
    // 绑定表头排序
    document.querySelectorAll('.th-btn').forEach(btn => {
        // 让 APY 列的表头居中（如果存在）
        const headerKey = btn.getAttribute('data-key');
        if (headerKey === 'apy') {
            const th = btn.closest('th');
            if (th) {
                th.style.textAlign = 'center';
                th.style.verticalAlign = 'middle';
            }
        }
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-key');
            if (!key) return;
            if (currentSort.key === key) {
                currentSort.asc = !currentSort.asc; // 切换升降序
            } else {
                currentSort.key = key;
                currentSort.asc = true; // 新列默认升序
            }
            applySort();
            currentPage = 1; // 切换排序后回到第一页
            renderTable();
        });
    });

    // 绑定搜索输入（按平台或币种模糊匹配）
    // 在 init 时重新获取元素并绑定，防止脚本顶层获取不到元素
    const se = document.getElementById('search');
    if (se) {
        // 防抖
        let debounceTimer = null;
        se.addEventListener('input', () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const term = (se.value || '').trim().toLowerCase();
                console.log('search input:', term);
                if (!term) {
                    currentFiltered = [...originalData];
                } else {
                    currentFiltered = originalData.filter(r => {
                        const p = (r.platform || '').toString().toLowerCase();
                        const c = (r.coin || '').toString().toLowerCase();
                        return p.includes(term) || c.includes(term);
                    });
                }
                console.log('search matches:', currentFiltered.length);
                currentPage = 1; // 搜索时回到第一页
                applySort();
                renderTable();
            }, 150);
        });
    }

    // 分页按钮
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });
    nextBtn.addEventListener('click', () => {
        const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });

    // 初次渲染：保持原始顺序（默认不排序）
    applySort(); // 当前 currentSort.key 为 null，会恢复原始数据
    renderTable();
}

// 生成收益曲线的 SVG 迷你图表（白色背景 Web3 风格）
function renderSparkline(dataPoints) {
    if (!Array.isArray(dataPoints) || dataPoints.length < 2) {
        return '<span style="color:#9ca3af;">-</span>';
    }

    const width = 80;
    const height = 30;
    const padding = 3;

    // 计算数据范围
    const min = Math.min(...dataPoints);
    const max = Math.max(...dataPoints);
    const range = max - min || 1; // 避免除以0

    // 将数据点转换为坐标
    const points = dataPoints.map((val, i) => {
        const x = padding + (i / (dataPoints.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((val - min) / range) * (height - 2 * padding);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');

    // 为渐变填充创建路径（添加底部封闭区域）
    const firstX = padding;
    const lastX = padding + (width - 2 * padding);
    const bottomY = height - padding;

    const areaPoints = `${firstX},${bottomY} ${points} ${lastX},${bottomY}`;

    // 生成唯一 ID 以避免多个 SVG 之间渐变冲突
    const uniqueId = 'gradient-' + Math.random().toString(36).substr(2, 9);

    // 判断涨跌使用不同颜色
    const isUp = dataPoints[dataPoints.length - 1] >= dataPoints[0];
    const strokeColor = isUp ? '#00e676' : '#ff1744';
    const gradientStartColor = isUp ? '#00e676' : '#ff1744';
    const gradientEndColor = isUp ? '#00e676' : '#ff1744';

    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" style="display:block;margin:0 auto;max-width:100%;max-height:100%;">
        <defs>
            <linearGradient id="${uniqueId}" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:${gradientStartColor};stop-opacity:0.3" />
                <stop offset="100%" style="stop-color:${gradientEndColor};stop-opacity:0.02" />
            </linearGradient>
            <filter id="glow-${uniqueId}" x="-5%" y="-5%" width="110%" height="110%">
                <feGaussianBlur stdDeviation="0.6" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        <polygon points="${areaPoints}" fill="url(#${uniqueId})"/>
        <polyline points="${points}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow-${uniqueId})"/>
    </svg>`;
}

// 简化的千分位不带 + 号，用于 price/principal 显示
function formatSimpleNumber(val) {
    if (val === null || val === undefined) return '-';
    const num = Number(val);
    if (isNaN(num)) return '-';
    return num.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

// 带符号显示（今日/总体收益）
function formatSignNumber(val) {
    if (val === null || val === undefined) return '-';
    const num = Number(val);
    if (isNaN(num)) return '-';
    const abs = Math.abs(num).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    return (num >= 0 ? `+$${abs}` : `-$${abs}`);
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[c]);
}

// 在顶部或合适位置新增一个函数：根据当前搜索输入重新计算 currentFiltered
function applyFilterFromInput() {
    try {
        const se = document.getElementById('search');
        const term = (se && se.value) ? se.value.trim().toLowerCase() : '';
        if (!term) {
            currentFiltered = [...originalData];
        } else {
            currentFiltered = originalData.filter(r => {
                const p = (r.platform || '').toString().toLowerCase();
                const c = (r.coin || '').toString().toLowerCase();
                return p.includes(term) || c.includes(term);
            });
        }
    } catch (e) {
        currentFiltered = [...originalData];
    }
}

// 启动
document.addEventListener('DOMContentLoaded', () => {
    // 先绑定交互（init 会绑定事件），再从 API 拉取数据以避免重复绑定
    init();
    initFromApi();
});
