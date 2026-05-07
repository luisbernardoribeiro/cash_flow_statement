# MAPA Tesouraria — Next.js App

Plataforma SaaS de controlo de tesouraria para PMEs portuguesas, sob a marca **GI Contabilidade & Consultoria**.

> Desenvolvido por **Alípio Monteiro** · Contabilista Certificado nº 32897

---

## Stack

- **Next.js 15** (App Router, Server Components, Turbopack)
- **TypeScript 5**
- **Tailwind CSS 3** com tokens da marca GI (`#2E2C7E`)
- **Supabase** — Auth + Postgres + Storage (anexos)
- **Drizzle ORM** — schema type-safe, migrations versionadas
- **React Query** (client state)
- **Recharts** (gráficos)
- **Stripe** (subscrições — Fase 2)

## Pré-requisitos

- Node.js ≥ 20
- npm ≥ 9
- Conta Supabase ([criar grátis](https://supabase.com))

## Setup local

```bash
cd app
npm install
cp .env.local.example .env.local
# editar .env.local com as chaves reais

npm run dev
# abrir http://localhost:3000
```

## Estrutura

```
app/
├── src/
│   ├── app/                    # App Router (rotas, layouts, páginas)
│   │   ├── layout.tsx          # Root layout (metadata SEO + globals.css)
│   │   ├── page.tsx            # Landing pública
│   │   ├── globals.css         # Tailwind + tokens GI
│   │   └── (app)/              # ← futuro: rotas autenticadas
│   ├── lib/
│   │   ├── db/
│   │   │   └── schema.ts       # Drizzle: orgs, users, categories, transactions...
│   │   ├── supabase/           # ← futuro: client/server helpers
│   │   └── utils.ts
│   └── components/             # ← futuro: UI compartilhada
├── drizzle/                    # ← gerado por drizzle-kit (migrations SQL)
├── public/
├── tailwind.config.ts          # Tokens da marca GI
├── drizzle.config.ts
└── package.json
```

## Próximos passos (Fase 1)

- [ ] Criar projeto Supabase em região EU (Frankfurt)
- [ ] `npm run db:push` — aplicar schema inicial
- [ ] Implementar Supabase Auth (magic link)
- [ ] Middleware de proteção de rotas + multi-tenancy via RLS
- [ ] Páginas: `/dashboard`, `/movimentos`, `/fluxo-mensal`, `/configuracao`
- [ ] Importador do template Excel (`MAPA_FLUXOS_TESOURARIA.xlsx`)
- [ ] Stripe checkout + webhooks
- [ ] PWA manifest + service worker
- [ ] Deploy em Vercel (região Frankfurt)
