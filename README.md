# Library Management System — API

The data layer for a library's book catalog, built with NestJS, PostgreSQL, and Prisma.

## Tech stack

- **Framework:** NestJS 11 (TypeScript)
- **ORM:** Prisma 6 (`prisma-client-js` generator)
- **Database:** PostgreSQL, hosted on Neon

## Structure

```
library-management-system/
├── README.md
└── api/
    ├── .env.example        # safe template (committed)
    ├── prisma/
    │   ├── schema.prisma   # single source of truth
    │   ├── seed.ts         # 4 genres, 16 books, 3 users
    │   └── migrations/
    └── src/
        ├── app.module.ts
        ├── main.ts
        └── prisma/
            ├── prisma.module.ts
            └── prisma.service.ts
```

## Getting started

```bash
cd api
npm install
cp .env.example .env      # paste your real DATABASE_URL
npm run db:migrate
npm run db:seed
npm run start:dev         # http://localhost:3000
```

## Data model

- **Role** enum: `PATRON`, `LIBRARIAN`
- **User**: email (unique), name, role
- **Genre**: name (unique), slug (unique)
- **Book**: title, author, isbn (unique), publishedYear, totalCopies, availableCopies,
  and `genreId` → foreign key to `Genre`
- **Review** (stretch): rating, comment, and foreign keys to **both** Book and User

## Schema Decisions

### Why `Book` references `Genre` with a foreign key instead of embedding it

1. **One genre, many books — written once.** With a `genreId` foreign key, the name
   "Science" exists in exactly one row. Rename that row and every science book is instantly
   correct. If each book embedded its own copy of the genre, "Science" would be duplicated
   across every book document — and renaming it would mean updating all of them, with one
   missed document silently corrupting the catalog.

2. **The database enforces correctness.** A real foreign key means PostgreSQL itself
   rejects a book pointing at a genre that doesn't exist. `@unique` guarantees one canonical
   genre name, and the `Role` enum guarantees `User.role` can only ever be `PATRON` or
   `LIBRARIAN`. An embedded document gets none of these guarantees — application code would
   have to police them.

3. **A genre's data isn't the book's data.** Genres have their own life: descriptions,
   display order, their own admin screens. Making Genre a first-class table keeps genre
   operations (list, rename, delete-if-empty) as single queries instead of scans across
   every book.

4. **Queries stay cheap, and it's the shape Week 2 needs.** `WHERE "genreId" = 2` is an
   indexed lookup (`@@index([genreId])`), and listing all genres is one small table read.
   Filtering books by genre and `include: { genre: true }` both fall out of the foreign key
   naturally — no de-duplication logic in the API.

`onDelete: Restrict` is deliberate: deleting a genre that still has books fails loudly
rather than silently orphaning real catalog data.

## Stretch goal — Prisma vs. a document database

**Relation-first, not embed-first.** In a document database the instinct is to nest data
inside its parent — put the genre object inside each book document — because there are no
joins, so you denormalize on purpose to keep reads fast. In Prisma the instinct is inverted:
normalise first, give each entity its own table and ID, connect them with a foreign key, and
let the database join them back together. The practical difference is where the invariants
live: a document store leaves it to application code to keep duplicated names in sync, while
a relational schema with a foreign key and `@unique` makes the database itself refuse to
break them. The trade-off is that reading a book *with* its genre needs an explicit
`include: { genre: true }` rather than reading one blob — but every write path gets simpler,
and correctness is enforced at the storage layer instead of in your head.
