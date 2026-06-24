# SchemaForge

> A single-file backend framework for PostgreSQL and Node.js. Define your database schema, ACL policies, and validations in one declarative DSL — then generate the SQL, the API, and the types.

---

## Philosophy

Most backend frameworks force you to scatter your truth across migrations, ORM models, Zod schemas, route handlers, and access control lists. SchemaForge inverts that: **your schema definition is the source of truth** for everything — the database, the REST API, and the runtime validations.

- **One file.** Schema, relations, triggers, indexes, and ACL in a single `.schema` file.
- **Zero ORM.** We generate raw PostgreSQL and parameterized queries. No hidden query builders, no N+1 surprises.
- **Hand-written parser.** A small, fast recursive-descent lexer/parser with zero parser-generator dependencies.
- **Hono-based runtime.** Lightweight, edge-ready HTTP handlers generated from your policies.

---

## Features

- **Declarative Schema DSL** — PostgreSQL-native types, enums, extensions, indexes, and triggers
- **Automatic SQL Generation** — idempotent DDL with snake_case naming conventions
- **Type-safe Database Client** — Prisma-like query API over parameterized raw SQL (`pg` Pool, no ORM)
- **Type-safe REST API** — Hono routes with generated Zod validation
- **Inline ACL** — Row-level and role-based access control defined next to your models
- **Validation Rules** — `@regex` and `@range` constraints that flow into both SQL `CHECK` constraints and request validators
- **Migration Ready** — Full regeneration today, diff-based migrations tomorrow

---

## The DSL

```ts
extensions {
  pgcrypto { version: "1.3" }
  postgis
  uuid-ossp
}

enums {
  UserRole { ADMIN, USER, PUBLIC }
  OrderStatus { PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED }
}

models {

  model User {
    id:        UUID        @id @default(gen_random_uuid())
    email:     VARCHAR(255) @unique
    name:      VARCHAR(150)
    role:      UserRole    @default(USER)
    age:       SMALLINT?
    balance:   INTEGER
    isActive:  BOOLEAN     @default(true)
    createdAt: TIMESTAMP   @default(now())
    updatedAt: TIMESTAMP?

    profile:   Profile?    @relation(name: "UserProfile")
    orders:    Order[]

    @policy(role: USER, allow: [select, insert, update])
    @policy(role: ADMIN, allow: all)

    @@index(fields: [role, isActive])
    @@index(fields: [name], where: "isActive = true", name: "active_users_name_idx", type: BTREE)

    @@trigger {
      timing: BEFORE,
      event: UPDATE,
      level: ROW,
      execute: """
        IF (OLD.balance <> NEW.balance) THEN
          RAISE EXCEPTION 'Balance cannot be updated directly';
        END IF;
        RETURN NEW;
      """
    }
  }

  model Profile {
    id:       UUID        @id @default(gen_random_uuid())
    userId:   UUID        @unique
    bio:      TEXT
    avatar:   VARCHAR(255)
    location: POINT

    user:     User        @relation(
      name: "UserProfile",
      fields: [userId],
      references: [id],
      onDelete: CASCADE,
      onUpdate: SET_NULL
    )
  }

  model Order {
    id:          UUID        @id @default(gen_random_uuid())
    userId:      UUID
    status:      OrderStatus @default(PENDING)
    totalAmount: DECIMAL(10, 2)
    items:       JSONB
    createdAt:   TIMESTAMP   @default(now())
    updatedAt:   TIMESTAMP?

    user:        User        @relation(fields: [userId], references: [id])
    products:    ProductOrder[]

    @@index(fields: [userId])
    @@index(fields: [status, createdAt], name: "order_status_created_idx")
  }

  model Product {
    id:          UUID        @id @default(gen_random_uuid())
    name:        VARCHAR(255)
    description: TEXT
    price:       DECIMAL(10, 2) @range(min: 0.01, max: 999999.99)
    stock:       INTEGER        @range(min: 0)
    category:    VARCHAR(100)
    tags:        TEXT[]
    metadata:    JSONB
    createdAt:   TIMESTAMP   @default(now())
    updatedAt:   TIMESTAMP?

    orders:      ProductOrder[]

    @@trigger {
      timing: AFTER,
      event: UPDATE,
      level: ROW,
      execute: """
        IF (OLD.stock <> NEW.stock) THEN
          INSERT INTO log (message) VALUES ('Product stock changed');
        END IF;
        RETURN NEW;
      """
    }
  }

  model ProductOrder {
    id:        SERIAL
    orderId:   UUID
    productId: UUID
    quantity:  INTEGER
    price:     DECIMAL(10, 2)

    order:     Order   @relation(fields: [orderId], references: [id])
    product:   Product @relation(fields: [productId], references: [id])

    @@id(fields: [orderId, productId])
  }

}
```

