// ══════════════════════════════════════
// calc.js - 水準測量 自動計算ロジック
// ══════════════════════════════════════

const CALC = {

  // 許容誤差係数（等級別）
  TOLERANCE: {
    '1級水準測量': 2.5,
    '2級水準測量': 5.0,
    '3級水準測量': 10.0,
    '4級水準測量': 20.0,
    '簡易水準測量': 40.0,
  },

  // ── 器械高・地盤高の計算 ──────────────
  // measurements: 測量データの配列
  // bmHeight: 出発点BM高（m）
  compute(measurements, bmHeight) {
    let ih = null; // 器械高
    const result = [];

    measurements.forEach((row, i) => {
      const bs = row.bs !== '' ? parseFloat(row.bs) : null;
      const fs = row.fs !== '' ? parseFloat(row.fs) : null;
      const is = row.is !== '' ? parseFloat(row.is) : null;

      let gh   = null;  // 地盤高
      let diff = null;  // 高低差

      if (i === 0) {
        // 最初の測点：BM高 + BS = 器械高
        if (bs !== null) {
          ih = parseFloat(bmHeight) + bs;
          gh = parseFloat(bmHeight);
        }
      } else {
        if (bs !== null && fs !== null) {
          // 転点：前視で地盤高を計算し、後視で新しい器械高を計算
          gh   = ih !== null ? ih - fs : null;
          diff = bs - fs;
          ih   = gh !== null ? gh + bs : null;
        } else if (fs !== null) {
          // 前視のみ（終点）
          gh   = ih !== null ? ih - fs : null;
          diff = result.length > 0
            ? (result.find(r => r.bs !== null && r.index < i)?.bs || 0) - fs
            : null;
        } else if (is !== null) {
          // 中間視
          gh = ih !== null ? ih - is : null;
        }
      }

      result.push({
        index:  i,
        point:  row.point,
        bs:     bs,
        fs:     fs,
        is:     is,
        ih:     ih,
        gh:     gh,
        diff:   diff,
        note:   row.note || '',
      });
    });

    return result;
  },

  // ── 点検計算 ──────────────────────────
  check(measurements) {
    let sumBS = 0, sumFS = 0, sumPlus = 0, sumMinus = 0;

    measurements.forEach(row => {
      if (row.bs !== null) sumBS += row.bs;
      if (row.fs !== null) sumFS += row.fs;
      if (row.diff !== null) {
        if (row.diff >= 0) sumPlus  += row.diff;
        else               sumMinus += Math.abs(row.diff);
      }
    });

    const diffBSFS   = sumBS - sumFS;
    const diffHeight = sumPlus - sumMinus;
    const isOK       = Math.abs(diffBSFS - diffHeight) < 0.0001;

    return { sumBS, sumFS, sumPlus, sumMinus, diffBSFS, diffHeight, isOK };
  },

  // ── 許容誤差チェック ──────────────────
  toleranceCheck(grade, routeLengthKm, closingError) {
    const k   = this.TOLERANCE[grade] || 10.0;
    const tol = k * Math.sqrt(routeLengthKm);
    const isOK = Math.abs(closingError) <= tol;
    return { tolerance: tol, closingError, isOK, k };
  },

  // ── 数値フォーマット ──────────────────
  fmt(val, digits = 3) {
    if (val === null || val === undefined || isNaN(val)) return '';
    return parseFloat(val).toFixed(digits);
  },
};