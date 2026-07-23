import { z } from "zod";

export const createSecretSchema = z.object({
  name: z.string().min(1, "Name is required"),
  namespace: z.string().min(1, "Namespace is required"),
  value: z.string().min(1, "Value is required"),
  description: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  rotationPolicy: z.enum(["30d", "60d", "90d", "manual", "on-demand"]).optional().default("manual"),
});

export type CreateSecretPayload = z.infer<typeof createSecretSchema>;