---

## How It Works

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────────┐
│   schema.dsl    │────▶│  Lexer +     │────▶│       AST        │
│  (your source)  │     │   Parser     │     │  (typed nodes)   │
└─────────────────┘     └──────────────┘     └────────┬─────────┘
                                                      │
           ┌──────────────────────────────────────────┼──────────┐
           │                                          │          │
           ▼                                          ▼          ▼
    ┌─────────────┐                          ┌──────────────┐ ┌─────────────┐
    │  SQL DDL    │                          │  DB Client   │ │ Hono Routes │
    │ Generator   │                          │  Generator   │ │ Generator   │
    └─────────────┘                          └──────────────┘ └─────────────┘
           │                                          │          │
           ▼                                          ▼          ▼
    ┌─────────────┐                          ┌──────────────┐ ┌─────────────┐
    │  schema.sql │                          │ generated/   │ │ Zod Schemas │
    │ (PostgreSQL)│                          │ db.ts, types │ │             │
    └─────────────┘                          └──────────────┘ └─────────────┘
```

1. **Parse** — The hand-written lexer and recursive-descent parser turn your `.schema` file into a typed AST.
2. **Generate SQL** — The DDL generator emits idempotent PostgreSQL: extensions, enums, tables, foreign keys, indexes, and triggers. All identifiers are automatically converted to `snake_case`.
3. **Generate DB client** — The client generator emits TypeScript interfaces and a `createDbClient(pool)` factory with per-model CRUD methods backed by a runtime query builder. All SQL uses `$1`, `$2`, … placeholders — user input is never interpolated.
4. **Generate API** — The route generator emits Hono routers with:
   - Zod-validated request bodies (driven by `@regex` and `@range`)
   - Role-based ACL middleware (driven by `@policy`)
   - Parameterized raw SQL queries (no ORM, no surprises)
5. **Run** — `app.ts` mounts all generated routers. You get a type-safe, policy-enforced REST API in seconds.

---

## Quick Start

```bash
# 1. Create your schema
npx schemaforge init
# → creates app.schema

# 2. Generate SQL and API
npx schemaforge generate
# → outputs schema.sql
# → outputs generated/ (routes, schemas, middleware)

# 3. Apply to your database
psql $DATABASE_URL -f schema.sql

# 4. Start the server
npx schemaforge dev
# → Hono server on http://localhost:3000
```

### Local development (this repo)

```bash
cp .env.example .env          # configure DATABASE_URL
npm run docker:up             # PostGIS-enabled PostgreSQL on :5432
npm run generate              # write schema.sql from app.schema
npm run generate:client       # write generated/db*.ts
npm run db:bootstrap          # apply DDL + snapshot schema state
npm test                      # unit tests
npm run test:integration      # Docker-backed DB client E2E tests
```

---

## Database Client

A type-safe query layer generated from your schema AST. The API mirrors Prisma ergonomics (`db.user.create`, `db.user.findMany`, …) but every query is built as parameterized raw SQL against a `pg` `Pool` — no ORM, no query-builder library.

### Generate

```bash
npm run generate:client
```

Outputs:

| File | Purpose |
|------|---------|
| `generated/db-types.ts` | Per-model interfaces: `User`, `UserCreateInput`, `UserUpdateInput`, `UserWhereInput`, `UserOrderByInput`, enum unions |
| `generated/db-model-meta.ts` | Serialized field/column metadata consumed at runtime |
| `generated/db.ts` | `createDbClient(pool)` factory wiring all models |

### Usage

```typescript
import { Pool } from 'pg';
import { createDbClient } from './generated/db.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = createDbClient(pool);

