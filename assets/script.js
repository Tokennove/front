// 简洁实现：默认不排序，点击列头开始排序，支持翻页与每页条数选择。

// 生成示例数据（已改为写死，按 UI 图固定样例）
const originalData = [
  { id: 1, platform: 'Binance', coin: 'ETH', price: 3245.67, principal: 50000, today: 125.50, total: 3766.50, apy: '7.53%', duration: '30天' },
  { id: 2, platform: 'Coinbase', coin: 'BTC', price: 68432.12, principal: 100000, today: 245.80, total: 7374.00, apy: '7.37%', duration: '60天' },
  { id: 3, platform: 'Kraken', coin: 'SOL', price: 142.83, principal: 20000, today: -52.40, total: 1572.00, apy: '7.86%', duration: '90天' },
  { id: 4, platform: 'Binance', coin: 'USDT', price: 1.00, principal: 30000, today: 45.00, total: -1350.00, apy: '4.5%', duration: '15天' },
  { id: 5, platform: 'OKX', coin: 'MATIC', price: 0.85, principal: 15000, today: 28.50, total: 855.00, apy: '5.7%', duration: '45天' },
  { id: 6, platform: 'Huobi', coin: 'DOT', price: 7.42, principal: 25000, today: -68.75, total: 2062.50, apy: '8.25%', duration: '30天' },
  { id: 7, platform: 'Coinbase', coin: 'AVAX', price: 38.56, principal: 18000, today: 41.40, total: -1242.00, apy: '6.9%', duration: '60天' },
  { id: 8, platform: 'Kraken', coin: 'ADA', price: 0.62, principal: 12000, today: 26.40, total: 792.00, apy: '6.6%', duration: '90天' },
  { id: 8, platform: 'AVAE', coin: 'XRP', price: 620, principal: 1600, today: 2.40, total: 12.00, apy: '5.6%', duration: '90天' },
  { id: 8, platform: 'LIDO', coin: 'BCH', price: 22.62, principal: 10, today: 28, total: 45.00, apy: '9.6%', duration: '90天' }
];

let data = [...originalData]; // will be sorted view of originalData
let currentSort = { key: null, asc: true }; // 默认不排序
let currentPage = 1;
const tbody = document.getElementById('tbody');
const pageInfo = document.getElementById('pageInfo');
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
// 每页固定 10 条
const PAGE_SIZE = 10;

function renderTable() {
  const pageSize = PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * pageSize;
  const pageSlice = data.slice(start, start + pageSize);

  tbody.innerHTML = pageSlice.map(row => {
    const todayClass = row.today > 0 ? 'num--green' : (row.today < 0 ? 'num--red' : 'num--muted');
    const totalClass = row.total > 0 ? 'num--green' : (row.total < 0 ? 'num--red' : 'num--muted');
    return `
    <tr>
      <td data-label="平台">${escapeHtml(row.platform)}</td>
      <td data-label="币种">${escapeHtml(row.coin)}</td>
      <!-- 当前价使用 .price-val 并添加 $ 前缀 -->
      <td data-label="当前价"><span class="price-val">$${formatSimpleNumber(row.price)}</span></td>
      <td data-label="本金">$${formatSimpleNumber(row.principal)}</td>
      <td data-label="今日收益" class="${todayClass}">${formatSignNumber(row.today)}</td>
      <td data-label="总体收益" class="${totalClass}">${formatSignNumber(row.total)}</td>
      <td data-label="APY"><span class="apy-pill">${escapeHtml(row.apy)}</span></td>
      <td data-label="质押时长">${escapeHtml(row.duration)}</td>
    </tr>
  `}).join('');

  pageInfo.textContent = `第 ${currentPage} 页 / ${totalPages} 页`;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
  updateSortIndicators();
}

function applySort() {
  if (!currentSort.key) {
    data = [...originalData];
    return;
  }
  const key = currentSort.key;
  const asc = currentSort.asc ? 1 : -1;

  data = [...originalData].sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    // 数值字段按数值排序，否则按字符串排序
    if (typeof va === 'number' && typeof vb === 'number') {
      return (va - vb) * asc;
    }
    return String(va).localeCompare(String(vb), undefined, { numeric: true }) * asc;
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

  // 分页按钮
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });
  nextBtn.addEventListener('click', () => {
    const pageSize = PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });

  // 初次渲染：保持原始顺序（默认不排序）
  applySort(); // 当前 currentSort.key 为 null，会恢复原始数据
  renderTable();
}

// 简化的千分位不带 + 号，用于 price/principal 显示
function formatSimpleNumber(val){
  if (typeof val !== 'number') return escapeHtml(String(val));
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 带符号显示（今日/总体收益）
function formatSignNumber(val){
  if (typeof val !== 'number') return escapeHtml(String(val));
  const abs = Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (val >= 0 ? `+$${abs}` : `-$${abs}`);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}

// 启动
document.addEventListener('DOMContentLoaded', init);
