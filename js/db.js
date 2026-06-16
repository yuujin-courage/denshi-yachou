const DB = {
  getSites: function() {
    try { return JSON.parse(localStorage.getItem("sites") || "[]"); }
    catch(e) { return []; }
  },
  getSite: function(id) {
    var sites = this.getSites();
    for (var i = 0; i < sites.length; i++) {
      if (sites[i].id === id) return sites[i];
    }
    return null;
  },
  saveSite: function(site) {
    var sites = this.getSites();
    var index = -1;
    for (var i = 0; i < sites.length; i++) {
      if (sites[i].id === site.id) { index = i; break; }
    }
    if (index >= 0) {
      sites[index] = site;
      this.addHistory("編集", site.name, "現場情報を更新しました");
    } else {
      site.id        = Date.now().toString();
      site.createdAt = new Date().toISOString();
      sites.unshift(site);
      this.addHistory("新規", site.name, "現場を作成しました");
    }
    localStorage.setItem("sites", JSON.stringify(sites));
    return site;
  },
  deleteSite: function(id) {
    var sites   = this.getSites();
    var site    = this.getSite(id);
    var updated = [];
    for (var i = 0; i < sites.length; i++) {
      if (sites[i].id !== id) updated.push(sites[i]);
    }
    localStorage.setItem("sites", JSON.stringify(updated));
    if (site) this.addHistory("削除", site.name, "現場を削除しました");
  },
  getMeasurements: function(siteId) {
    try {
      return JSON.parse(
        localStorage.getItem("measurements_" + siteId) || "[]"
      );
    } catch(e) { return []; }
  },
  saveMeasurements: function(siteId, measurements) {
    localStorage.setItem(
      "measurements_" + siteId,
      JSON.stringify(measurements)
    );
  },
  getMaster: function(type) {
    var defaults = {
      instruments: ["レベル型式A", "レベル型式B", "デジタルレベルC"],
      staffs:      ["3m標尺(No.1)", "3m標尺(No.2)", "5m標尺"],
      observers:   ["山田 太郎", "鈴木 次郎", "佐藤 三郎"],
      weather:     ["晴", "曇", "雨", "雪", "その他"],
      wind:        ["無風", "弱風", "強風", "その他"]
    };
    try {
      var saved = localStorage.getItem("master_" + type);
      if (saved) return JSON.parse(saved);
      return defaults[type] || [];
    } catch(e) { return defaults[type] || []; }
  },
  saveMaster: function(type, list) {
    localStorage.setItem("master_" + type, JSON.stringify(list));
  },
  getHistory: function() {
    try {
      return JSON.parse(localStorage.getItem("history") || "[]");
    } catch(e) { return []; }
  },
  addHistory: function(type, target, detail) {
    try {
      var history = this.getHistory();
      history.unshift({
        id:     Date.now().toString(),
        type:   type,
        target: target,
        detail: detail,
        date:   new Date().toLocaleString("ja-JP")
      });
      if (history.length > 200) history.pop();
      localStorage.setItem("history", JSON.stringify(history));
    } catch(e) { console.warn("履歴保存失敗:", e); }
  },
  getSettings: function() {
    try {
      var s = localStorage.getItem("settings");
      if (s) return JSON.parse(s);
      return { theme: "light", fontSize: "medium" };
    } catch(e) { return { theme: "light", fontSize: "medium" }; }
  },
  saveSettings: function(settings) {
    localStorage.setItem("settings", JSON.stringify(settings));
  }
};