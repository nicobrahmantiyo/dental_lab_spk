// backend/src/services/topsisService.js
function runTopsis(alternatives, criteria) {
  const n = alternatives.length;
  const m = criteria.length;

  if (n === 0 || m === 0)
    throw new Error('Data alternatif atau kriteria kosong');

  // Step 1: Normalisasi matriks
  const normalized = alternatives.map(alt => [...alt.values]);
  for (let j = 0; j < m; j++) {
    const sumSq = alternatives.reduce((acc, alt) => acc + Math.pow(alt.values[j], 2), 0);
    const denom = Math.sqrt(sumSq);
    for (let i = 0; i < n; i++) {
      normalized[i][j] = denom === 0 ? 0 : alternatives[i].values[j] / denom;
    }
  }

  // Step 2: Matriks terbobot
  const weighted = normalized.map(row =>
    row.map((val, j) => val * criteria[j].weight)
  );

  // Step 3: Solusi ideal positif & negatif
  const aPlus  = [];
  const aMinus = [];
  for (let j = 0; j < m; j++) {
    const colVals = weighted.map(row => row[j]);
    const maxVal  = Math.max(...colVals);
    const minVal  = Math.min(...colVals);
    if (criteria[j].type === 'BENEFIT') {
      aPlus[j]  = maxVal;
      aMinus[j] = minVal;
    } else {
      aPlus[j]  = minVal;
      aMinus[j] = maxVal;
    }
  }

  // Step 4 & 5: Hitung jarak dan nilai preferensi
  const results = alternatives.map((alt, i) => {
    const dPlus  = Math.sqrt(weighted[i].reduce((acc, v, j) => acc + Math.pow(v - aPlus[j],  2), 0));
    const dMinus = Math.sqrt(weighted[i].reduce((acc, v, j) => acc + Math.pow(v - aMinus[j], 2), 0));
    const ci     = (dPlus + dMinus) === 0 ? 0 : dMinus / (dPlus + dMinus);

    return {
      id:               alt.id,
      name:             alt.name,
      raw_values:       alt.values,
      normalized_row:   normalized[i],
      weighted_row:     weighted[i],
      d_positive:       parseFloat(dPlus.toFixed(6)),
      d_negative:       parseFloat(dMinus.toFixed(6)),
      preference_score: parseFloat(ci.toFixed(6)),
    };
  });

  // Step 6: Ranking
  results.sort((a, b) => b.preference_score - a.preference_score);
  results.forEach((r, idx) => { r.rank = idx + 1; });

  return { results, idealPositive: aPlus, idealNegative: aMinus };
}

module.exports = { runTopsis };