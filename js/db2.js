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
      this.addHistory("edit", site.name, "updated");
    } else {
      site.id        = String(Date.now());
      site.createdAt = new Date().toISOString();
      list.unshift(site);
      this.addHistory("new", site.name, "created");
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
    if (site) this.addHistory("delete", site.name, "deleted");
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
      instruments: ["Level-A", "Level-B", "Digital-Level-C"],
      staffs:      ["3m-Staff-1", "3m-Staff-2", "5m-Staff"],
      observers:   ["Yamada", "Suzuki", "Sato"],
      weather:     ["Sunny", "Cloudy", "Rain", "Snow", "Other"],
      wind:        ["None", "Light", "Strong", "Other"]
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
    } catch(e) { console.warn("history save error:", e); }
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