# Checkpoint A: code review (Tasks 1-3)

Reviewed commits 93d71e5, 9ba5abf, 40ec4f0. Verdict: no Critical findings.

## Important

| # | Finding | Status |
|---|---|---|
| 1 | Decimal comma ("12,50") read as 1250 | Fixed. Comma accepted only as a thousands separator. Tests: `tests/unit/extract/amount.test.ts` |
| 2 | Amounts assumed 2 decimals for every currency (JPY, KWD) | Fixed. `src/lib/currency.ts` exponent table, parser checks decimals per currency. Task 4 must use `currencyExponent` for minor-unit conversion |
| 3 | No timeout or retry limit on the Claude call | Fixed. `createClient()`: 30 s timeout, 1 retry. Test checks both |
| 4 | Raw SDK error text returned to the caller | Fixed. Short fixed messages for timeout, auth, rate limit and other. Only the error name is logged |
| 5 | DB handle reopened on every Next dev reload | Fixed. Cached on `globalThis` |
| 6 | No production-safe migrate (drizzle-kit is a dev dependency) | Fixed. `src/lib/db/migrate.ts` and `npm run db:migrate:prod`. Phase 2 `start:prod` should call it |
| 7 | No DB CHECKs or indexes on `records` | Fixed with user approval (schema change). Migration `0001`: CHECKs on amount, currency, direction, fx_source, source; indexes on date, category and the duplicate-check columns. Tests: `tests/integration/db-constraints.test.ts` |

## Suggestions

| Finding | Status |
|---|---|
| Amount over 12 integer digits could overflow safe integers | Fixed with the amount cap |
| Use Zod at API boundaries from Task 5 on | Deferred to Task 4/5, where the first boundaries are built |
| `server-only` import guard | Deferred: needs a new dependency (ask first) and the CLI scripts run under plain Node |
| Check `stop_reason === "max_tokens"` | Skipped: 1024 tokens is far above the tool output size |
| No image size check before sending | Deferred to Task 12 (sharp downscale) |
| BE threshold 2400 misreads CE years 2401-2542 | Skipped: no real slip has those years. Warning text already reports the conversion |
| Category matched only against the default list | Deferred to Task 13: pass the live category list into the parser |
| `fx_rates.date` / `rate` are free text | Deferred to Task 8, validated in Zod |
| `drizzle.config.ts` creates the data folder as an import side effect | Skipped: needed because drizzle-kit does not create it |
