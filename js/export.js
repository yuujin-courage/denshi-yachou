var EXPORT = {

  toReiwa: function(dateStr) {
    if (!dateStr) return { y: "", m: "", d: "" };
    var date  = new Date(dateStr);
    var y     = date.getFullYear();
    var m     = date.getMonth() + 1;
    var d     = date.getDate();
    var reiwa = y - 2018;
    return {
      y: reiwa > 0 ? String(reiwa) : "",
      m: String(m),
      d: String(d)
    };
  },

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
      ["番号", "距離(m)", "後視(m)", "前視(m)",
       "高低差(+)(m)", "高低差(-)(m)", "備考"]
    ];

    var TOTAL_ROWS = 33;
    for (var i = 0; i < TOTAL_ROWS; i++) {
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
        ws_data.push(["", "", "", "", "", "", ""]);
      }
    }

    ws_data.push([]);
    ws_data.push([
      "和", "",
      parseFloat(CALC.fmt(check.sumBS)),
      parseFloat(CALC.fmt(check.sumFS)),
      parseFloat(CALC.fmt(check.sumPlus)),
      parseFloat(CALC.fmt(check.sumMinus)), ""
    ]);
    ws_data.push(["点検", "", "", "", "", "", ""]);
    ws_data.push([
      "結果", "",
      check.isOK ? "OK" : "不一致", "",
      "ΣBS-ΣFS=" + CALC.fmt(check.diffBSFS),
      "", ""
    ]);

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

  toPDF: function(site, measurements) {
    var jsPDF    = window.jspdf.jsPDF;
    var doc      = new jsPDF({
      orientation: "portrait",
      unit:        "mm",
      format:      "a4"
    });

    var computed = CALC.compute(measurements, site.bmHeight);
    var check    = CALC.check(computed);
    var reiwa    = this.toReiwa(site.date);

    var PW     = 210;
    var LEFT   = 10;
    var RIGHT  = 200;
    var TOP    = 8;
    var ORANGE = [184, 115, 51];
    var BLACK  = [0, 0, 0];

    doc.setFont("helvetica", "normal");

    // タイトル
    doc.setFontSize(16);
    doc.setTextColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.setFont("helvetica", "bold");
    var titleChars   = ["水","準","測","量","手","簿"];
    var titleY       = TOP + 10;
    var titleStart   = 68;
    var charSpacing  = 10;
    for (var tc = 0; tc < titleChars.length; tc++) {
      doc.text(titleChars[tc], titleStart + tc * charSpacing, titleY);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.text("( )", RIGHT - 14, TOP + 11);

    // ヘッダー情報
    var hY1 = titleY + 8;
    doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
    doc.text("自　　標石", LEFT + 5, hY1);
    doc.setDrawColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.setLineWidth(0.3);
    doc.line(LEFT + 22, hY1 + 0.5, LEFT + 68, hY1 + 0.5);
    doc.text(site.from || "", LEFT + 24, hY1);

    doc.text("至　　標石", LEFT + 80, hY1);
    doc.line(LEFT + 97, hY1 + 0.5, LEFT + 140, hY1 + 0.5);
    doc.text(site.to || "", LEFT + 99, hY1);

    var instX = RIGHT - 45;
    doc.text("器  械", instX, hY1);
    doc.text(site.instrument || "", instX + 18, hY1);
    doc.text("標  尺", instX, hY1 + 5);
    doc.text(site.staff || "", instX + 18, hY1 + 5);
    doc.text("観測者", instX, hY1 + 10);
    doc.text(site.observer || "", instX + 18, hY1 + 10);

    var hY2 = hY1 + 10;
    doc.text("令和", LEFT + 5, hY2);
    doc.text(reiwa.y, LEFT + 14, hY2);
    doc.text("年", LEFT + 20, hY2);
    doc.text(reiwa.m, LEFT + 26, hY2);
    doc.text("月", LEFT + 32, hY2);
    doc.text(reiwa.d, LEFT + 38, hY2);
    doc.text("日", LEFT + 44, hY2);
    doc.text("天 候", LEFT + 55, hY2);
    doc.text(site.weather || "", LEFT + 66, hY2);
    doc.text("風", LEFT + 80, hY2);
    doc.text(site.wind || "", LEFT + 85, hY2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("工事名：" + (site.name || ""), LEFT, hY2 + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("等級：" + (site.grade || "") +
             "　BM高：" + site.bmHeight + " m",
             LEFT + 130, hY2 + 7);

    // テーブル定数
    var TABLE_TOP   = hY2 + 12;
    var TABLE_WIDTH = RIGHT - LEFT;
    var TOTAL_ROWS  = 33;
    var HEADER_H    = 10;
    var ROW_H       = 6.2;

    // 列定義
    var cols = [
      { label: "番  号", w: 18 },
      { label: "距  離", w: 16 },
      { label: "後  視", w: 28 },
      { label: "前  視", w: 28 },
      { label: "高  低  差", w: 56, sub: true },
      { label: "備  考",  w: 44 }
    ];

    // 列X座標
    var colX = [];
    var cx   = LEFT;
    for (var ci = 0; ci < cols.length; ci++) {
      colX.push(cx);
      cx += cols[ci].w;
    }

    // 高低差中央X（ここで定義）
    var diffMidX = colX[4] + cols[4].w / 2;

    // ヘッダー外枠
    doc.setDrawColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.setLineWidth(0.4);
    doc.rect(LEFT, TABLE_TOP, TABLE_WIDTH, HEADER_H + ROW_H, "S");

    // ヘッダーテキスト
    doc.setFontSize(8);
    doc.setTextColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.setFont("helvetica", "bold");

    var hMidY = TABLE_TOP + HEADER_H / 2 + 1;
    for (var hi = 0; hi < cols.length; hi++) {
      var hx = colX[hi] + cols[hi].w / 2;
      if (cols[hi].sub) {
        doc.text(cols[hi].label, hx, TABLE_TOP + 4, { align: "center" });
        var subW = cols[hi].w / 2;
        doc.text("+", colX[hi] + subW / 2,
                 TABLE_TOP + HEADER_H - 1, { align: "center" });
        doc.text("-", colX[hi] + subW + subW / 2,
                 TABLE_TOP + HEADER_H - 1, { align: "center" });
        doc.line(colX[hi] + subW, TABLE_TOP + HEADER_H / 2,
                 colX[hi] + subW, TABLE_TOP + HEADER_H + ROW_H);
        doc.line(colX[hi], TABLE_TOP + HEADER_H / 2,
                 colX[hi] + cols[hi].w, TABLE_TOP + HEADER_H / 2);
      } else {
        doc.text(cols[hi].label, hx, hMidY, { align: "center" });
      }
    }

    // 単位行
    doc.setFontSize(7);
    var unitY = TABLE_TOP + HEADER_H + ROW_H / 2 + 1;
    doc.text("m", colX[2] + cols[2].w / 2, unitY, { align: "center" });
    doc.text("m", colX[3] + cols[3].w / 2, unitY, { align: "center" });
    doc.text("m", colX[4] + cols[4].w / 4,     unitY, { align: "center" });
    doc.text("m", colX[4] + cols[4].w * 3 / 4, unitY, { align: "center" });

    // 列縦線（ヘッダー）
    for (var li = 1; li < cols.length; li++) {
      doc.line(colX[li], TABLE_TOP,
               colX[li], TABLE_TOP + HEADER_H + ROW_H);
    }
    doc.line(RIGHT, TABLE_TOP, RIGHT, TABLE_TOP + HEADER_H + ROW_H);
    doc.line(LEFT, TABLE_TOP + HEADER_H,
             RIGHT, TABLE_TOP + HEADER_H);

    // データ行
    var dataStartY = TABLE_TOP + HEADER_H + ROW_H;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);

    for (var ri = 0; ri < TOTAL_ROWS; ri++) {
      var rowY = dataStartY + ri * ROW_H;
      var row  = computed[ri] || null;

      doc.setDrawColor(ORANGE[0], ORANGE[1], ORANGE[2]);
      doc.setLineWidth(0.25);
      doc.line(LEFT, rowY + ROW_H, RIGHT, rowY + ROW_H);

      for (var vl = 1; vl < cols.length; vl++) {
        doc.line(colX[vl], rowY, colX[vl], rowY + ROW_H);
      }
      doc.line(diffMidX, rowY, diffMidX, rowY + ROW_H);
      doc.line(RIGHT, rowY, RIGHT, rowY + ROW_H);

      if (row) {
        var midY = rowY + ROW_H / 2 + 1.5;
        doc.text(row.point || "",
                 colX[0] + cols[0].w / 2, midY, { align: "center" });
        if (row.bs !== null && row.bs !== "") {
          doc.text(CALC.fmt(row.bs),
                   colX[2] + cols[2].w - 2, midY, { align: "right" });
        }
        if (row.fs !== null && row.fs !== "") {
          doc.text(CALC.fmt(row.fs),
                   colX[3] + cols[3].w - 2, midY, { align: "right" });
        }
        if (row.diff !== null && row.diff >= 0) {
          doc.text(CALC.fmt(row.diff),
                   diffMidX - 2, midY, { align: "right" });
        }
        if (row.diff !== null && row.diff < 0) {
          doc.text(CALC.fmt(Math.abs(row.diff)),
                   colX[4] + cols[4].w - 2, midY, { align: "right" });
        }
        if (row.note) {
          doc.text(row.note, colX[5] + 2, midY);
        }
      }
    }

    // 左端縦線
    doc.setLineWidth(0.4);
    doc.setDrawColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.line(LEFT, TABLE_TOP,
             LEFT, dataStartY + TOTAL_ROWS * ROW_H);

    // 和・点検・結果行
    var sumStartY = dataStartY + TOTAL_ROWS * ROW_H;
    var SUM_ROW_H = 6.5;
    var sumLabels = ["和", "点  検", "結  果"];

    for (var si = 0; si < sumLabels.length; si++) {
      var sRowY = sumStartY + si * SUM_ROW_H;

      doc.setDrawColor(ORANGE[0], ORANGE[1], ORANGE[2]);
      doc.setLineWidth(0.4);
      doc.rect(LEFT, sRowY, TABLE_WIDTH, SUM_ROW_H, "S");

      doc.setFontSize(8);
      doc.setTextColor(ORANGE[0], ORANGE[1], ORANGE[2]);
      doc.setFont("helvetica", "bold");
      doc.text(sumLabels[si],
               LEFT + 9, sRowY + SUM_ROW_H / 2 + 1.5,
               { align: "center" });

      doc.setTextColor(BLACK[0], BLACK[1], BLACK[2]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);

      var sMidY = sRowY + SUM_ROW_H / 2 + 1.5;

      if (si === 0) {
        doc.text(CALC.fmt(check.sumBS),
                 colX[2] + cols[2].w - 2, sMidY, { align: "right" });
        doc.text(CALC.fmt(check.sumFS),
                 colX[3] + cols[3].w - 2, sMidY, { align: "right" });
        doc.text(CALC.fmt(check.sumPlus),
                 diffMidX - 2, sMidY, { align: "right" });
        doc.text(CALC.fmt(check.sumMinus),
                 colX[4] + cols[4].w - 2, sMidY, { align: "right" });
        doc.setDrawColor(ORANGE[0], ORANGE[1], ORANGE[2]);
        doc.setLineWidth(0.3);
        doc.line(colX[1], sRowY, colX[2], sRowY + SUM_ROW_H);
        doc.line(colX[5], sRowY, RIGHT,   sRowY + SUM_ROW_H * 2);
      }
      if (si === 1) {
        doc.setDrawColor(ORANGE[0], ORANGE[1], ORANGE[2]);
        doc.setLineWidth(0.3);
        doc.line(colX[1], sRowY, colX[2], sRowY + SUM_ROW_H);
        doc.line(colX[2], sRowY, colX[3], sRowY + SUM_ROW_H);
      }
      if (si === 2) {
        var isOK = check.isOK;
        doc.setTextColor(
          isOK ? 30  : 200,
          isOK ? 132 : 0,
          isOK ? 73  : 0
        );
        doc.setFont("helvetica", "bold");
        doc.text(
          isOK
            ? "OK  ΣBS-ΣFS=" + CALC.fmt(check.diffBSFS)
            : "不一致  ΣBS-ΣFS=" + CALC.fmt(check.diffBSFS),
          colX[2] + 2, sMidY
        );
      }

      for (var sv = 1; sv < cols.length; sv++) {
        doc.setDrawColor(ORANGE[0], ORANGE[1], ORANGE[2]);
        doc.setLineWidth(0.25);
        doc.line(colX[sv], sRowY, colX[sv], sRowY + SUM_ROW_H);
      }
      doc.line(diffMidX, sRowY, diffMidX, sRowY + SUM_ROW_H);
    }

    // 右下S.P.
    var spY = sumStartY + 3 * SUM_ROW_H + 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.text("(        ) S.P.", RIGHT - 35, spY);

    // フッター
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "等級: " + site.grade +
      "  BM高: " + site.bmHeight + "m  " +
      "出力: " + new Date().toLocaleString("ja-JP"),
      PW / 2, 292, { align: "center" }
    );

    doc.save("水準測量手簿_" + site.name + "_" + site.date + ".pdf");
  },

  toCSV: function(site, measurements) {
    var computed = CALC.compute(measurements, site.bmHeight);
    var check    = CALC.check(computed);
    var reiwa    = this.toReiwa(site.date);

    var headers = [
      "番号","距離(m)","後視(m)","前視(m)",
      "高低差(+)(m)","高低差(-)(m)","備考"
    ];

    var TOTAL_ROWS = 33;
    var rows       = [];
    for (var i = 0; i < TOTAL_ROWS; i++) {
      var row = computed[i];
      if (row) {
        var dp = (row.diff !== null && row.diff >= 0)
                 ? CALC.fmt(row.diff) : "";
        var dm = (row.diff !== null && row.diff < 0)
                 ? CALC.fmt(Math.abs(row.diff)) : "";
        rows.push([
          row.point || "", "",
          row.bs !== null ? CALC.fmt(row.bs) : "",
          row.fs !== null ? CALC.fmt(row.fs) : "",
          dp, dm, row.note || ""
        ]);
      } else {
        rows.push(["", "", "", "", "", "", ""]);
      }
    }

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

    for (var ri = 0; ri < rows.length; ri++) {
      lines.push(rows[ri].join(","));
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

    var csv  = lines.join("\n");
    var blob = new Blob(
      ["\uFEFF" + csv],
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