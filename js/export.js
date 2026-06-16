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

  // ── PDF出力（水準測量手簿様式） ────
  toPDF(site, measurements) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const computed = CALC.compute(measurements, site.bmHeight);
    const check    = CALC.check(computed);

    const pageW  = 210;
    const left   = 12;
    const right  = 198;
    const orange = [184, 115, 51];
    const black  = [0, 0, 0];
    const white  = [255, 255, 255];

    // ── フォント設定 ──
    doc.setFont('helvetica', 'normal');

    // ══════════════════════════
    // タイトル
    // ══════════════════════════
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...orange);
    doc.text('Water Level Survey Field Book',
             pageW / 2, 16, { align: 'center' });
    doc.setFontSize(11);
    doc.text('- Leveling Field Notes -',
             pageW / 2, 23, { align: 'center' });

    // ══════════════════════════
    // ヘッダー情報
    // ══════════════════════════
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...black);

    // 自〜至
    doc.text('From:', left, 32);
    doc.setFont('helvetica', 'bold');
    doc.text(site.from || '', left + 14, 32);
    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(...orange);
    doc.setLineWidth(0.4);
    doc.line(left + 13, 32.5, left + 70, 32.5);

    doc.text('To:', left + 80, 32);
    doc.setFont('helvetica', 'bold');
    doc.text(site.to || '', left + 90, 32);
    doc.setFont('helvetica', 'normal');
    doc.line(left + 89, 32.5, left + 150, 32.5);

    // 日付・天候・風
    const dateStr = (site.date || '').replace(/-/g, '/');
    doc.text(`Date: ${dateStr}`, left, 39);
    doc.text(`Weather: ${site.weather || ''}`, left + 55, 39);
    doc.text(`Wind: ${site.wind || ''}`, left + 115, 39);

    // 器械・標尺・観測者
    doc.text(`Instrument: ${site.instrument || ''}`, left, 45);
    doc.text(`Staff: ${site.staff || ''}`, left + 75, 45);
    doc.text(`Observer: ${site.observer || ''}`, left + 130, 45);

    // 等級・BM高
    doc.text(`Grade: ${site.grade || ''}`, left, 51);
    doc.text(`BM Elev.: ${site.bmHeight} m`, left + 75, 51);

    // 工事名
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Project: ${site.name || ''}`, left, 57);
    if (site.route) {
      doc.text(`Route: ${site.route}`, left + 120, 57);
    }

    // 区切り線
    doc.setDrawColor(...orange);
    doc.setLineWidth(0.6);
    doc.line(left, 60, right, 60);

    // ══════════════════════════
    // テーブル（手簿様式）
    // ══════════════════════════
    const headers = [[
      'No.',
      'Dist.\n(m)',
      'BS\n(m)',
      'FS\n(m)',
      'Diff(+)\n(m)',
      'Diff(-)\n(m)',
      'Note',
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
      'SUM', '',
      CALC.fmt(check.sumBS),
      CALC.fmt(check.sumFS),
      CALC.fmt(check.sumPlus),
      CALC.fmt(check.sumMinus),
      '',
    ]);

    // 点検行
    body.push([
      'Check', '', '', '',
      { content: check.isOK ? 'OK' : 'NG', colSpan: 2 },
      `Diff=${CALC.fmt(check.diffBSFS)}`,
    ]);

    doc.autoTable({
      head: headers,
      body: body,
      startY: 62,
      styles: {
        font:        'helvetica',
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
        font:       'helvetica',
        fontStyle:  'bold',
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
          data.cell.styles.fillColor = [253, 245, 230];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = orange;
        }
        if (data.row.index === chkIdx) {
          data.cell.styles.fillColor = check.isOK
            ? [213, 245, 227] : [253, 220, 215];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = check.isOK
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

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...black);
    doc.text(
      `Check: SBS=${CALC.fmt(check.sumBS)}  ` +
      `SFS=${CALC.fmt(check.sumFS)}  ` +
      `Diff=${CALC.fmt(check.diffBSFS)}  ` +
      `S(+)=${CALC.fmt(check.sumPlus)}  ` +
      `S(-)=${CALC.fmt(check.sumMinus)}  ` +
      `Result: ${check.isOK ? 'OK' : 'NG'}`,
      left, finalY + 5
    );

    const tolK = CALC.TOLERANCE[site.grade] || 10;
    doc.text(
      `Grade: ${site.grade}  ` +
      `Tolerance: +/-${tolK}*sqrt(S) mm  ` +
      `(S = Route Length km)`,
      left, finalY + 10
    );

    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Denshi-Yachou System  ` +
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