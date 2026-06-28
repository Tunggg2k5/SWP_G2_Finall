import { z } from "zod";
import {
  futureDateInputSchema,
  nameSchema,
  noteSchema,
  optionalIsoDateTimeSchema,
  optionalObjectIdSchema
} from "../utils/validation.js";

export const treatmentRecordSchema = z.object({
  visitNumber: z.coerce.number().int().min(1).max(100).default(1),
  vitalSigns: z
    .object({
      bloodPressure: z.string().optional(),
      heartRate: z.string().optional(),
      spo2: z.string().optional(),
      temperature: z.string().optional(),
      respiratoryRate: z.string().optional()
    })
    .optional(),
  diagnosis: z.string().max(2000).optional(),
  treatmentResult: z.string().max(2000).optional(),
  treatmentNote: z.string().max(4000).optional(),
  treatmentPlan: z.string().max(4000).optional(),
  prescription: z.string().max(4000).optional(),
  aftercareInstructions: z.string().max(4000).optional(),
  estimatedCost: z.coerce.number().optional()
});

export const createTreatmentPlanSchema = z.object({
  diagnosis: z.string().max(2000).optional(),
  treatmentPlan: z.string().trim().min(1).max(4000),
  estimatedCost: z.coerce.number().min(0).default(0),
  treatmentNote: z.string().max(4000).optional()
});

export const updateTreatmentPlanSchema = z.object({
  planDetail: z.string().trim().min(1).max(4000).optional(),
  estimatedCost: z.coerce.number().min(0).optional(),
  status: z.enum(["draft", "active", "completed", "cancelled"]).optional()
});

export const followUpAppointmentSchema = z.object({
  serviceId: optionalObjectIdSchema,
  date: futureDateInputSchema,
  startAt: optionalIsoDateTimeSchema,
  roomId: optionalObjectIdSchema,
  note: noteSchema
});

export const clinicalRoomStatusSchema = z.object({
  status: z.enum(["available", "in_use", "cleaning", "maintenance", "unavailable"])
});

const performedChargeSchema = z.object({
  serviceId: optionalObjectIdSchema,
  name: nameSchema,
  amount: z.coerce.number().min(0)
});

export const performedServicesSchema = z.object({
  services: z.array(performedChargeSchema).min(1),
  extraCosts: z.array(performedChargeSchema.omit({ serviceId: true })).default([])
});
