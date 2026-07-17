export function fmtQty(val) {
  if (val === null || val === undefined || val === "") return 0;
  const n = parseFloat(val);
  if (isNaN(n)) return 0;
  return Number.isInteger(n) ? n : parseFloat(n.toFixed(2));
}

export function fmtNumber(val) {
  return Number(fmtQty(val)).toLocaleString("id-ID");
}

export function fmtRupiah(val) {
  return `Rp ${Number(val || 0).toLocaleString("id-ID")}`;
}
