import { z } from "zod";

export const emailSchema = z.string().email("Email invalide").max(100);

export const passwordSchema = z.string().min(8, "8 caractères minimum").max(128);

export const registerSchema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(50).trim(),
  lastName: z.string().min(1, "Nom requis").max(50).trim(),
  email: emailSchema,
  password: passwordSchema,
  establishmentSlug: z.string().min(1).max(100),
  classId: z.string().min(1),
  classRepCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis"),
});

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
