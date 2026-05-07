import {
  pgTable, uuid, text, timestamp, numeric, date, integer, boolean,
  pgEnum, index, primaryKey,
} from "drizzle-orm/pg-core";

// ----- Enums -----
export const txTypeEnum   = pgEnum("tx_type",   ["entrada", "saida"]);
export const accTypeEnum  = pgEnum("account_type", ["caixa", "tpa", "banco"]);
export const roleEnum     = pgEnum("member_role", ["owner", "admin", "operator", "viewer", "accountant"]);
export const planEnum     = pgEnum("plan", ["trial", "essencial", "negocio", "multi"]);

// ----- Tenancy -----
export const organizations = pgTable("organizations", {
  id:        uuid("id").primaryKey().defaultRandom(),
  name:      text("name").notNull(),
  nif:       text("nif"),
  plan:      planEnum("plan").default("trial").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id:        uuid("id").primaryKey(),  // mirrors auth.users.id from Supabase
  email:     text("email").notNull().unique(),
  name:      text("name"),
  avatarUrl: text("avatar_url"),
  locale:    text("locale").default("pt-PT"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const memberships = pgTable("memberships", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orgId:  uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  role:   roleEnum("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.orgId] }),
  byOrg: index("memberships_org_idx").on(t.orgId),
}));

// ----- Master data -----
export const accounts = pgTable("accounts", {
  id:             uuid("id").primaryKey().defaultRandom(),
  orgId:          uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name:           text("name").notNull(),
  type:           accTypeEnum("type").notNull(),
  openingBalance: numeric("opening_balance", { precision: 14, scale: 2 }).default("0").notNull(),
  currency:       text("currency").default("EUR").notNull(),
  archived:       boolean("archived").default(false).notNull(),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ byOrg: index("accounts_org_idx").on(t.orgId) }));

export const categories = pgTable("categories", {
  id:        uuid("id").primaryKey().defaultRandom(),
  orgId:     uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name:      text("name").notNull(),
  type:      txTypeEnum("type").notNull(),
  group:     text("group"),
  parentId:  uuid("parent_id"),
  color:     text("color"),
  archived:  boolean("archived").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ byOrg: index("categories_org_idx").on(t.orgId) }));

export const suppliers = pgTable("suppliers", {
  id:               uuid("id").primaryKey().defaultRandom(),
  orgId:            uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name:             text("name").notNull(),
  defaultCategoryId: uuid("default_category_id").references(() => categories.id, { onDelete: "set null" }),
  nif:              text("nif"),
  email:            text("email"),
  archived:         boolean("archived").default(false).notNull(),
  createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ byOrg: index("suppliers_org_idx").on(t.orgId) }));

// ----- Core: Transactions -----
export const transactions = pgTable("transactions", {
  id:            uuid("id").primaryKey().defaultRandom(),
  orgId:         uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  date:          date("date").notNull(),
  type:          txTypeEnum("type").notNull(),
  description:   text("description").notNull(),
  categoryId:    uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  supplierId:    uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  accountId:     uuid("account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
  amount:        numeric("amount", { precision: 14, scale: 2 }).notNull(),
  notes:         text("notes"),
  attachmentUrl: text("attachment_url"),
  status:        text("status").default("confirmed").notNull(),
  createdBy:     uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  reconciledAt:  timestamp("reconciled_at", { withTimezone: true }),
}, (t) => ({
  byOrgDate: index("tx_org_date_idx").on(t.orgId, t.date),
  byOrgCat:  index("tx_org_cat_idx").on(t.orgId, t.categoryId),
  byOrgAcc:  index("tx_org_acc_idx").on(t.orgId, t.accountId),
}));

// ----- Avançado -----
export const budgets = pgTable("budgets", {
  id:            uuid("id").primaryKey().defaultRandom(),
  orgId:         uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  year:          integer("year").notNull(),
  month:         integer("month").notNull(),
  categoryId:    uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  plannedAmount: numeric("planned_amount", { precision: 14, scale: 2 }).notNull(),
}, (t) => ({ byOrgPeriod: index("budgets_org_period_idx").on(t.orgId, t.year, t.month) }));

export const auditLog = pgTable("audit_log", {
  id:        uuid("id").primaryKey().defaultRandom(),
  orgId:     uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }),
  userId:    uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action:    text("action").notNull(),
  entity:    text("entity").notNull(),
  entityId:  uuid("entity_id"),
  payload:   text("payload"),
  at:        timestamp("at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ byOrg: index("audit_org_idx").on(t.orgId) }));
