var EXPORT = {

  toReiwa: function(dateStr) {
    if (!dateStr) return { y: "", m: "", d: "" };
    var date  = new Date(dateStr);
    var reiwa = date.getFullYear() - 2018;
    return {
      y: reiwa > 0 ? String(reiwa) : "",
      m: String(date.getMonth() + 1),
      d: String(date.getDate())
    };
  },

  // ── Excel出力 ──────────────────────
  toExcel: function(site, measurements) {
    var computed = CALC.compute(measurements, site.bmHeight);
    var check    = CALC.check(computed);
    var reiwa    = this.toReiwa(site.date);

    var ws_data = [
      ["水準測量手簿"],
      [],
      ["工事名", site.name, "", "路線名", site.route || ""],
      ["自（標石）", site.from, "", "至（標石）", site.to],
      ["日付",
       "令和" + reiwa.y + "年" + reiwa.m + "月" + reiwa.d + "日",
       "", "天候", site.weather, "風", site.wind],
      ["器械", site.instrument, "", "標尺", site.staff],
      ["観測者", site.observer, "", "等級", site.grade],
      ["BM高（m）", site.bmHeight],
      [],
      ["番号","距離(m)","後視(m)","前視(m)",
       "高低差(+)(m)","高低差(-)(m)","備考"]
    ];

    var TOTAL = 33;
    for (var i = 0; i < TOTAL; i++) {
      var row = computed[i];
      if (row) {
        var dp = (row.diff !== null && row.diff >= 0)
                 ? parseFloat(CALC.fmt(row.diff)) : "";
        var dm = (row.diff !== null && row.diff < 0)
                 ? parseFloat(CALC.fmt(Math.abs(row.diff))) : "";
        ws_data.push([
          row.point || "", "",
          row.bs !== null ? parseFloat(CALC.fmt(row.bs)) : "",
          row.fs !== null ? parseFloat(CALC.fmt(row.fs)) : "",
          dp, dm, row.note || ""
        ]);
      } else {
        ws_data.push(["","","","","","",""]);
      }
    }

    ws_data.push([]);
    ws_data.push(["和","",
      parseFloat(CALC.fmt(check.sumBS)),
      parseFloat(CALC.fmt(check.sumFS)),
      parseFloat(CALC.fmt(check.sumPlus)),
      parseFloat(CALC.fmt(check.sumMinus)),""]);
    ws_data.push(["点検","","","","","",""]);
    ws_data.push(["結果","",
      check.isOK ? "OK" : "不一致","",
      "ΣBS-ΣFS=" + CALC.fmt(check.diffBSFS),"",""]);

    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws["!cols"] = [
      {wch:12},{wch:8},{wch:10},{wch:10},
      {wch:10},{wch:10},{wch:20}
    ];
    XLSX.utils.book_append_sheet(wb, ws, "水準測量手簿");
    XLSX.writeFile(wb,
      "水準測量手簿_" + site.name + "_" + site.date + ".xlsx");
  },

  // ── PDF出力（html2canvas方式・日本語完全対応） ──
  toPDF: function(site, measurements) {
    var computed = CALC.compute(measurements, site.bmHeight);
    var check    = CALC.check(computed);
    var reiwa    = this.toReiwa(site.date);
    var TOTAL    = 33;

    // HTMLテンプレートを構築
    var html = "";

    // タイトル
    html += "<div class=\"title\">水　準　測　量　手　簿</div>";

    // ヘッダー
    html += "<div class=\"header-row\">" +
      "<span class=\"label\">自　　標石</span>" +
      "<span class=\"value\">" + esc(site.from) + "</span>" +
      "<span class=\"label\" style=\"margin-left:4mm;\">至　　標石</span>" +
      "<span class=\"value\">" + esc(site.to) + "</span>" +
      "</div>";

    html += "<div style=\"display:flex;justify-content:space-between;" +
      "margin-bottom:1.5mm;\">" +
      "<div>" +
      "<div class=\"header-row\">" +
      "<span class=\"label\">令和 " + reiwa.y + " 年 " +
      reiwa.m + " 月 " + reiwa.d + " 日</span>" +
      "<span style=\"margin-left:4mm;\">天候　" + esc(site.weather) + "</span>" +
      "<span style=\"margin-left:4mm;\">風　" + esc(site.wind) + "</span>" +
      "</div>" +
      "<div class=\"header-row\">" +
      "<span class=\"label\">工事名：" + esc(site.name) + "</span>" +
      "<span style=\"margin-left:4mm;\">等級：" + esc(site.grade) + "</span>" +
      "<span style=\"margin-left:4mm;\">BM高：" + site.bmHeight + " m</span>" +
      "</div>" +
      "</div>" +
      "<div style=\"text-align:right;font-size:7.5pt;\">" +
      "器　械　" + esc(site.instrument) + "<br>" +
      "標　尺　" + esc(site.staff) + "<br>" +
      "観測者　" + esc(site.observer) + "<br>" +
      "</div>" +
      "</div>";

    // テーブル
    html += "<table>" +
      "<thead>" +
      "<tr>" +
      "<th rowspan=\"2\" style=\"width:10%\">番　号</th>" +
      "<th rowspan=\"2\" style=\"width:8%\">距　離</th>" +
      "<th rowspan=\"2\" style=\"width:14%\">後　視</th>" +
      "<th rowspan=\"2\" style=\"width:14%\">前　視</th>" +
      "<th colspan=\"2\" style=\"width:20%\">高　低　差</th>" +
      "<th rowspan=\"2\" style=\"width:34%\">備　考</th>" +
      "</tr>" +
      "<tr>" +
      "<th style=\"width:10%\">　＋　</th>" +
      "<th style=\"width:10%\">　－　</th>" +
      "</tr>" +
      "<tr>" +
      "<td></td><td>m</td><td>m</td><td>m</td>" +
      "<td>m</td><td>m</td><td></td>" +
      "</tr>" +
      "</thead>" +
      "<tbody>";

    for (var i = 0; i < TOTAL; i++) {
      var row = computed[i];
      if (row) {
        var dp = (row.diff !== null && row.diff >= 0)
                 ? CALC.fmt(row.diff) : "";
        var dm = (row.diff !== null && row.diff < 0)
                 ? CALC.fmt(Math.abs(row.diff)) : "";
        html += "<tr>" +
          "<td class=\"data\">" + esc(row.point || "") + "</td>" +
          "<td></td>" +
          "<td class=\"num\">" + (row.bs !== null ? CALC.fmt(row.bs) : "") + "</td>" +
          "<td class=\"num\">" + (row.fs !== null ? CALC.fmt(row.fs) : "") + "</td>" +
          "<td class=\"num\">" + dp + "</td>" +
          "<td class=\"num\">" + dm + "</td>" +
          "<td class=\"data\" style=\"text-align:left;padding-left:1mm;\">" +
          esc(row.note || "") + "</td>" +
          "</tr>";
      } else {
        html += "<tr><td></td><td></td><td></td>" +
                "<td></td><td></td><td></td><td></td></tr>";
      }
    }

    html += "</tbody>" +
      "</table>";

    // 和・点検・結果行
    html += "<div class=\"sum-section\"><table>" +
      "<tr>" +
      "<td style=\"width:10%;color:#b8732f;font-weight:bold;\">和</td>" +
      "<td style=\"width:8%;\"></td>" +
      "<td class=\"num\" style=\"width:14%;\">" + CALC.fmt(check.sumBS) + "</td>" +
      "<td class=\"num\" style=\"width:14%;\">" + CALC.fmt(check.sumFS) + "</td>" +
      "<td class=\"num\" style=\"width:10%;\">" + CALC.fmt(check.sumPlus) + "</td>" +
      "<td class=\"num\" style=\"width:10%;\">" + CALC.fmt(check.sumMinus) + "</td>" +
      "<td style=\"width:34%;\"></td>" +
      "</tr>" +
      "<tr>" +
      "<td style=\"color:#b8732f;font-weight:bold;\">点　検</td>" +
      "<td></td><td></td><td></td><td></td><td></td><td></td>" +
      "</tr>" +
      "<tr>" +
      "<td style=\"color:#b8732f;font-weight:bold;\">結　果</td>" +
      "<td></td>" +
      "<td colspan=\"4\" style=\"text-align:left;padding-left:2mm;" +
      "color:" + (check.isOK ? "#1e8449" : "#c0392b") + ";" +
      "font-weight:bold;\">" +
      (check.isOK ? "OK" : "不一致") +
      "　ΣBS-ΣFS=" + CALC.fmt(check.diffBSFS) +
      "</td>" +
      "<td style=\"text-align:right;font-size:6.5pt;color:#999;\">" +
      "(　　) S.P.</td>" +
      "</tr>" +
      "</table></div>";

    // フッター
    html += "<div class=\"footer\">" +
      "電子野帳システム　出力日時：" +
      new Date().toLocaleString("ja-JP") +
      "</div>";

    // テンプレートに挿入
    var tmpl = document.getElementById("pdfTemplate");
    tmpl.innerHTML = html;
    tmpl.style.left = "-9999px";
    document.body.appendChild(tmpl);

    // html2canvasでキャプチャしてPDF化
    html2canvas(tmpl, {
      scale:           2,
      useCORS:         true,
      backgroundColor: "#ffffff",
      width:           tmpl.scrollWidth,
      height:          tmpl.scrollHeight
    }).then(function(canvas) {
      var jsPDF  = window.jspdf.jsPDF;
      var doc    = new jsPDF({
        orientation: "portrait",
        unit:        "mm",
        format:      "a4"
      });

      var imgData = canvas.toDataURL("image/png");
      var pageW   = 210;
      var pageH   = 297;
      var margin  = 8;
      var imgW    = pageW - margin * 2;
      var imgH    = canvas.height * imgW / canvas.width;

      // ページをまたぐ場合は複数ページ
      if (imgH <= pageH - margin * 2) {
        doc.addImage(imgData, "PNG", margin, margin, imgW, imgH);
      } else {
        var pageImgH = pageH - margin * 2;
        var totalH   = imgH;
        var offset   = 0;
        while (offset < totalH) {
          doc.addImage(
            imgData, "PNG",
            margin, margin - offset,
            imgW, imgH
          );
          offset += pageImgH;
          if (offset < totalH) doc.addPage();
        }
      }

      doc.save("水準測量手簿_" + site.name + "_" + site.date + ".pdf");

      // テンプレートをリセット
      tmpl.innerHTML = "";
      document.getElementById("loadingOverlay")
              .classList.remove("show");
    }).catch(function(e) {
      console.error(e);
      document.getElementById("loadingOverlay")
              .classList.remove("show");
      throw e;
    });
  },

  // ── CSV出力 ────────────────────────
  toCSV: function(site, measurements) {
    var computed = CALC.compute(measurements, site.bmHeight);
    var check    = CALC.check(computed);
    var reiwa    = this.toReiwa(site.date);
    var TOTAL    = 33;

    var headers = [
      "番号","距離(m)","後視(m)","前視(m)",
      "高低差(+)(m)","高低差(-)(m)","備考"
    ];
    var lines = [
      "# 水準測量手簿",
      "# 工事名," + site.name,
      "# 路線名," + (site.route || ""),
      "# 自," + site.from + ",至," + site.to,
      "# 日付,令和" + reiwa.y + "年" + reiwa.m + "月" + reiwa.d + "日",
      "# 天候," + site.weather + ",風," + site.wind,
      "# 器械," + site.instrument + ",標尺," + site.staff,
      "# 観測者," + site.observer,
      "# 等級," + site.grade,
      "# BM高," + site.bmHeight,
      "",
      headers.join(",")
    ];

    for (var i = 0; i < TOTAL; i++) {
      var row = computed[i];
      if (row) {
        var dp = (row.diff !== null && row.diff >= 0)
                 ? CALC.fmt(row.diff) : "";
        var dm = (row.diff !== null && row.diff < 0)
                 ? CALC.fmt(Math.abs(row.diff)) : "";
        lines.push([
          row.point || "", "",
          row.bs !== null ? CALC.fmt(row.bs) : "",
          row.fs !== null ? CALC.fmt(row.fs) : "",
          dp, dm, row.note || ""
        ].join(","));
      } else {
        lines.push(",,,,,,");
      }
    }

    lines.push("");
    lines.push("和,," +
      CALC.fmt(check.sumBS) + "," +
      CALC.fmt(check.sumFS) + ",," +
      CALC.fmt(check.sumPlus) + "," +
      CALC.fmt(check.sumMinus) + ",");
    lines.push("点検結果,," +
      (check.isOK ? "OK" : "不一致") + ",," +
      "ΣBS-ΣFS=" + CALC.fmt(check.diffBSFS) + ",,");

    var blob = new Blob(
      ["\uFEFF" + lines.join("\n")],
      { type: "text/csv;charset=utf-8;" }
    );
    var url = URL.createObjectURL(blob);
    var a   = document.createElement("a");
    a.href     = url;
    a.download = "水準測量手簿_" + site.name + "_" + site.date + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  }
};

function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}