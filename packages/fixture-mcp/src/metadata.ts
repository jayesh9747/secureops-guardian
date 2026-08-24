import { caseMetadataSchema, type CaseMetadata } from '@guardian/shared';

export const DEMO_CASE_ID = 'checkout-networkpolicy-egress-exposure';

const metadata: CaseMetadata = caseMetadataSchema.parse({
  caseId: DEMO_CASE_ID,
  fixtureVersion: '1',
  synthetic: true,
  summary: 'Owned synthetic post-deployment NetworkPolicy exposure fixture.',
});

export function getCaseMetadata(caseId: string): CaseMetadata | undefined {
  return caseId === DEMO_CASE_ID ? metadata : undefined;
}
