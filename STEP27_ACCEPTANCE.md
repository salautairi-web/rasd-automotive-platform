# Step 27 Acceptance Tests

## Entity isolation

- [ ] User scoped to Entity A cannot read Entity B operational records.
- [ ] User scoped to Entity A cannot mutate Entity B records by changing an ID in the request.
- [ ] Central administrators can aggregate approved financial summaries without gaining accidental operational cross-entity access.

## Accounting integrity

- [ ] Every posted journal has equal debit and credit totals.
- [ ] Posted journals are immutable.
- [ ] Corrections create a reversal and a corrected entry.
- [ ] Duplicate financial events do not create duplicate journal entries.

## Vehicle lifecycle

- [ ] Acquisition creates the correct entity-owned vehicle/inventory state.
- [ ] Sale moves the vehicle through the defined lifecycle and creates the expected financial event.
- [ ] Workshop parts and labor are attributable to the correct job/vehicle/entity.
- [ ] Rental checkout/check-in preserves vehicle state and settlement traceability.

## Integration reliability

- [ ] Replayed commands are idempotent.
- [ ] Replayed webhooks are ignored safely.
- [ ] Failed deliveries can be retried without double posting.
- [ ] Correlation IDs connect command, event, and financial effects.

## Quality gates

- [ ] `pnpm check`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] Desktop RTL smoke test
- [ ] Mobile RTL smoke test
