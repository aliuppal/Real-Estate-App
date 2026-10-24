import { z } from "zod";

const email = z.email("Enter a valid email address").trim().toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use at most 72 characters")
  .regex(/[a-zA-Z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password").max(72),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Roles a person can pick at signup. Agencies register separately; admins are never self-serve. */
export const SIGNUP_ROLES = ["seeker", "owner", "agent"] as const;

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email,
  password: passwordSchema,
  role: z.enum(SIGNUP_ROLES, "Choose how you'll use Nestly"),
  terms: z.boolean().refine(Boolean, "Please accept the terms to continue"),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const agencySignupSchema = z.object({
  agencyName: z.string().trim().min(2, "Enter your agency's name").max(80),
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email,
  phone: z.string().trim().regex(/^\+?[\d\s-]{7,20}$/, "Enter a valid phone number"),
  password: passwordSchema,
  terms: z.boolean().refine(Boolean, "Please accept the terms to continue"),
});
export type AgencySignupInput = z.infer<typeof agencySignupSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(16),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** 0–4 score for the strength meter. Purely advisory; `passwordSchema` is the real rule. */
export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) score++;
  if (pw.length > 0 && pw.length < 8) score = Math.min(score, 1);
  const s = score as 0 | 1 | 2 | 3 | 4;
  return { score: s, label: ["Too short", "Weak", "Fair", "Good", "Strong"][s] };
}
