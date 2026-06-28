import { z } from "zod";
import {
  futureDateInputSchema,
  nameSchema,
  noteSchema,
  objectIdSchema,
  optionalEmailSchema,
  optionalObjectIdSchema,
  optionalPhoneSchema,
  passwordSchema
} from "../utils/validation.js";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const createWorkingHourSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(1).max(6),
  shiftName: nameSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  status: z.enum(["active", "inactive"]).default("active")
});

export const updateWorkingHourSchema = z.object({
  shiftName: nameSchema.optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  status: z.enum(["active", "inactive"]).optional()
});

export const createStaffScheduleSchema = z.object({
  userId: objectIdSchema,
  timeSlotId: objectIdSchema,
  roomId: optionalObjectIdSchema,
  workDate: futureDateInputSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  status: z.enum(["scheduled", "off", "completed", "cancelled"]).default("scheduled")
});

export const updateStaffScheduleSchema = z.object({
  roomId: optionalObjectIdSchema,
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  status: z.enum(["scheduled", "off", "completed", "cancelled"]).optional()
});

export const createAdminUserSchema = z.object({
  fullName: nameSchema,
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
  password: passwordSchema.default("nhakhoa2026"),
  role: z.enum(["patient", "receptionist", "dentist", "nurse", "admin"]),
  bio: noteSchema,
  yearsOfExperience: z.coerce.number().int().min(0).max(80).default(0)
});

export const resetAdminUserPasswordSchema = z.object({
  password: passwordSchema.optional()
});

export const updateAdminUserSchema = z.object({
  fullName: nameSchema.optional(),
  phone: optionalPhoneSchema,
  status: z.enum(["active", "inactive", "locked"]).optional(),
  bio: noteSchema,
  yearsOfExperience: z.coerce.number().int().min(0).max(80).optional()
});

export const createDentalServiceSchema = z.object({
  name: nameSchema,
  description: noteSchema,
  durationMinutes: z.coerce.number().int().min(10).max(480),
  price: z.union([z.string().trim().min(1), z.coerce.number().min(0)]).transform((value) => String(value)),
  requiresPrepayment: z.boolean().default(true),
  isConsultation: z.boolean().default(false)
});

export const updateDentalServiceSchema = z.object({
  name: nameSchema.optional(),
  description: noteSchema,
  durationMinutes: z.coerce.number().int().min(10).max(480).optional(),
  price: z.union([z.string().trim().min(1), z.coerce.number().min(0)]).transform((value) => String(value)).optional(),
  requiresPrepayment: z.boolean().optional(),
  isConsultation: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export const createClinicRoomSchema = z.object({
  name: nameSchema,
  description: noteSchema,
  equipment: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  assignedDentist: optionalObjectIdSchema,
  assignedNurse: optionalObjectIdSchema,
  status: z.enum(["available", "in_use", "cleaning", "maintenance", "unavailable"]).default("available"),
  isActive: z.boolean().default(true)
});

export const updateClinicRoomSchema = z.object({
  name: nameSchema.optional(),
  description: noteSchema,
  equipment: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  assignedDentist: optionalObjectIdSchema,
  assignedNurse: optionalObjectIdSchema,
  status: z.enum(["available", "in_use", "cleaning", "maintenance", "unavailable"]).optional(),
  isActive: z.boolean().optional()
});

export const updateReviewVisibilitySchema = z.object({
  isHidden: z.boolean()
});
