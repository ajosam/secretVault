import { z } from "zod";

export const ROLE_VALUES = ["super_admin", "admin", "devops", "developer", "auditor"] as const;

export const assignAccessSchema = z.object({
  userId: z.string().min(1, "User is required"),
  role: z.enum(ROLE_VALUES),
});

export type AssignAccessPayload = z.infer<typeof assignAccessSchema>;
