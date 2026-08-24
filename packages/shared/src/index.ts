import { z } from 'zod';

export const caseMetadataSchema = z.object({
  caseId: z.string().min(1),
  fixtureVersion: z.string().min(1),
  synthetic: z.literal(true),
  summary: z.string().min(1),
});

export type CaseMetadata = z.infer<typeof caseMetadataSchema>;
