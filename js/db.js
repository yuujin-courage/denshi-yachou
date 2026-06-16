// ══════════════════════════════════════
// db.js - データ保存・読み込み
// ══════════════════════════════════════

const DB = {

  // ── 現場データ ──────────────────────

  getSites() {
    try {
      return JSON.parse(
        localStorage.getItem('sites') || '[]'
      );
    } catch(e) {
      return [];
    }
  },

  getSite(id) {
    return this.getSites().find(s => s.id === id) || null;
  },

  saveSite(site) {
    const sites = this.getSites();
    const index = sites.findIndex(s => s.id === site.id);
    if (index >= 0) {
      sites[index] = site;
      this.addHistory('編集', site.name, '現場情報を更新しました');
    } else {
      site.id        = Date.now().toString();
      site.createdAt = new Date().toISOString();
      sites.unshift(site);
      this.addHistory('新規', site.name, '現場を作成しました');
    }
    localStorage.setItem('sites', JSON.stringify(sites));
    return site;
  },

  deleteSite(id) {
    const sites = this.getSites();
    const site  = this.getSite(id);
    const updated = sites.filter(s => s.id !== id);
    localStorage.setItem('sites', JSON.stringify(updated));
    if (site) {
      this.addHistory('削除', site.name, '現場を削除しました');
    }
  },

  // ── 測量データ ──────────────────────

  getMeasurements(siteId) {
    try {
      const key = 'measurements_' + siteId;
      return JSON.parse(
        localStorage.getItem(key) || '[]'
      );
    } catch(e) {
      return [];
    }
  },

  saveMeasurements(siteId, measurements) {
    const key = 'measurements_' + siteId;
    localStorage.setItem(key, JSON.stringify(measurements));
  },

  // ── マスタデータ ────────────────────

  getMaster(type) {
    const defaults = {
      instruments: [
        'レベル型式A',
        'レベル型式B',
        'デジタルレベルC',
      ],
      staffs: [
        '3m標尺(No.1)',
        '3m標尺(No.2)',
        '5m標尺',
      ],
      observers: [
        '山田 太郎',
        '鈴木 次郎',
        '佐藤 三郎',
      ],
      weather: [
        '晴',
        '曇',
        '雨',
        '雪',
        'その他',
      ],
      wind: [
        '無風',
        '弱風',
        '強風',
        'その他',
      ],
    };
    try {
      const saved = localStorage.getItem('master_' + type);
      return saved ? JSON.parse(saved) : (defaults[type] || []);
    } catch(e) {
      return defaults[type] || [];
    }
  },

  saveMaster(type, list) {
    localStorage.setItem(
      'master_' + type,
      JSON.stringify(list)
    );
  },

  // ── 変更履歴 ────────────────────────

  getHistory() {
    try {
      return JSON.parse(
        localStorage.getItem('history') || '[]'
      );
    } catch(e) {
      return [];
    }
  },

  addHistory(type, target, detail) {
    try {
      const history = this.getHistory();
      history.unshift({
        id:     Date.now().toString(),
        type:   type,
        target: target,
        detail: detail,
        date:   new Date().toLocaleString('ja-JP'),
      });
      if (history.length > 200) history.pop();
      localStorage.setItem('history', JSON.stringify(history));
    } catch(e) {
      console.warn('履歴保存失敗:', e);
    }
  },

  // ── 設定 ────────────────────────────

  getSettings() {
    try {
      return JSON.parse(
        localStorage.getItem('settings') ||
        JSON.stringify({ theme: 'light', fontSize: 'medium' })
      );
    } catch(e) {
      return { theme: 'light', fontSize: 'medium' };
    }
  },

  saveSettings(settings) {
    localStorage.setItem(
      'settings',
      JSON.stringify(settings)
    );
  },
};