"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as XLSX from "xlsx";
import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { transactions, categories, suppliers, accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type RowIn = Record<string, unknown>;

const HEADER_MAP: Record<string, string> = {
  data: "date", date: "date",
  tipo: "type", type: "type",
  descricao: "description", "descrição": "description", description: "description",
  categoria: "category", category: "category",
  fornecedor: "supplier", supplier: "supplier",
  conta: "account", account: "account",
  valor: "amount", amount: "amount", value: "amount",
  notas: "notes", notes: "notes",
};

function normalizeKey(k: string): string {
  return String(k)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function parseExcelDate(v: unknown): string | null {
  if (v == null || v === "") return null;
  // Excel serial number
  if (typeof v === "number") {
    const date = XLSX.SSF.parse_date_code(v);
    if (date && date.y > 1900) {
      return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
    }
  }
  // ISO already
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // dd/mm/yyyy
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    let yy = m[3];
    if (yy.length === 2) yy = "20" + yy;
    return `${yy}-${mm}-${dd}`;
  }
  // Try Date.parse
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function parseAmount(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Math.abs(v);
  const cleaned = String(v).replace(/[^\d,.\-]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return isNaN(n) ? null : Math.abs(n);
}

function parseType(v: unknown): "entrada" | "saida" | null {
  const s = normalizeKey(String(v ?? ""));
  if (s.startsWith("ent")) return "entrada";
  if (s.startsWith("sai") || s === "saida") return "saida";
  return null;
}

export async function importFromXlsx(formData: FormData) {
  const ctx = await requireActiveOrg();

  const file = formData.get("file") as File | null;
  const sheetHint = String(formData.get("sheet") ?? "Movimentos").trim();

  if (!file || file.size === 0) {
    redirect(`/importar?error=1&msg=${encodeURIComponent("Nenhum ficheiro selecionado.")}`);
  }
  if (file.size > 10 * 1024 * 1024) {
    redirect(`/importar?error=1&msg=${encodeURIComponent("Ficheiro maior que 10 MB. Divide em partes.")}`);
  }

  let workbook: XLSX.WorkBook;
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    workbook = XLSX.read(buf, { type: "buffer", cellDates: false });
  } catch (e) {
    console.error("[importFromXlsx read]", e);
    redirect(`/importar?error=1&msg=${encodeURIComponent("Não foi possível ler o ficheiro Excel.")}`);
  }

  // Find target sheet
  const sheetName =
    workbook.SheetNames.find((n) => n.toLowerCase() === sheetHint.toLowerCase()) ||
    workbook.SheetNames.find((n) => n.toLowerCase().includes("moviment")) ||
    workbook.SheetNames[0];

  if (!sheetName) {
    redirect(`/importar?error=1&msg=${encodeURIComponent("Livro Excel sem folhas.")}`);
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows: RowIn[] = XLSX.utils.sheet_to_json<RowIn>(sheet, { defval: null });

  if (rawRows.length === 0) {
    redirect(`/importar?error=1&msg=${encodeURIComponent("A folha está vazia.")}`);
  }

  // Normalize keys
  const rows = rawRows.map((row) => {
    const normalized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      const mapped = HEADER_MAP[normalizeKey(k)];
      if (mapped) normalized[mapped] = v;
    }
    return normalized;
  });

  // Pre-fetch existing master data
  const [existingCats, existingSups, existingAccs] = await Promise.all([
    db.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.orgId, ctx.orgId)),
    db.select({ id: suppliers.id, name: suppliers.name }).from(suppliers).where(eq(suppliers.orgId, ctx.orgId)),
    db.select({ id: accounts.id, name: accounts.name }).from(accounts).where(eq(accounts.orgId, ctx.orgId)),
  ]);

  const catMap = new Map(existingCats.map((c) => [normalizeKey(c.name), c.id]));
  const supMap = new Map(existingSups.map((s) => [normalizeKey(s.name), s.id]));
  const accMap = new Map(existingAccs.map((a) => [normalizeKey(a.name), a.id]));

  if (accMap.size === 0) {
    redirect(`/importar?error=1&msg=${encodeURIComponent("Cria pelo menos uma conta antes de importar.")}`);
  }
  const defaultAccountId = existingAccs[0].id;

  // Process rows
  type ToInsert = typeof transactions.$inferInsert;
  const toInsert: ToInsert[] = [];
  const errors: string[] = [];
  const newCategories: Array<{ name: string; type: "entrada" | "saida" }> = [];
  const newSuppliers: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const lineNum = i + 2;

    const date = parseExcelDate(r.date);
    const type = parseType(r.type);
    const description = String(r.description ?? "").trim();
    const amount = parseAmount(r.amount);

    if (!date)        { errors.push(`Linha ${lineNum}: data inválida`); continue; }
    if (!type)        { errors.push(`Linha ${lineNum}: tipo inválido (deve ser Entrada ou Saída)`); continue; }
    if (!description) { errors.push(`Linha ${lineNum}: descrição em falta`); continue; }
    if (amount == null || amount === 0) { errors.push(`Linha ${lineNum}: valor inválido`); continue; }

    let categoryId: string | null = null;
    if (r.category) {
      const name = String(r.category).trim();
      const key = normalizeKey(name);
      if (catMap.has(key)) {
        categoryId = catMap.get(key)!;
      } else {
        newCategories.push({ name, type });
      }
    }

    let supplierId: string | null = null;
    if (r.supplier) {
      const name = String(r.supplier).trim();
      const key = normalizeKey(name);
      if (supMap.has(key)) {
        supplierId = supMap.get(key)!;
      } else if (name !== "—" && name !== "-") {
        newSuppliers.push(name);
      }
    }

    let accountId = defaultAccountId;
    if (r.account) {
      const key = normalizeKey(String(r.account));
      if (accMap.has(key)) accountId = accMap.get(key)!;
    }

    toInsert.push({
      orgId: ctx.orgId,
      date,
      type,
      description,
      amount: String(amount),
      categoryId,
      supplierId,
      accountId,
      notes: r.notes ? String(r.notes) : null,
      createdBy: ctx.userId,
    });
  }

  // Create new categories
  const uniqueNewCats = Array.from(
    new Map(newCategories.map((c) => [normalizeKey(c.name) + "|" + c.type, c])).values()
  );
  if (uniqueNewCats.length > 0) {
    const inserted = await db.insert(categories).values(
      uniqueNewCats.map((c) => ({ orgId: ctx.orgId, name: c.name, type: c.type, group: "Importado" }))
    ).returning({ id: categories.id, name: categories.name });
    inserted.forEach((c) => catMap.set(normalizeKey(c.name), c.id));
  }

  // Create new suppliers
  const uniqueNewSups = Array.from(new Set(newSuppliers));
  if (uniqueNewSups.length > 0) {
    const inserted = await db.insert(suppliers).values(
      uniqueNewSups.map((name) => ({ orgId: ctx.orgId, name }))
    ).returning({ id: suppliers.id, name: suppliers.name });
    inserted.forEach((s) => supMap.set(normalizeKey(s.name), s.id));
  }

  // Re-link transactions to newly created categories/suppliers
  for (let i = 0; i < toInsert.length; i++) {
    if (!toInsert[i].categoryId && rawRows[i]) {
      const orig = rows[i];
      if (orig.category) {
        const key = normalizeKey(String(orig.category));
        if (catMap.has(key)) toInsert[i].categoryId = catMap.get(key)!;
      }
      if (orig.supplier && !toInsert[i].supplierId) {
        const key = normalizeKey(String(orig.supplier));
        if (supMap.has(key)) toInsert[i].supplierId = supMap.get(key)!;
      }
    }
  }

  if (toInsert.length === 0) {
    const msg = errors.slice(0, 3).join(" · ") || "Nenhuma linha válida.";
    redirect(`/importar?error=1&msg=${encodeURIComponent(msg)}`);
  }

  // Bulk insert in chunks of 500
  const CHUNK = 500;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    await db.insert(transactions).values(toInsert.slice(i, i + CHUNK));
  }

  revalidatePath("/movimentos");
  revalidatePath("/dashboard");
  revalidatePath("/categorias");
  revalidatePath("/fornecedores");

  redirect(`/importar?ok=1&n=${toInsert.length}`);
}
