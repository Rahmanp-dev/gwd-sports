/**
 * Row counts for an import job, shown at every step of the wizard.
 *
 * Lives here rather than in `app/api/import/extract/route.ts`, where it used to
 * be exported from and imported by two sibling routes. Next 15 permits route
 * modules to export ONLY route handlers and a fixed set of config values, so
 * that arrangement failed typegen the moment `.next/types` was regenerated:
 *
 *   Property 'summarise' is incompatible with index signature.
 *
 * A route file is an HTTP endpoint, not a utility module. Shared logic belongs
 * in lib.
 */
export interface ImportCounts {
  total: number;
  ready: number;
  needsReview: number;
  skipped: number;
  created: number;
  failed: number;
}

export function summarise(rows: Array<{ status: string }>): ImportCounts {
  const counts: ImportCounts = {
    total: rows.length,
    ready: 0,
    needsReview: 0,
    skipped: 0,
    created: 0,
    failed: 0,
  };
  for (const row of rows) {
    if (row.status === 'ready') counts.ready++;
    // `pending` is grouped with needs_review deliberately: to an owner looking
    // at the wizard, "not yet decided" and "needs a decision" are the same
    // thing — both block the import until they are resolved.
    else if (row.status === 'needs_review' || row.status === 'pending') counts.needsReview++;
    else if (row.status === 'skipped') counts.skipped++;
    else if (row.status === 'created') counts.created++;
    else if (row.status === 'failed') counts.failed++;
  }
  return counts;
}
