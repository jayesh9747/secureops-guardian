import { z } from 'zod';

const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/u);

export const interpretedRequestCardSchema = z
  .object({
    schema_version: z.literal(1),
    request_id: z.string().regex(/^guardian-request:sha256:[0-9a-f]{64}$/u),
    request_sha256: sha256Schema,
    repository: z.string().min(1),
    base_branch: z.string().min(1),
    revision: z.string().min(1),
    target_file: z.string().min(1).nullable(),
    pack: z
      .object({
        pack_id: z.string().min(1),
        pack_version: z.string().min(1),
      })
      .strict(),
    capability_ceiling: z.enum(['ANALYSIS_ONLY', 'REMEDIATION_PROVEN', 'OPEN_PR_ELIGIBLE']),
    will_not: z.string().min(1),
    confirmation_notice: z.literal(
      'Confirming this interpretation does not authorize any GitHub write.',
    ),
  })
  .strict()
  .superRefine((card, context) => {
    if (card.request_id !== `guardian-request:sha256:${card.request_sha256}`) {
      context.addIssue({
        code: 'custom',
        message: 'Interpreted request ID does not match its digest.',
      });
    }
  });

export type InterpretedRequestCard = z.infer<typeof interpretedRequestCardSchema>;

export function renderInterpretedRequestCardOpenUi(untrustedCard: InterpretedRequestCard): string {
  const card = interpretedRequestCardSchema.parse(untrustedCard);
  const scopeValues = [
    card.repository,
    card.base_branch,
    card.revision,
    card.target_file ?? 'Changed files only',
  ];
  return [
    'root = Stack([requestCard], "column", "m")',
    'requestCard = Card([header, chipRow, scopeTable, boundary, confirmationNotice, requestIdentity], "card", "column", "m")',
    'header = CardHeader("Interpreted request", "Confirm the exact meaning before higher-capability execution")',
    'chipRow = Stack([packTag, capabilityTag], "row", "s", "center", "start", true)',
    `packTag = Tag(${JSON.stringify(`Pack: ${card.pack.pack_id}@${card.pack.pack_version}`)}, null, "md", "neutral")`,
    `capabilityTag = Tag(${JSON.stringify(`Capability: ${card.capability_ceiling}`)}, null, "md", "warning")`,
    'scopeTable = Table([Col("Request field", scopeLabels), Col("Exact value", scopeValues)])',
    'scopeLabels = ["Repository", "Base branch", "Revision", "Target file"]',
    `scopeValues = ${JSON.stringify(scopeValues)}`,
    `boundary = Callout("warning", "What Guardian will not do", ${JSON.stringify(card.will_not)})`,
    `confirmationNotice = Callout("warning", "Confirmation boundary", ${JSON.stringify(card.confirmation_notice)})`,
    `requestIdentity = MarkDownRenderer(${JSON.stringify(`Request ID: \`${card.request_id}\``)}, "clear")`,
  ].join('\n');
}
