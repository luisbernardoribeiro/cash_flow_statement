import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";

const HEADER_MAP = {
  data: "date", date: "date",
  tipo: "type", type: "type",
  descricao: "description", "descrição": "description", description: "description",
  categoria: "category", category: "category",
  fornecedor: "supplier", supplier: "supplier",
  conta: "account", account: "account",
  valor: "amount", amount: "amount", value: "amount",
  notas: "notes", notes: "notes",
};

function normalizeKey(k) {
  return String(k).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

const file = process.argv[2];
const buf = readFileSync(file);
const wb = XLSX.read(buf, { type: "buffer", cellDates: false });

console.log("Sheets:", wb.SheetNames);

const sheetName = wb.SheetNames.find((n) => n.toLowerCase().includes("moviment")) || wb.SheetNames[0];
console.log("Using sheet:", sheetName);

const sheet = wb.Sheets[sheetName];
const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
console.log("Total rows:", matrix.length);

let headerRowIdx = -1;
let mappedHeaders = [];
for (let i = 0; i < Math.min(matrix.length, 20); i++) {
  const row = matrix[i] || [];
  const candidates = row.map((c) => HEADER_MAP[normalizeKey(String(c ?? ""))] ?? null);
  const hits = candidates.filter(Boolean).length;
  console.log(`  Row ${i}: hits=${hits}`, row.slice(0, 5).map(c => c == null ? "" : String(c).slice(0, 20)));
  if (hits >= 4 && headerRowIdx === -1) {
    headerRowIdx = i;
    mappedHeaders = candidates;
  }
}

console.log("\nHeader row index:", headerRowIdx);
console.log("Mapped headers:", mappedHeaders);

if (headerRowIdx === -1) {
  console.error("HEADER NOT FOUND");
  process.exit(1);
}

function excelSerialToISO(n) {
  if (!isFinite(n) || n < 1 || n > 100000) return null;
  const ms = Math.round(n * 86400000) + Date.UTC(1899, 11, 30);
  const d = new Date(ms);
  if (isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  if (y < 1900 || y > 2200) return null;
  return `${y}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
function parseExcelDate(v) {
  if (v == null || v === "") return null;
  if (typeof v === "number") {
    const r = excelSerialToISO(v);
    if (r) return r;
  }
  const s = String(v).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    let yy = m[3];
    if (yy.length === 2) yy = "20" + yy;
    return `${yy}-${mm}-${dd}`;
  }
  if (/^\d{4,6}(\.\d+)?$/.test(s)) {
    const r = excelSerialToISO(Number(s));
    if (r) return r;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime()) && d.getFullYear() > 1900 && d.getFullYear() < 2200) {
    return d.toISOString().slice(0, 10);
  }
  return null;
}

let validCount = 0;
let invalidCount = 0;
const sample = [];
for (let i = headerRowIdx + 1; i < matrix.length; i++) {
  const arr = matrix[i] || [];
  if (arr.every((c) => c == null || String(c).trim() === "")) continue;
  const obj = {};
  for (let j = 0; j < mappedHeaders.length; j++) {
    if (mappedHeaders[j]) obj[mappedHeaders[j]] = arr[j];
  }
  obj._parsedDate = parseExcelDate(obj.date);
  if (obj._parsedDate) validCount++; else invalidCount++;
  if (sample.length < 3) sample.push(obj);
}
console.log("\nValid date rows:", validCount, "  Invalid:", invalidCount);
console.log("First 3 sample rows:", JSON.stringify(sample, null, 2));
