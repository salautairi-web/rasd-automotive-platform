from pathlib import Path
p = Path('/home/ubuntu/rasd-automotive-platform/server/routers.ts')
s = p.read_text()
s = s.replace('import { assertWorkshopPermission } from "./workshopAccess";', 'import { assertWorkshopPermission } from "./workshopAccess";\nimport { assertEntityMembership } from "./entityAccess";')
needle = '''const workshopLegacyScopedProcedure = protectedProcedure.input(z.object({ businessEntityId: z.number().int().positive() })).use(async ({ ctx, input, next }) => {
  await assertWorkshopPermission(ctx.user, input.businessEntityId, "read");
  return next();
});'''
replacement = needle + '''

// Any operational procedure that receives a businessEntityId must establish
// the caller's active IAM membership before reading or mutating tenant data.
const entityScopedProcedure = protectedProcedure.use(async ({ ctx, input, next }) => {
  const businessEntityId = (input as { businessEntityId?: unknown })?.businessEntityId;
  if (typeof businessEntityId !== "number" || !Number.isInteger(businessEntityId) || businessEntityId <= 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "businessEntityId is required for entity-scoped operations" });
  }
  if (ctx.user.role !== "admin") await assertEntityMembership(ctx.user.id, ctx.user.role, businessEntityId);
  return next();
});'''
if needle not in s:
    raise SystemExit('middleware insertion point not found')
s = s.replace(needle, replacement, 1)

def replace_block(start, end, old='protectedProcedure', new='entityScopedProcedure'):
    global s
    a=s.index(start); b=s.index(end,a)
    block=s[a:b]
    block=block.replace(old,new)
    s=s[:a]+block+s[b:]

replace_block('  masterData: router({','  sales: router({')
replace_block('  sales: router({','  parts: router({')
replace_block('  parts: router({','  workshop: router({')
# Only the entity-scoped ERP procedures, not the global entity catalog query.
for old in [
    'accountingBooks: protectedProcedure.',
    'createJournal: protectedProcedure.',
    'postJournal: protectedProcedure.',
    'reverseJournal: protectedProcedure.',
]:
    s=s.replace(old, old.replace('protectedProcedure','entityScopedProcedure'), 1)
s=s.replace('moduleRows: protectedProcedure.', 'moduleRows: entityScopedProcedure.', 1)
p.write_text(s)
PY
python3 /home/ubuntu/rasd-automotive-platform/rasd-qa/harden-entity-scopes.py
rm /home/ubuntu/rasd-automotive-platform/rasd-qa/harden-entity-scopes.py
