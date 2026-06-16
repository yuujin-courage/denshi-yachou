// ══════════════════════════════════════
// db.js - データ保存・読み込み
// ══════════════════════════════════════

const DB = {

  // ── 現場データ ──────────────────────

  // 全現場を取得
  getSites() {
    return JSON.parse(localStorage.getItem('sites') || '[]');
  },

  // 現場を1件取得
  getSite(id) {
    return this.getSites().find(s => s.id === id) || null;
  },

  // 現場を保存（新規・更新）
  saveSite(site) {
    const sites = this.getSites();
    const index = sites.findIndex(s => s.id === site.id);
    if (index >= 0) {
      sites[index] = site;
      this.addHistory('編集', site.name, '現場情報を更新しました');
    } else {
      site.id = Date.now().toString();
      site.createdAt = new Date().toISOString();
      sites.unshift(site);
      this.addHistory('新規', site.name, '現場を作成しました');
    }
    localStorage.setItem('sites', JSON.stringify(sites));
    return site;
  },

  // 現場を削除
  deleteSite(id) {
    const sites = this.getSites();
    const site  = this.getSite(id);
    const updated = sites.filter(s => s.id !== id);
    localStorage.setItem('sites', JSON.stringify(updated));
    if (site) this.addHistory('削除', site.name, '現場を削除しました');
  },

  // ── 測量データ ──────────────────────

  // 測量データを取得
  getMeasurements(siteId) {
    const key = `measurements_${siteId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  },

  // 測量データを保存
  saveMeasurements(siteId, measurements) {
    const key = `measurements_${siteId}`;
    localStorage.setItem(key, JSON.stringify(measurements));
  },

  // ── マスタデータ ────────────────────

  // マスタを取得
  getMaster(type) {
    const defaults = {
      instruments: ['レベル型式A', 'レベル型式B', 'デジタルレベルC'],
      staffs:      ['3m標尺（No.1）', '3m標尺（No.2）', '5m標尺'],
      observers:   ['山田 太郎', '鈴木 次郎', '佐藤 三郎'],
      weather:     ['晴', '曇', '雨', '雪', 'その他'],
      wind:        ['無風', '弱風', '強風', 'その他'],
    };
    const saved = localStorage.getItem(`master_${type}`);
    return saved ? JSON.parse(saved) : defaults[type] || [];
  },

  // マスタを保存
  saveMaster(type, list) {
    localStorage.setItem(`master_${type}`, JSON.stringify(list));
  },

  // ── 変更履歴 ────────────────────────

  // 履歴を取得
  getHistory() {
    return JSON.parse(localStorage.getItem('history') || '[]');
  },

  // 履歴を追加
  addHistory(type, target, detail) {
    const history = this.getHistory();
    history.unshift({
      id:     Date.now().toString(),
      type,
      target,
      detail,
      date:   new Date().toLocaleString('ja-JP'),
    });
    // 最大200件まで保持
    if (history.length > 200) history.pop();
    localStorage.setItem('history', JSON.stringify(history));
  },

  // ── 設定 ────────────────────────────

  // 設定を取得
  getSettings() {
    return JSON.parse(localStorage.getItem('settings') || JSON.stringify({
      theme:    'light',
      fontSize: 'medium',
    }));
  },

  // 設定を保存
  saveSettings(settings) {
    localStorage.setItem('settings', JSON.stringify(settings));
  },
};