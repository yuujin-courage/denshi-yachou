const CALC = {

  TOLERANCE: {
    '1級水準測量': 2.5,
    '2級水準測量': 5.0,
    '3級水準測量': 10.0,
    '4級水準測量': 20.0,
    '簡易水準測量': 40.0,
  },

  compute(measurements, bmHeight) {
    var ih     = null;
    var result = [];

    measurements.forEach(function(row, i) {
      var bs = (row.bs !== '' && row.bs !== null && row.bs !== undefined)
               ? parseFloat(row.bs) : null;
      var fs = (row.fs !== '' && row.fs !== null && row.fs !== undefined)
               ? parseFloat(row.fs) : null;
      var is = (row.is !== '' && row.is !== null && row.is !== undefined)
               ? parseFloat(row.is) : null;

      var gh   = null;
      var diff = null;

      if (i === 0) {
        if (bs !== null) {
          ih = parseFloat(bmHeight) + bs;
          gh = parseFloat(bmHeight);
        }
      } else {
        if (bs !== null && fs !== null) {
          gh   = ih !== null ? ih - fs : null;
          diff = bs - fs;
          ih   = gh !== null ? gh + bs : null;
        } else if (fs !== null) {
          gh = ih !== null ? ih - fs : null;
        } else if (is !== null) {
          gh = ih !== null ? ih - is : null;
        }
      }

      result.push({
        index: i,
        point: row.point || '',
        bs:    bs,
        fs:    fs,
        is:    is,
        ih:    ih,
        gh:    gh,
        diff:  diff,
        note:  row.note || '',
      });
    });

    return result;
  },

  check(measurements) {
    var sumBS    = 0;
    var sumFS    = 0;
    var sumPlus  = 0;
    var sumMinus = 0;

    measurements.forEach(function(row) {
      if (row.bs !== null) sumBS += row.bs;
      if (row.fs !== null) sumFS += row.fs;
      if (row.diff !== null) {
        if (row.diff >= 0) sumPlus  += row.diff;
        else               sumMinus += Math.abs(row.diff);
      }
    });

    var diffBSFS   = sumBS - sumFS;
    var diffHeight = sumPlus - sumMinus;
    var isOK       = Math.abs(diffBSFS - diffHeight) < 0.0001;

    return {
      sumBS:      sumBS,
      sumFS:      sumFS,
      sumPlus:    sumPlus,
      sumMinus:   sumMinus,
      diffBSFS:   diffBSFS,
      diffHeight: diffHeight,
      isOK:       isOK,
    };
  },

  toleranceCheck(grade, routeLengthKm, closingError) {
    var k   = this.TOLERANCE[grade] || 10.0;
    var tol = k * Math.sqrt(routeLengthKm);
    var isOK = Math.abs(closingError) <= tol;
    return {
      tolerance:    tol,
      closingError: closingError,
      isOK:         isOK,
      k:            k,
    };
  },

  fmt(val, digits) {
    digits = digits !== undefined ? digits : 3;
    if (val === null || val === undefined || isNaN(val)) return '';
    return parseFloat(val).toFixed(digits);
  },
};