import { z } from "zod";

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Organization name is required").optional(),
  defaultRotationPolicy: z.enum(["30d", "60d", "90d", "manual", "on-demand"]).nullable().optional(),
  warnBeforeExpirationDays: z.number().int().min(1).max(365).optional(),
});

export type UpdateOrganizationPayload = z.infer<typeof updateOrganizationSchema>;

export const deleteOrganizationSchema = z.object({
  confirmName: z.string(),
});
