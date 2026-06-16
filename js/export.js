// ══════════════════════════════════════
// export.js - Excel・PDF・CSV出力
// ══════════════════════════════════════

const EXPORT = {

  // ── 西暦→令和変換 ──────────────────
  toReiwa(dateStr) {
    if (!dateStr) return { y: '', m: '', d: '' };
    const date = new Date(dateStr);
    const y    = date.getFullYear();
    const m    = date.getMonth() + 1;
    const d    = date.getDate();
    const reiwa = y - 2018;
    return {
      y: reiwa > 0 ? String(reiwa) : '',
      m: String(m),
      d: String(d),
    };
  },

  // ── Excel出力 ──────────────────────
  toExcel(site, measurements) {
    const computed = CALC.compute(measurements, site.bmHeight);
    const check    = CALC.check(computed);
    const reiwa    = this.toReiwa(site.date);

    const ws_data = [
      ['水準測量手簿'],
      [],
      ['工事名', site.name, '', '路線名', site.route || ''],
      ['自（標石）', site.from, '', '至（標石）', site.to],
      [
        '日付',
        `令和${reiwa.y}年${reiwa.m}月${reiwa.d}日`,
        '', '天候', site.weather, '風', site.wind,
      ],
      ['器械', site.instrument, '', '標尺', site.staff],
      ['観測者', site.observer, '', '等級', site.grade],
      ['BM高（m）', site.bmHeight],
      [],
      ['番号','距離(m)','後視(m)','前視(m)',
       '高低差(+)(m)','高低差(-)(m)','備考'],
    ];

    // データ行（最低33行）
    const TOTAL_ROWS = 33;
    for (let i = 0; i < TOTAL_ROWS; i++) {
      const row = computed[i];
      if (row) {
        const dp = (row.diff !== null && row.diff >= 0)
                   ? parseFloat(CALC.fmt(row.diff)) : '';
        const dm = (row.diff !== null && row.diff < 0)
                   ? parseFloat(CALC.fmt(Math.abs(row.diff))) : '';
        ws_data.push([
          row.point || '',
          '',
          row.bs !== null ? parseFloat(CALC.fmt(row.bs)) : '',
          row.fs !== null ? parseFloat(CALC.fmt(row.fs)) : '',
          dp, dm,
          row.note || '',
        ]);
      } else {
        ws_data.push(['', '', '', '', '', '', '']);
      }
    }

    // 和・点検・結果行
    ws_data.push([]);
    ws_data.push([
      '和', '',
      parseFloat(CALC.fmt(check.sumBS)),
      parseFloat(CALC.fmt(check.sumFS)),
      parseFloat(CALC.fmt(check.sumPlus)),
      parseFloat(CALC.fmt(check.sumMinus)), '',
    ]);
    ws_data.push([
      '点検', '', '', '', '', '', '',
    ]);
    ws_data.push([
      '結果', '',
      check.isOK ? 'OK' : '不一致', '',
      'ΣBS-ΣFS=' + CALC.fmt(check.diffBSFS),
      '', '',
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [
      {wch:12},{wch:8},{wch:10},{wch:10},
      {wch:10},{wch:10},{wch:20},
    ];
    XLSX.utils.book_append_sheet(wb, ws, '水準測量手簿');
    XLSX.writeFile(wb,
      `水準測量手簿_${site.name}_${site.date}.xlsx`);
  },

  // ── PDF出力（紙の様式に完全一致） ──
  toPDF(site, measurements) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit:        'mm',
      format:      'a4',
    });

    const computed = CALC.compute(measurements, site.bmHeight);
    const check    = CALC.check(computed);
    const reiwa    = this.toReiwa(site.date);

    // ── 定数 ──
    const PW     = 210;   // ページ幅
    const PH     = 297;   // ページ高さ
    const LEFT   = 10;    // 左余白
    const RIGHT  = 200;   // 右端
    const TOP    = 8;     // 上余白
    const ORANGE = [184, 115, 51];
    const BLACK  = [0, 0, 0];
    const WHITE  = [255, 255, 255];

    // ── フォント ──
    doc.setFont('helvetica', 'normal');

    // ══════════════════════════════════
    // タイトル
    // ══════════════════════════════════
    doc.setFontSize(16);
    doc.setTextColor(...ORANGE);
    doc.setFont('helvetica', 'bold');

    // 文字間隔を空けてタイトルを描画
    const titleChars = ['水','準','測','量','手','簿'];
    const titleY     = TOP + 10;
    const titleStart = 68;
    const charSpacing = 10;
    titleChars.forEach((ch, i) => {
      doc.text(ch, titleStart + i * charSpacing, titleY);
    });

    // 右上の山型記号
    doc.setFontSize(8);
    doc.setTextColor(...ORANGE);
    doc.text('⌇⌇⌇', RIGHT - 12, TOP + 6);
    doc.text('(　　)', RIGHT - 14, TOP + 11);

    // ══════════════════════════════════
    // ヘッダー情報（自〜至・日付・器械）
    // ══════════════════════════════════
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...BLACK);

    // 自　標石
    const hY1 = titleY + 8;
    doc.text('自', LEFT + 5, hY1);
    doc.text('標 石', LEFT + 12, hY1);
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(0.3);
    doc.line(LEFT + 22, hY1 + 0.5, LEFT + 68, hY1 + 0.5);
    doc.setTextColor(...BLACK);
    doc.text(site.from || '', LEFT + 24, hY1);

    // 至　標石
    doc.text('至', LEFT + 80, hY1);
    doc.text('標 石', LEFT + 87, hY1);
    doc.line(LEFT + 97, hY1 + 0.5, LEFT + 140, hY1 + 0.5);
    doc.text(site.to || '', LEFT + 99, hY1);

    // 器械・標尺・観測者（右上）
    const instX = RIGHT - 45;
    doc.text(`器  械`, instX, hY1);
    doc.text(site.instrument || '', instX + 18, hY1);
    doc.text(`標  尺`, instX, hY1 + 5);
    doc.text(site.staff || '', instX + 18, hY1 + 5);
    doc.text(`観測者`, instX, hY1 + 10);
    doc.text(site.observer || '', instX + 18, hY1 + 10);

    // 令和　年　月　日　天候　風
    const hY2 = hY1 + 10;
    doc.text('令和', LEFT + 5, hY2);
    doc.text(reiwa.y, LEFT + 14, hY2);
    doc.text('年', LEFT + 20, hY2);
    doc.text(reiwa.m, LEFT + 26, hY2);
    doc.text('月', LEFT + 32, hY2);
    doc.text(reiwa.d, LEFT + 38, hY2);
    doc.text('日', LEFT + 44, hY2);
    doc.text('天 候', LEFT + 55, hY2);
    doc.text(site.weather || '', LEFT + 66, hY2);
    doc.text('風', LEFT + 80, hY2);
    doc.text(site.wind || '', LEFT + 85, hY2);

    // ══════════════════════════════════
    // テーブル本体（手書き様式）
    // ══════════════════════════════════
    const TABLE_TOP    = hY2 + 5;
    const TABLE_LEFT   = LEFT;
    const TABLE_RIGHT  = RIGHT;
    const TABLE_WIDTH  = TABLE_RIGHT - TABLE_LEFT;
    const TOTAL_ROWS   = 33;
    const HEADER_H     = 10;  // ヘッダー行の高さ
    const ROW_H        = 6.5; // データ行の高さ

    // ── 列定義 ──
    // 番号・距離・後視・前視・高低差(+)・高低差(-)・備考
    const cols = [
      { label: '番  号', w: 18 },
      { label: '距  離', w: 16 },
      { label: '後  視', w: 28 },
      { label: '前  視', w: 28 },
      { label: '高  低  差', w: 56, sub: true },
      { label: '備  考', w: 44 },
    ];

    // 列のX座標を計算
    let cx = TABLE_LEFT;
    const colX = [];
    cols.forEach(col => {
      colX.push(cx);
      cx += col.w;
    });

    // ── ヘッダー行描画 ──
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(0.4);
    doc.setFillColor(...ORANGE);

    // ヘッダー背景なし・枠線のみ
    // 外枠
    doc.rect(TABLE_LEFT, TABLE_TOP,
             TABLE_WIDTH, HEADER_H + ROW_H, 'S');

    // ヘッダーテキスト
    doc.setFontSize(8);
    doc.setTextColor(...ORANGE);
    doc.setFont('helvetica', 'bold');

    // 各列ヘッダー
    const hMidY = TABLE_TOP + HEADER_H / 2 + 1;
    cols.forEach((col, i) => {
      const x = colX[i] + col.w / 2;
      if (col.sub) {
        // 高低差は上段・下段に分ける
        doc.text(col.label, x, TABLE_TOP + 4, { align: 'center' });
        // 下段：+と-
        const subW = col.w / 2;
        doc.text('+', colX[i] + subW / 2,
                 TABLE_TOP + HEADER_H - 1, { align: 'center' });
        doc.text('-', colX[i] + subW + subW / 2,
                 TABLE_TOP + HEADER_H - 1, { align: 'center' });
        // 縦線（高低差の中央）
        doc.line(
          colX[i] + subW, TABLE_TOP + HEADER_H / 2,
          colX[i] + subW, TABLE_TOP + HEADER_H + ROW_H
        );
        // 横線（高低差の上下分割）
        doc.line(
          colX[i], TABLE_TOP + HEADER_H / 2,
          colX[i] + col.w, TABLE_TOP + HEADER_H / 2
        );
      } else {
        doc.text(col.label, x, hMidY, { align: 'center' });
      }
    });

    // 単位行（m表示）
    doc.setFontSize(7);
    const unitY = TABLE_TOP + HEADER_H + ROW_H / 2 + 1;
    doc.text('m', colX[2] + cols[2].w / 2, unitY, { align: 'center' });
    doc.text('m', colX[3] + cols[3].w / 2, unitY, { align: 'center' });
    doc.text('m', colX[4] + cols[4].w / 4, unitY, { align: 'center' });
    doc.text('m', colX[4] + cols[4].w * 3 / 4, unitY, { align: 'center' });

    // 列の縦線（ヘッダー）
    cols.forEach((col, i) => {
      if (i === 0) return;
      doc.line(
        colX[i], TABLE_TOP,
        colX[i], TABLE_TOP + HEADER_H + ROW_H
      );
    });
    // 右端
    doc.line(TABLE_RIGHT, TABLE_TOP,
             TABLE_RIGHT, TABLE_TOP + HEADER_H + ROW_H);

    // ヘッダーとデータの境界線
    doc.line(TABLE_LEFT, TABLE_TOP + HEADER_H,
             TABLE_RIGHT, TABLE_TOP + HEADER_H);

    // ── データ行描画 ──
    const dataStartY = TABLE_TOP + HEADER_H + ROW_H;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...BLACK);

    for (let i = 0; i < TOTAL_ROWS; i++) {
      const rowY   = dataStartY + i * ROW_H;
      const row    = computed[i] || null;

      // 行の横線
      doc.setDrawColor(...ORANGE);
      doc.setLineWidth(0.25);
      doc.line(TABLE_LEFT, rowY + ROW_H,
               TABLE_RIGHT, rowY + ROW_H);

      // 列の縦線
      cols.forEach((col, ci) => {
        if (ci === 0) return;
        doc.line(colX[ci], rowY, colX[ci], rowY + ROW_H);
      });
      // 高低差中央縦線
      const diffMidX = colX[4] + cols[4].w / 2;
      doc.line(diffMidX, rowY, diffMidX, rowY + ROW_H);
      // 右端縦線
      doc.line(TABLE_RIGHT, rowY, TABLE_RIGHT, rowY + ROW_H);

      // データ描画
      if (row) {
        const midY = rowY + ROW_H / 2 + 1.5;

        // 番号
        doc.text(
          row.point || '',
          colX[0] + cols[0].w / 2, midY,
          { align: 'center' }
        );

        // 後視
        if (row.bs !== null && row.bs !== '') {
          doc.text(
            CALC.fmt(row.bs),
            colX[2] + cols[2].w - 2, midY,
            { align: 'right' }
          );
        }

        // 前視
        if (row.fs !== null && row.fs !== '') {
          doc.text(
            CALC.fmt(row.fs),
            colX[3] + cols[3].w - 2, midY,
            { align: 'right' }
          );
        }

        // 高低差（+）
        if (row.diff !== null && row.diff >= 0) {
          doc.text(
            CALC.fmt(row.diff),
            diffMidX - 2, midY,
            { align: 'right' }
          );
        }

        // 高低差（-）
        if (row.diff !== null && row.diff < 0) {
          doc.text(
            CALC.fmt(Math.abs(row.diff)),
            colX[4] + cols[4].w - 2, midY,
            { align: 'right' }
          );
        }

        // 備考
        if (row.note) {
          doc.text(
            row.note,
            colX[5] + 2, midY
          );
        }
      }
    }

    // ── 左端縦線 ──
    doc.setLineWidth(0.4);
    doc.setDrawColor(...ORANGE);
    doc.line(
      TABLE_LEFT,
      TABLE_TOP,
      TABLE_LEFT,
      dataStartY + TOTAL_ROWS * ROW_H
    );

    // ══════════════════════════════════
    // 和・点検・結果行
    // ══════════════════════════════════
    const sumStartY = dataStartY + TOTAL_ROWS * ROW_H;
    const SUM_ROW_H = 6.5;

    const sumLabels = ['和', '点  検', '結  果'];
    sumLabels.forEach((lbl, si) => {
      const rowY = sumStartY + si * SUM_ROW_H;

      // 行の枠線
      doc.setDrawColor(...ORANGE);
      doc.setLineWidth(0.4);
      doc.rect(TABLE_LEFT, rowY, TABLE_WIDTH, SUM_ROW_H, 'S');

      // ラベル
      doc.setFontSize(8);
      doc.setTextColor(...ORANGE);
      doc.setFont('helvetica', 'bold');
      doc.text(lbl, TABLE_LEFT + 9, rowY + SUM_ROW_H / 2 + 1.5,
               { align: 'center' });

      // データ
      doc.setTextColor(...BLACK);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);

      const midY = rowY + SUM_ROW_H / 2 + 1.5;

      if (si === 0) {
        // 和行
        doc.text(CALC.fmt(check.sumBS),
                 colX[2] + cols[2].w - 2, midY,
                 { align: 'right' });
        doc.text(CALC.fmt(check.sumFS),
                 colX[3] + cols[3].w - 2, midY,
                 { align: 'right' });
        doc.text(CALC.fmt(check.sumPlus),
                 diffMidX - 2, midY,
                 { align: 'right' });
        doc.text(CALC.fmt(check.sumMinus),
                 colX[4] + cols[4].w - 2, midY,
                 { align: 'right' });

        // 斜線（番号・距離列）
        doc.setDrawColor(...ORANGE);
        doc.setLineWidth(0.3);
        doc.line(colX[1], rowY,
                 colX[2], rowY + SUM_ROW_H);
        // 高低差列の斜線
        doc.line(colX[5], rowY,
                 TABLE_RIGHT, rowY + SUM_ROW_H * 2);
      }

      if (si === 1) {
        // 点検行（斜線）
        doc.setDrawColor(...ORANGE);
        doc.setLineWidth(0.3);
        doc.line(colX[1], rowY,
                 colX[2], rowY + SUM_ROW_H);
        doc.line(colX[2], rowY,
                 colX[3], rowY + SUM_ROW_H);
      }

      if (si === 2) {
        // 結果行
        const isOK = check.isOK;
        doc.setTextColor(isOK ? 30 : 200,
                         isOK ? 132 : 0,
                         isOK ? 73  : 0);
        doc.setFont('helvetica', 'bold');
        doc.text(
          isOK
            ? `OK  ΣBS-ΣFS=${CALC.fmt(check.diffBSFS)}`
            : `不一致  ΣBS-ΣFS=${CALC.fmt(check.diffBSFS)}`,
          colX[2] + 2, midY
        );
      }

      // 縦線
      cols.forEach((col, ci) => {
        if (ci === 0) return;
        doc.setDrawColor(...ORANGE);
        doc.setLineWidth(0.25);
        doc.line(colX[ci], rowY, colX[ci], rowY + SUM_ROW_H);
      });
      doc.line(diffMidX, rowY, diffMidX, rowY + SUM_ROW_H);
    });

    // ══════════════════════════════════
    // 右下「（　）S.P.」
    // ══════════════════════════════════
    const spY = sumStartY + 3 * SUM_ROW_H + 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...ORANGE);
    doc.text('(　　　) S.P.', TABLE_RIGHT - 35, spY);

    // ══════════════════════════════════
    // フッター（等級・BM高・出力日時）
    // ══════════════════════════════════
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `等級: ${site.grade}  BM高: ${site.bmHeight}m  ` +
      `出力: ${new Date().toLocaleString('ja-JP')}`,
      PW / 2, PH - 5, { align: 'center' }
    );

    doc.save(
      `水準測量手簿_${site.name}_${site.date}.pdf`
    );
  },

  // ── CSV出力 ────────────────────────
  toCSV(site, measurements) {
    const computed = CALC.compute(measurements, site.bmHeight);
    const check    = CALC.check(computed);
    const reiwa    = this.toReiwa(site.date);

    const headers = [
      '番号','距離(m)','後視(m)','前視(m)',
      '高低差(+)(m)','高低差(-)(m)','備考',
    ];

    const TOTAL_ROWS = 33;
    const rows = [];
    for (let i = 0; i < TOTAL_ROWS; i++) {
      const row = computed[i];
      if (row) {
        const dp = (row.diff !== null && row.diff >= 0)
                   ? CALC.fmt(row.diff) : '';
        const dm = (row.diff !== null && row.diff < 0)
                   ? CALC.fmt(Math.abs(row.diff)) : '';
        rows.push([
          row.point || '', '',
          row.bs !== null ? CALC.fmt(row.bs) : '',
          row.fs !== null ? CALC.fmt(row.fs) : '',
          dp, dm, row.note || '',
        ]);
      } else {
        rows.push(['', '', '', '', '', '', '']);
      }
    }

    const csv = [
      `# 水準測量手簿`,
      `# 工事名,${site.name}`,
      `# 路線名,${site.route || ''}`,
      `# 自,${site.from},至,${site.to}`,
      `# 日付,令和${reiwa.y}年${reiwa.m}月${reiwa.d}日`,
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
      `${CALC.fmt(check.sumFS)},` +
      `${CALC.fmt(check.sumPlus)},` +
      `${CALC.fmt(check.sumMinus)},`,
      `点検結果,,${check.isOK ? 'OK' : '不一致'},,` +
      `ΣBS-ΣFS=${CALC.fmt(check.diffBSFS)},,`,
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