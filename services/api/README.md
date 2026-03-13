# api

## Property Tax Backfill Helper

Use the helper to backfill derived estimate fields on existing property tax statements and optionally generate initial statements from old utility records tagged as tax-related categories.

Dry run:

```bash
yarn workspace @microrealestate/api run backfill:property-tax
```

Apply updates:

```bash
yarn workspace @microrealestate/api run backfill:property-tax -- --commit
```

Apply updates and attempt import from utility records:

```bash
yarn workspace @microrealestate/api run backfill:property-tax -- --commit --from-utilities
```

Optional custom estimate increase percentage:

```bash
yarn workspace @microrealestate/api run backfill:property-tax -- --commit --increase=4.0
```