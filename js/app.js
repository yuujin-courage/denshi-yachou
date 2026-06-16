// ══════════════════════════════════════
// app.js - ホーム画面の制御
// ══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  loadSiteList();
  setupSearch();
});

// 現場一覧を表示する
function loadSiteList(filter = '') {
  const sites    = DB.getSites();
  const list     = document.getElementById('siteList');
  const empty    = document.getElementById('emptyState');
  const counter  = document.getElementById('siteCount');

  // フィルタリング
  const filtered = sites.filter(s =>
    s.name.includes(filter) || s.route.includes(filter)
  );

  counter.textContent = sites.length;

  // 空の場合
  if (filtered.length === 0) {
    list.innerHTML = '';
    list.appendChild(empty);
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  // カード生成
  list.innerHTML = filtered.map(site => `
    <a class="site-card" href="pages/input.html?id=${site.id}">
      <div class="site-info">
        <h3>${site.name}</h3>
        <p>📍 ${site.from} → ${site.to}</p>
        <p>📅 ${site.date}　👤 ${site.observer}</p>
        <span class="badge badge-primary">${site.grade}</span>
      </div>
      <div class="arrow">›</div>
    </a>
  `).join('');

  // 50現場上限チェック
  if (sites.length >= 50) {
    showLimitAlert();
  }
}

// 検索機能
function setupSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  input.addEventListener('input', () => {
    loadSiteList(input.value.trim());
  });
}

// 50現場上限アラート
function showLimitAlert() {
  if (document.getElementById('limitAlert')) return;
  const alert = document.createElement('div');
  alert.id = 'limitAlert';
  alert.className = 'alert alert-warning';
  alert.innerHTML = `
    ⚠️ 現場数が50件に達しました。
    <a href="pages/master.html" style="color:inherit;font-weight:bold;">
      古い現場を削除してください
    </a>
  `;
  document.querySelector('.main-content').prepend(alert);
}