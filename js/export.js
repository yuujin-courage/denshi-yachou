// ══════════════════════════════════════
// export.js - Excel・PDF・CSV出力
// ══════════════════════════════════════

const EXPORT = {

  // ── Excel出力 ──────────────────────
  toExcel(site, measurements) {
    const computed = CALC.compute(measurements, site.bmHeight);
    const check    = CALC.check(computed);

    const ws_data = [
      ['水準測量手簿'],
      [],
      ['工事名', site.name, '', '路線名', site.route || ''],
      ['自（標石）', site.from, '', '至（標石）', site.to],
      ['日付', site.date, '', '天候', site.weather, '風', site.wind],
      ['器械', site.instrument, '', '標尺', site.staff],
      ['観測者', site.observer, '', '等級', site.grade],
      ['BM高（m）', site.bmHeight],
      [],
      ['番号','距離','後視(BS)','前視(FS)',
       '器械高(IH)','地盤高(GH)','高低差(+)','高低差(-)','備考'],
    ];

    computed.forEach(row => {
      const dp = (row.diff !== null && row.diff >= 0)
                 ? parseFloat(CALC.fmt(row.diff)) : '';
      const dm = (row.diff !== null && row.diff < 0)
                 ? parseFloat(CALC.fmt(Math.abs(row.diff))) : '';
      ws_data.push([
        row.point || '', '',
        row.bs !== null ? parseFloat(CALC.fmt(row.bs)) : '',
        row.fs !== null ? parseFloat(CALC.fmt(row.fs)) : '',
        row.ih !== null ? parseFloat(CALC.fmt(row.ih)) : '',
        row.gh !== null ? parseFloat(CALC.fmt(row.gh)) : '',
        dp, dm, row.note || '',
      ]);
    });

    ws_data.push([]);
    ws_data.push([
      '和','',
      parseFloat(CALC.fmt(check.sumBS)),
      parseFloat(CALC.fmt(check.sumFS)),
      '','',
      parseFloat(CALC.fmt(check.sumPlus)),
      parseFloat(CALC.fmt(check.sumMinus)),'',
    ]);
    ws_data.push([
      '点検結果','',
      check.isOK ? 'OK' : '不一致','',
      'ΣBS-ΣFS='+CALC.fmt(check.diffBSFS),
      '','','','',
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [
      {wch:14},{wch:8},{wch:10},{wch:10},
      {wch:12},{wch:12},{wch:10},{wch:10},{wch:20},
    ];
    XLSX.utils.book_append_sheet(wb, ws, '水準測量手簿');
    XLSX.writeFile(wb,
      `水準測量手簿_${site.name}_${site.date}.xlsx`);
  },

  // ── PDF出力（水準測量手簿様式・日本語対応） ──
  toPDF(site, measurements) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // ── 日本語フォント埋め込み（游明朝） ──
    doc.addFileToVFS('YuMincho.ttf', NOTO_SANS_JP);
    doc.addFont('YuMincho.ttf', 'YuMincho', 'normal');
    doc.setFont('YuMincho', 'normal');

    const computed = CALC.compute(measurements, site.bmHeight);
    const check    = CALC.check(computed);

    const pageW  = 210;
    const left   = 12;
    const right  = 198;
    const orange = [184, 115, 51];
    const black  = [0, 0, 0];
    const white  = [255, 255, 255];

    // ══════════════════════════
    // タイトル
    // ══════════════════════════
    doc.setFont('YuMincho', 'normal');
    doc.setFontSize(18);
    doc.setTextColor(...orange);
    doc.text('水 準 測 量 手 簿',
             pageW / 2, 16, { align: 'center' });

    // ══════════════════════════
    // ヘッダー情報
    // ══════════════════════════
    doc.setFont('YuMincho', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...black);

    // 自〜至
    doc.text('自　　標石', left, 26);
    doc.setFont('YuMincho', 'normal');
    doc.text(site.from || '', left + 20, 26);
    doc.setDrawColor(...orange);
    doc.setLineWidth(0.4);
    doc.line(left + 18, 26.5, left + 65, 26.5);

    doc.text('至　　標石', left + 80, 26);
    doc.text(site.to || '', left + 100, 26);
    doc.line(left + 98, 26.5, left + 145, 26.5);

    // 日付・天候・風
    const mo = (site.date || '').substring(5, 7);
    const dy = (site.date || '').substring(8, 10);
    doc.text(
      `　　　年　${mo}月　${dy}日`,
      left, 34
    );
    doc.text(`天候　${site.weather || ''}`, left + 60, 34);
    doc.text(`風　${site.wind || ''}`, left + 100, 34);

    // 器械・標尺・観測者（右上）
    doc.text(`器　械　${site.instrument || ''}`, left + 130, 26);
    doc.text(`標　尺　${site.staff || ''}`,      left + 130, 31);
    doc.text(`観測者　${site.observer || ''}`,   left + 130, 36);

    // 工事名・等級
    doc.setFontSize(9);
    doc.text(`工事名：${site.name || ''}`, left, 42);
    doc.setFontSize(8);
    doc.text(`路線名：${site.route || ''}`, left + 95, 42);
    doc.text(
      `等級：${site.grade || ''}　BM高：${site.bmHeight} m`,
      left + 130, 42
    );

    // 区切り線
    doc.setDrawColor(...orange);
    doc.setLineWidth(0.5);
    doc.line(left, 45, right, 45);

    // ══════════════════════════
    // テーブル（手簿様式）
    // ══════════════════════════
    const headers = [[
      '番　号',
      '距　離\n(m)',
      '後　視\n(m)',
      '前　視\n(m)',
      '高低差(+)\n(m)',
      '高低差(-)\n(m)',
      '備　考',
    ]];

    const body = computed.map(row => {
      const dp = (row.diff !== null && row.diff >= 0)
                 ? CALC.fmt(row.diff) : '';
      const dm = (row.diff !== null && row.diff < 0)
                 ? CALC.fmt(Math.abs(row.diff)) : '';
      return [
        row.point || '',
        '',
        row.bs !== null ? CALC.fmt(row.bs) : '',
        row.fs !== null ? CALC.fmt(row.fs) : '',
        dp,
        dm,
        row.note || '',
      ];
    });

    // 和行
    body.push([
      '和', '',
      CALC.fmt(check.sumBS),
      CALC.fmt(check.sumFS),
      CALC.fmt(check.sumPlus),
      CALC.fmt(check.sumMinus),
      '',
    ]);

    // 点検結果行
    body.push([
      '点検結果', '', '', '',
      { content: check.isOK ? 'OK' : '不一致', colSpan: 2 },
      `差=${CALC.fmt(check.diffBSFS)}`,
    ]);

    doc.autoTable({
      head: headers,
      body: body,
      startY: 47,
      styles: {
        font:        'YuMincho',
        fontStyle:   'normal',
        fontSize:    8.5,
        halign:      'center',
        valign:      'middle',
        cellPadding: 2.5,
        lineColor:   orange,
        lineWidth:   0.35,
        textColor:   black,
      },
      headStyles: {
        font:       'YuMincho',
        fontStyle:  'normal',
        fillColor:  orange,
        textColor:  white,
        fontSize:   8.5,
        halign:     'center',
        valign:     'middle',
      },
      alternateRowStyles: {
        fillColor: [255, 253, 245],
      },
      didParseCell(data) {
        const sumIdx = body.length - 2;
        const chkIdx = body.length - 1;
        if (data.row.index === sumIdx) {
          data.cell.styles.fillColor  = [253, 245, 230];
          data.cell.styles.fontStyle  = 'normal';
          data.cell.styles.textColor  = orange;
        }
        if (data.row.index === chkIdx) {
          data.cell.styles.fillColor = check.isOK
            ? [213, 245, 227] : [253, 220, 215];
          data.cell.styles.fontStyle  = 'normal';
          data.cell.styles.textColor  = check.isOK
            ? [30, 132, 73] : [146, 43, 33];
        }
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 18 },
        2: { cellWidth: 28 },
        3: { cellWidth: 28 },
        4: { cellWidth: 24 },
        5: { cellWidth: 24 },
        6: { cellWidth: 34 },
      },
      margin: { left: left, right: 12 },
      tableLineColor: orange,
      tableLineWidth: 0.4,
    });

    // ══════════════════════════
    // フッター
    // ══════════════════════════
    const finalY = doc.lastAutoTable.finalY + 5;
    doc.setDrawColor(...orange);
    doc.setLineWidth(0.3);
    doc.line(left, finalY, right, finalY);

    doc.setFont('YuMincho', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...black);
    doc.text(
      `点検：ΣBS=${CALC.fmt(check.sumBS)}　` +
      `ΣFS=${CALC.fmt(check.sumFS)}　` +
      `差=${CALC.fmt(check.diffBSFS)}　` +
      `Σ(+)=${CALC.fmt(check.sumPlus)}　` +
      `Σ(-)=${CALC.fmt(check.sumMinus)}　` +
      `結果：${check.isOK ? 'OK' : '不一致'}`,
      left, finalY + 5
    );

    const tolK = CALC.TOLERANCE[site.grade] || 10;
    doc.text(
      `等級：${site.grade}　` +
      `許容誤差：±${tolK}√S mm（S=路線長km）`,
      left, finalY + 10
    );

    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `電子野帳システム　出力日時：` +
      `${new Date().toLocaleString('ja-JP')}`,
      pageW / 2, 290, { align: 'center' }
    );

    doc.save(
      `水準測量手簿_${site.name}_${site.date}.pdf`
    );
  },

  // ── CSV出力 ────────────────────────
  toCSV(site, measurements) {
    const computed = CALC.compute(measurements, site.bmHeight);
    const check    = CALC.check(computed);

    const headers = [
      '番号','距離','後視(BS)','前視(FS)',
      '器械高(IH)','地盤高(GH)','高低差(+)','高低差(-)','備考',
    ];

    const rows = computed.map(row => {
      const dp = (row.diff !== null && row.diff >= 0)
                 ? CALC.fmt(row.diff) : '';
      const dm = (row.diff !== null && row.diff < 0)
                 ? CALC.fmt(Math.abs(row.diff)) : '';
      return [
        row.point || '', '',
        row.bs !== null ? CALC.fmt(row.bs) : '',
        row.fs !== null ? CALC.fmt(row.fs) : '',
        row.ih !== null ? CALC.fmt(row.ih) : '',
        row.gh !== null ? CALC.fmt(row.gh) : '',
        dp, dm, row.note || '',
      ];
    });

    const csv = [
      `# 水準測量手簿`,
      `# 工事名,${site.name}`,
      `# 路線名,${site.route || ''}`,
      `# 自,${site.from},至,${site.to}`,
      `# 日付,${site.date}`,
      `# 天候,${site.weather},風,${site.wind}`,
      `# 器械,${site.instrument},標尺,${site.staff}`,
      `# 観測者,${site.observer}`,
      `# 等級,${site.grade}`,
      `# BM高,${site.bmHeight}`,
      '',
      headers.join(','),
      ...rows.map(r => r.join(',')),
      '',
      `和,,${CALC.fmt(check.sumBS)},` +
      `${CALC.fmt(check.sumFS)},,` +
      `${CALC.fmt(check.sumPlus)},` +
      `${CALC.fmt(check.sumMinus)},`,
      `点検結果,,${check.isOK ? 'OK' : '不一致'},,` +
      `ΣBS-ΣFS=${CALC.fmt(check.diffBSFS)},,,,`,
    ].join('\n');

    const blob = new Blob(
      ['\uFEFF' + csv],
      { type: 'text/csv;charset=utf-8;' }
    );
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download =
      `水準測量手簿_${site.name}_${site.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};