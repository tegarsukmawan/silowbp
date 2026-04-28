import { z } from "zod";

import {
  appRoleValues,
  assignmentValues,
  destinationValues,
  movementStatusValues,
} from "./constants";

const passwordSchema = z
  .string()
  .min(8, "Sandi harus minimal 8 karakter.")
  .max(128, "Sandi terlalu panjang.");

export const bootstrapSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.email(),
  password: passwordSchema,
});

export const publicRegisterSchema = z
  .object({
    name: z.string().min(3).max(100),
    email: z.email(),
    password: passwordSchema,
    role: z.enum(["Admin", "Petugas Pintu 3", "Petugas Ruangan"]),
    assignment: z.enum(assignmentValues).optional(),
  })
  .superRefine((value, context) => {
    if (value.role === "Admin" && value.assignment && value.assignment !== "Administrasi") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignment"],
        message: "Role Admin hanya boleh menggunakan assignment Administrasi.",
      });
    }

    if (value.role === "Petugas Pintu 3" && value.assignment && value.assignment !== "Pintu 3") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignment"],
        message: "Role Petugas Pintu 3 hanya boleh menggunakan assignment Pintu 3.",
      });
    }

    if (
      value.role === "Petugas Ruangan" &&
      (!value.assignment ||
        !["Klinik", "Registrasi", "Kunjungan"].includes(value.assignment))
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignment"],
        message: "Petugas Ruangan wajib memilih unit ruangan.",
      });
    }
  });

export const wbpPayloadSchema = z.object({
  registrationNumber: z.string().min(3).max(50),
  fullName: z.string().min(3).max(120),
  roomBlock: z.string().min(1).max(20),
  roomNumber: z.string().min(1).max(20),
  photoUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal(""))
    .transform((value) => {
      if (!value) {
        return undefined;
      }
      return value;
    }),
});

export const userProvisionSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.email(),
  password: passwordSchema,
  role: z.enum(appRoleValues),
  assignment: z.enum(assignmentValues).optional(),
});

export const userAccountUpdateSchema = z
  .object({
    role: z.enum(appRoleValues),
    assignment: z.enum(assignmentValues).optional(),
    isActive: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.role === "Admin" && value.assignment && value.assignment !== "Administrasi") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignment"],
        message: "Role Admin hanya boleh memakai assignment Administrasi.",
      });
    }

    if (
      value.role === "Petugas Pintu 3" &&
      value.assignment &&
      value.assignment !== "Pintu 3"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignment"],
        message: "Petugas Pintu 3 hanya boleh memakai assignment Pintu 3.",
      });
    }

    if (
      value.role === "Petugas Ruangan" &&
      (!value.assignment ||
        !["Klinik", "Registrasi", "Kunjungan"].includes(value.assignment))
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignment"],
        message: "Petugas Ruangan wajib memilih unit ruangan.",
      });
    }
  });

export const userPasswordResetSchema = z.object({
  newPassword: passwordSchema,
});

export const dispatchMovementSchema = z.object({
  wbpId: z.string().min(1),
  destination: z.enum(destinationValues),
});

export const listMovementFiltersSchema = z.object({
  destination: z.enum(destinationValues).optional(),
  status: z.enum(movementStatusValues).optional(),
  search: z.string().optional(),
  activeOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const listLogFiltersSchema = z.object({
  destination: z.enum(destinationValues).optional(),
  status: z.enum(movementStatusValues).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
});

export const reportSummaryFiltersSchema = z.object({
  range: z.enum(["today", "7d", "30d"]).optional().default("today"),
  destination: z.enum(destinationValues).optional(),
});
