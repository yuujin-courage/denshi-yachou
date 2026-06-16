document.addEventListener("DOMContentLoaded", function() {
  applySettings();
  loadSiteList();
  setupSearch();
});

function applySettings() {
  try {
    var s     = DB.getSettings();
    var sizes = { small: "14px", medium: "16px", large: "19px" };
    document.documentElement.style.setProperty(
      "--font-size", sizes[s.fontSize] || "16px"
    );
    if (s.theme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  } catch(e) { console.warn("applySettings error:", e); }
}

function loadSiteList(filter) {
  filter = filter || "";
  var sites   = DB.getSites();
  var list    = document.getElementById("siteList");
  var empty   = document.getElementById("emptyState");
  var counter = document.getElementById("siteCount");

  var filtered = [];
  for (var i = 0; i < sites.length; i++) {
    var s = sites[i];
    if (s.name.indexOf(filter) !== -1 ||
        (s.route || "").indexOf(filter) !== -1) {
      filtered.push(s);
    }
  }

  if (counter) counter.textContent = sites.length;

  if (filtered.length === 0) {
    list.innerHTML = "";
    if (empty) {
      list.appendChild(empty);
      empty.style.display = "block";
    }
    return;
  }

  if (empty) empty.style.display = "none";

  var html = "";
  for (var j = 0; j < filtered.length; j++) {
    var site = filtered[j];
    html +=
      "<a class=\"site-card\" href=\"pages/input.html?id=" +
      site.id + "\">" +
      "<div class=\"site-info\">" +
      "<h3>" + esc(site.name) + "</h3>" +
      "<p>" + esc(site.from) + " to " + esc(site.to) + "</p>" +
      "<p>" + esc(site.date) + " " + esc(site.observer) + "</p>" +
      "<span class=\"badge badge-primary\">" +
      esc(site.grade) + "</span>" +
      "</div>" +
      "<div class=\"arrow\">窶ｺ</div>" +
      "</a>";
  }
  list.innerHTML = html;

  if (sites.length >= 50) showLimitAlert();
}

function setupSearch() {
  var input = document.getElementById("searchInput");
  if (!input) return;
  input.addEventListener("input", function() {
    loadSiteList(input.value.trim());
  });
}

function showLimitAlert() {
  if (document.getElementById("limitAlert")) return;
  var el       = document.createElement("div");
  el.id        = "limitAlert";
  el.className = "alert alert-warning";
  el.textContent = "Site limit reached (50). Please delete old sites.";
  var main = document.querySelector(".main-content");
  if (main) main.prepend(el);
}

function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