// Create
const user = await db.user.create({
  email: 'a@b.com',
  name: 'Alice',
  balance: 0,
});

// Read
const one = await db.user.findUnique({ id: user.id });
const first = await db.user.findFirst({
  where: { role: 'ADMIN' },
  orderBy: { createdAt: 'desc' },
});
const many = await db.user.findMany({
  where: { role: { in: ['ADMIN', 'USER'] }, isActive: true },
  orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
  take: 10,
  skip: 0,
});
const total = await db.user.count({ where: { role: 'ADMIN' } });

// Update
const updated = await db.user.update({
  where: { id: user.id },
  data: { name: 'Bob' },
});
const { count } = await db.user.updateMany({
  where: { isActive: false },
  data: { name: 'Inactive' },
});

// Delete
const deleted = await db.user.delete({ id: user.id });
await db.user.deleteMany({ where: { role: 'PUBLIC' } });
```

### Per-model API

Each model in `app.schema` becomes a camelCase property on the client (`User` → `db.user`, `ProductOrder` → `db.productOrder`) with these methods:

| Method | SQL shape |
|--------|-----------|
| `create(data)` | `INSERT INTO … VALUES ($1, …) RETURNING *` |
| `findUnique(where)` | `SELECT * … WHERE … LIMIT 1` |
| `findFirst({ where, orderBy })` | `SELECT * … ORDER BY … LIMIT 1` |
| `findMany({ where, orderBy, take, skip })` | `SELECT * … ORDER BY … LIMIT … OFFSET …` |
| `count({ where })` | `SELECT COUNT(*) …` |
| `update({ where, data })` | `UPDATE … SET … WHERE … RETURNING *` |
| `updateMany({ where, data })` | `UPDATE … SET … WHERE … RETURNING *` |
| `delete(where)` | `DELETE … WHERE … RETURNING *` |
| `deleteMany({ where })` | `DELETE … WHERE … RETURNING *` |

Mutations return the full row (`RETURNING *`). Rows are mapped from `snake_case` columns to `camelCase` TypeScript fields.

### Where filters

Direct values are treated as equality. Structured operators are supported per field type:

```typescript
// Equality shorthand
{ email: 'a@b.com' }

// Explicit operators
{ email: { equals: 'a@b.com' } }
{ email: { contains: '@' } }      // LIKE %@%
{ email: { startsWith: 'a' } }    // LIKE a%
{ email: { endsWith: '.com' } }  // LIKE %.com
{ balance: { gt: 100 } }
{ balance: { lte: 500 } }
{ role: { in: ['ADMIN', 'USER'] } }

// Logical groups
{
  AND: [{ role: 'USER' }, { isActive: true }],
  OR: [{ role: 'ADMIN' }, { role: 'PUBLIC' }],
  NOT: { isActive: false },
}
```

### Naming and types

- **API**: camelCase field names (`createdAt`, `userId`)
- **SQL**: snake_case columns (`created_at`, `user_id`); reserved table names like `user` and `order` are quoted
- **Runtime mapping**:

| Schema type | TypeScript |
|-------------|------------|
| `UUID`, `VARCHAR`, `TEXT` | `string` |
| `INTEGER`, `SERIAL`, `SMALLINT` | `number` |
| `BOOLEAN` | `boolean` |
| `TIMESTAMP` | `Date` |
| `DECIMAL` | `string` (avoids float precision loss) |
| `JSONB` | `Record<string, unknown>` |
| `TEXT[]` | `string[]` |
| Enums | string literal union |
| Optional (`?`) | `T \| null` |

Fields with `@default` are optional on `CreateInput`. `@id` fields are omitted from create input when the database generates them.

### Error handling

PostgreSQL errors are mapped to typed exceptions:

| Class | PG code | When |
|-------|---------|------|
| `UniqueConstraintError` | `23505` | Duplicate unique column (includes `fields: string[]`) |
| `ForeignKeyConstraintError` | `23503` | Invalid relation reference |
| `NotFoundError` | — | Optional helper for missing records |
| `DatabaseError` | other | Generic wrapper with `code`, `detail`, `constraint` |

```typescript
import { UniqueConstraintError } from './src/db/errors.js';

