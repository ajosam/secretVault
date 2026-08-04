import { z } from "zod";

export const createNamespaceSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(63, "Name is too long"),
  policyLabel: z.string().trim().optional().default(""),
});

export type CreateNamespacePayload = z.infer<typeof createNamespaceSchema>;
