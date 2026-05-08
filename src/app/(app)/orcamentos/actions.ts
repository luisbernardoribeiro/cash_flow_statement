"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { budgets, categories } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

function parseAmount(v: FormDataEntryValue | null): number {
  if (v == null) return 0;
  const s = String(v).trim().replace(",", ".").replace(/[^\d.\-]/g, "");
  const n = Number(s);
  return isNaN(n) ? 0 : Math.max(0, n);
}

/**
 * Recebe inputs no formato budget_<categoryId>=<valor>.
 * Estratégia upsert simples: apaga budgets do mês para a org e re-insere os não-zero.
 */
export async function saveBudgets(formData: FormData) {
  const ctx = await requireActiveOrg();
  const year  = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    redirect("/orcamentos?error=invalid_period");
  }

  // Recolher entries no formato budget_<uuid>
  type Row = { categoryId: string; planned: number };
  const rows: Row[] = [];
  for (const [k, v] of formData.entries()) {
    if (!k.startsWith("budget_")) continue;
    const categoryId = k.slice("budget_".length);
    if (categoryId.length !== 36) continue;
    const planned = parseAmount(v);
    if (planned > 0) rows.push({ categoryId, planned });
  }

  await db.transaction(async (tx) => {
    await tx.delete(budgets).where(
      and(
        eq(budgets.orgId, ctx.orgId),
        eq(budgets.year, year),
        eq(budgets.month, month),
      )
    );
    if (rows.length > 0) {
      await tx.insert(budgets).values(
        rows.map((r) => ({
          orgId: ctx.orgId,
          year, month,
          categoryId: r.categoryId,
          plannedAmount: r.planned.toFixed(2),
        }))
      );
    }
  });

  revalidatePath("/orcamentos");
  redirect(`/orcamentos?year=${year}&month=${month}&ok=saved`);
}

/**
 * Copia o orçamento do mês anterior para o mês atual.
 */
export async function copyFromPrevious(formData: FormData) {
  const ctx = await requireActiveOrg();
  const year  = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    redirect("/orcamentos?error=invalid_period");
  }

  const prevYear  = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;

  const prev = await db.select({
    categoryId: budgets.categoryId,
    plannedAmount: budgets.plannedAmount,
  })
    .from(budgets)
    .where(and(
      eq(budgets.orgId, ctx.orgId),
      eq(budgets.year, prevYear),
      eq(budgets.month, prevMonth),
    ));

  if (prev.length === 0) {
    redirect(`/orcamentos?year=${year}&month=${month}&error=no_previous`);
  }

  await db.transaction(async (tx) => {
    await tx.delete(budgets).where(and(
      eq(budgets.orgId, ctx.orgId),
      eq(budgets.year, year),
      eq(budgets.month, month),
    ));
    await tx.insert(budgets).values(prev.map((p) => ({
      orgId: ctx.orgId,
      year, month,
      categoryId: p.categoryId,
      plannedAmount: p.plannedAmount,
    })));
  });

  revalidatePath("/orcamentos");
  redirect(`/orcamentos?year=${year}&month=${month}&ok=copied`);
}

/**
 * Aplica o orçamento atual a todos os meses do ano (substitui).
 */
export async function applyToAllMonths(formData: FormData) {
  const ctx = await requireActiveOrg();
  const year  = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    redirect("/orcamentos?error=invalid_period");
  }

  const current = await db.select({
    categoryId: budgets.categoryId,
    plannedAmount: budgets.plannedAmount,
  }).from(budgets).where(and(
    eq(budgets.orgId, ctx.orgId),
    eq(budgets.year, year),
    eq(budgets.month, month),
  ));

  if (current.length === 0) {
    redirect(`/orcamentos?year=${year}&month=${month}&error=no_current`);
  }

  await db.transaction(async (tx) => {
    // Apaga TODOS os meses do ano
    await tx.delete(budgets).where(and(
      eq(budgets.orgId, ctx.orgId),
      eq(budgets.year, year),
    ));
    // Re-insere para os 12 meses
    const inserts: typeof budgets.$inferInsert[] = [];
    for (let m = 1; m <= 12; m++) {
      for (const c of current) {
        inserts.push({
          orgId: ctx.orgId,
          year, month: m,
          categoryId: c.categoryId,
          plannedAmount: c.plannedAmount,
        });
      }
    }
    await tx.insert(budgets).values(inserts);
  });

  revalidatePath("/orcamentos");
  redirect(`/orcamentos?year=${year}&month=${month}&ok=applied_all`);
}

export async function clearBudgets(formData: FormData) {
  const ctx = await requireActiveOrg();
  const year  = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    redirect("/orcamentos?error=invalid_period");
  }

  await db.delete(budgets).where(and(
    eq(budgets.orgId, ctx.orgId),
    eq(budgets.year, year),
    eq(budgets.month, month),
  ));

  revalidatePath("/orcamentos");
  redirect(`/orcamentos?year=${year}&month=${month}&ok=cleared`);
}

// Export apenas para suprimir warning de não usar `categories` (ainda)
export async function _noopCategories() { void categories; }
