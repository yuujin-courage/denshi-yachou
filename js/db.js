var DB = {
  getSites: function() {
    try {
      return JSON.parse(localStorage.getItem("sites") || "[]");
    } catch(e) { return []; }
  },
  getSite: function(id) {
    var list = this.getSites();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  },
  saveSite: function(site) {
    var list  = this.getSites();
    var found = false;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === site.id) {
        list[i] = site;
        found   = true;
        break;
      }
    }
    if (found) {
      this.addHistory("\u7de8\u96c6", site.name,
        "\u73fe\u5834\u60c5\u5831\u3092\u66f4\u65b0\u3057\u307e\u3057\u305f");
    } else {
      site.id        = String(Date.now());
      site.createdAt = new Date().toISOString();
      list.unshift(site);
      this.addHistory("\u65b0\u898f", site.name,
        "\u73fe\u5834\u3092\u4f5c\u6210\u3057\u307e\u3057\u305f");
    }
    localStorage.setItem("sites", JSON.stringify(list));
    return site;
  },
  deleteSite: function(id) {
    var list    = this.getSites();
    var site    = this.getSite(id);
    var updated = [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id !== id) updated.push(list[i]);
    }
    localStorage.setItem("sites", JSON.stringify(updated));
    if (site) {
      this.addHistory("\u524a\u9664", site.name,
        "\u73fe\u5834\u3092\u524a\u9664\u3057\u307e\u3057\u305f");
    }
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
      instruments: [
        "\u30ec\u30d9\u30eb\u578b\u5f0fA",
        "\u30ec\u30d9\u30eb\u578b\u5f0fB",
        "\u30c7\u30b8\u30bf\u30eb\u30ec\u30d9\u30ebC"
      ],
      staffs: [
        "3m\u6a19\u5c3a(No.1)",
        "3m\u6a19\u5c3a(No.2)",
        "5m\u6a19\u5c3a"
      ],
      observers: [
        "\u5c71\u7530 \u592a\u90ce",
        "\u9234\u6728 \u6b21\u90ce",
        "\u4f50\u85e4 \u4e09\u90ce"
      ],
      weather: [
        "\u6674", "\u66c7", "\u96e8", "\u96ea",
        "\u305d\u306e\u4ed6"
      ],
      wind: [
        "\u7121\u98a8", "\u5f31\u98a8",
        "\u5f37\u98a8", "\u305d\u306e\u4ed6"
      ]
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
        id:     String(Date.now()),
        type:   type,
        target: target,
        detail: detail,
        date:   new Date().toLocaleString("ja-JP")
      });
      if (history.length > 200) history.pop();
      localStorage.setItem("history", JSON.stringify(history));
    } catch(e) { console.warn("save error:", e); }
  },
  getSettings: function() {
    try {
      var saved = localStorage.getItem("settings");
      if (saved) return JSON.parse(saved);
      return { theme: "light", fontSize: "medium" };
    } catch(e) { return { theme: "light", fontSize: "medium" }; }
  },
  saveSettings: function(settings) {
    localStorage.setItem("settings", JSON.stringify(settings));
  }
};