try {
  await db.user.create({ email: 'taken@b.com', name: 'X', balance: 0 });
} catch (error) {
  if (error instanceof UniqueConstraintError) {
    console.log(error.fields); // ['email']
  }
}
```

### Runtime architecture

Generated code is a thin wrapper. The query engine lives in `src/db/`:

```
src/db/
├── query-builder.ts      # INSERT / SELECT / UPDATE / DELETE / COUNT
├── where-translator.ts   # WhereInput → SQL + params
├── model-client.ts       # createModelClient factory
├── row-mapper.ts         # snake_case rows → camelCase + coercion
├── type-generator.ts     # AST → TypeScript interfaces
├── db-client-generator.ts
└── errors.ts
```

Relation `include` (e.g. `findMany({ include: { profile: true } })`) is planned for a future release.

### Integration tests

Docker-backed end-to-end tests reset the `public` schema, bootstrap from `app.schema`, and exercise all client operations:

```bash
npm run docker:up
npm run generate:client
npm run test:integration
```

See [`src/db/__tests__/db-client.integration.test.ts`](src/db/__tests__/db-client.integration.test.ts).

---

## Project Structure

```
my-project/
├── app.schema              # Your single source of truth
├── schema.sql              # Generated PostgreSQL DDL
├── generated/
│   ├── db.ts               # createDbClient(pool) factory
│   ├── db-types.ts         # Generated model + input interfaces
│   ├── db-model-meta.ts    # Runtime column metadata
│   ├── app.ts              # Hono entry point (planned)
│   ├── middleware/
│   │   ├── auth.ts         # JWT / session extraction
│   │   ├── acl.ts          # Policy enforcement
│   │   └── validate.ts     # Zod validation helpers
│   ├── routes/
│   │   ├── users.ts
│   │   ├── profiles.ts
│   │   ├── orders.ts
│   │   └── ...
│   └── schemas/
│       └── validation.ts   # Generated Zod schemas
├── src/db/                 # DB client runtime (query builder, not generated)
└── package.json
```

---

## Why SchemaForge?

| Concern | ORM Approach | SchemaForge Approach |
|---------|-----------|----------------------|
| Schema truth | Migrations + models + Zod + routes | One `.schema` file |
| Query visibility | Hidden behind ORM methods | Raw, parameterized SQL |
| Client ergonomics | ORM model API | Generated Prisma-like client, no ORM runtime |
| Performance | N+1, lazy loading pitfalls | Explicit joins, no magic |
| ACL | External service or manual checks | Inline `@policy` directives |
| Validation | Separate Zod schemas | Derived from `@regex` / `@range` |
| Dependencies | Heavy (Prisma, Drizzle, etc.) | Hono + pg + Zod + hand-written parser |

---

## Roadmap

- [x] Hand-written lexer & recursive-descent parser
- [x] SQL DDL generator (full regeneration)
- [x] Type-safe database client generator (`createDbClient`, parameterized query builder)
- [x] Diff-based migration planner
- [ ] Hono route generator with Zod validation
- [ ] Static ACL middleware generation
- [ ] Relation `include` in DB client
- [ ] Row-level policy injection (`WHERE` clause generation)
- [ ] Type generation for frontend consumption
- [ ] Tree-sitter grammar for editor support
- [ ] VS Code extension with syntax highlighting

---

## License

MIT
