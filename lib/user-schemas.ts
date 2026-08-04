import { z } from "zod";

export const ROLE_VALUES = ["super_admin", "admin", "devops", "developer", "auditor"] as const;

export const inviteUserSchema = z.object({
  fullName: z.string().trim().min(2, "Enter a full name"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  role: z.enum(ROLE_VALUES),
});

export type InviteUserPayload = z.infer<typeof inviteUserSchema>;

export const updateUserSchema = z.object({
  role: z.enum(ROLE_VALUES).optional(),
  status: z.enum(["active", "suspended"]).optional(),
});

export type UpdateUserPayload = z.infer<typeof updateUserSchema>;
