document.addEventListener('DOMContentLoaded', () => {
  applySettings();
  loadSiteList();
  setupSearch();
});

function applySettings() {
  try {
    const s     = DB.getSettings();
    const sizes = { small: '14px', medium: '16px', large: '19px' };
    document.documentElement.style.setProperty(
      '--font-size', sizes[s.fontSize] || '16px'
    );
    document.body.classList.toggle('dark', s.theme === 'dark');
  } catch(e) { console.warn('設定適用失敗:', e); }
}

function loadSiteList(filter) {
  filter = filter || '';
  const sites    = DB.getSites();
  const list     = document.getElementById('siteList');
  const empty    = document.getElementById('emptyState');
  const counter  = document.getElementById('siteCount');

  const filtered = sites.filter(function(s) {
    return s.name.includes(filter) ||
           (s.route || '').includes(filter);
  });

  if (counter) counter.textContent = sites.length;

  if (filtered.length === 0) {
    list.innerHTML = '';
    if (empty) {
      list.appendChild(empty);
      empty.style.display = 'block';
    }
    return;
  }

  if (empty) empty.style.display = 'none';

  list.innerHTML = filtered.map(function(site) {
    return '<a class="site-card" href="pages/input.html?id=' +
      site.id + '">' +
      '<div class="site-info">' +
      '<h3>' + escapeHtml(site.name) + '</h3>' +
      '<p>📍 ' + escapeHtml(site.from) +
      ' → ' + escapeHtml(site.to) + '</p>' +
      '<p>📅 ' + escapeHtml(site.date) +
      '　👤 ' + escapeHtml(site.observer) + '</p>' +
      '<span class="badge badge-primary">' +
      escapeHtml(site.grade) + '</span>' +
      '</div>' +
      '<div class="arrow">›</div>' +
      '</a>';
  }).join('');

  if (sites.length >= 50) showLimitAlert();
}

function setupSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  input.addEventListener('input', function() {
    loadSiteList(input.value.trim());
  });
}

function showLimitAlert() {
  if (document.getElementById('limitAlert')) return;
  const alert = document.createElement('div');
  alert.id        = 'limitAlert';
  alert.className = 'alert alert-warning';
  alert.innerHTML = '⚠️ 現場数が50件に達しました。' +
    '<a href="pages/master.html" style="color:inherit;' +
    'font-weight:bold;">古い現場を削除してください</a>';
  const main = document.querySelector('.main-content');
  if (main) main.prepend(alert);
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}