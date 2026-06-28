import mongoose from "mongoose";
import { COLLECTIONS } from "./collections.js";

const { Schema } = mongoose;
const objectId = Schema.Types.ObjectId;
const baseOptions = { timestamps: true, strict: false, versionKey: false };

function model(name, collection, fields = {}) {
  return mongoose.models[name] || mongoose.model(name, new Schema(fields, { ...baseOptions, collection }));
}

export const Role = model("Role", COLLECTIONS.roles, {
  roleName: { type: String, required: true, unique: true },
  parentRoleName: String,
  isAbstract: Boolean,
  inheritanceChain: [String],
  description: String
});

export const User = model("User", COLLECTIONS.users, {
  fullName: String,
  email: { type: String, trim: true, lowercase: true, sparse: true },
  phone: String,
  passwordHash: String,
  role: String,
  roleRef: { type: objectId, ref: "Role" },
  status: String,
  gender: String,
  address: String,
  bio: String,
  avatarUrl: String,
  yearsOfExperience: Number
});

export const Patient = model("Patient", COLLECTIONS.patients, {
  user: { type: objectId, ref: "User" },
  gender: String,
  address: String,
  medicalNote: String
});

export const Dentist = model("Dentist", COLLECTIONS.dentists, {
  user: { type: objectId, ref: "User" },
  qualification: String,
  experienceYears: Number,
  description: String,
  status: String
});

export const Nurse = model("Nurse", COLLECTIONS.nurses, {
  user: { type: objectId, ref: "User" },
  qualification: String,
  status: String
});

export const Receptionist = model("Receptionist", COLLECTIONS.receptionists, {
  user: { type: objectId, ref: "User" },
  status: String
});

export const DentalService = model("DentalService", COLLECTIONS.dentalServices, {
  name: String,
  description: String,
  durationMinutes: Number,
  transitionTime: Number,
  price: String,
  requiresPrepayment: Boolean,
  isConsultation: Boolean,
  isActive: Boolean
});

export const ClinicRoom = model("ClinicRoom", COLLECTIONS.clinicRooms, {
  name: String,
  roomType: String,
  assignedDentist: { type: objectId, ref: "User" },
  assignedNurse: { type: objectId, ref: "User" },
  equipment: [String],
  status: String,
  isActive: Boolean
});

export const Appointment = model("Appointment", COLLECTIONS.appointments, {
  patient: { type: objectId, ref: "User" },
  createdBy: { type: objectId, ref: "User" },
  receptionist: { type: objectId, ref: "User" },
  dentist: { type: objectId, ref: "User" },
  nurse: { type: objectId, ref: "User" },
  room: { type: objectId, ref: "ClinicRoom" },
  service: { type: objectId, ref: "DentalService" },
  appointmentSlot: { type: objectId, ref: "AppointmentSlot" },
  startAt: Date,
  endAt: Date,
  status: String,
  paymentStatus: String,
  performedServices: [Schema.Types.Mixed],
  extraCosts: [Schema.Types.Mixed]
});

export const Invoice = model("Invoice", COLLECTIONS.invoices, {
  appointment: { type: objectId, ref: "Appointment" },
  patient: { type: objectId, ref: "User" },
  items: [Schema.Types.Mixed],
  total: Number,
  totalAmount: Number,
  paidAmount: Number,
  status: String,
  invoiceDate: Date,
  paidAt: Date
});

export const Payment = model("Payment", COLLECTIONS.payments, {
  invoice: { type: objectId, ref: "Invoice" },
  paymentMethod: String,
  amount: Number,
  paymentStatus: String,
  paymentDate: Date
});

export const TreatmentRecord = model("TreatmentRecord", COLLECTIONS.treatmentRecords, {
  appointment: { type: objectId, ref: "Appointment" },
  patient: { type: objectId, ref: "User" },
  dentist: { type: objectId, ref: "User" },
  nurse: { type: objectId, ref: "User" },
  serviceSnapshot: Schema.Types.Mixed,
  initialInfo: Schema.Types.Mixed,
  visits: [Schema.Types.Mixed],
  status: String
});

export const TreatmentPlan = model("TreatmentPlan", COLLECTIONS.treatmentPlans, {
  treatmentRecord: { type: objectId, ref: "TreatmentRecord" },
  dentist: { type: objectId, ref: "User" },
  planDetail: String,
  estimatedCost: Number,
  status: String
});

export const Review = model("Review", COLLECTIONS.reviews, {
  appointment: { type: objectId, ref: "Appointment" },
  patient: { type: objectId, ref: "User" },
  dentist: { type: objectId, ref: "User" },
  service: { type: objectId, ref: "DentalService" },
  rating: Number,
  comment: String,
  isHidden: { type: Boolean, default: false }
});

model("AdminProfile", COLLECTIONS.adminProfiles);
model("AppointmentSlot", COLLECTIONS.appointmentSlots);
model("ClinicSetting", COLLECTIONS.clinicSettings);
model("ClinicWorkingHour", COLLECTIONS.clinicWorkingHours);
model("ConsultationRequest", COLLECTIONS.consultationRequests);
model("DentistService", COLLECTIONS.dentistServices);
model("Notification", COLLECTIONS.notifications);
model("Prescription", COLLECTIONS.prescriptions);
model("RoomStatus", COLLECTIONS.roomStatuses);
model("StaffSchedule", COLLECTIONS.staffSchedules);
model("TimeSlot", COLLECTIONS.timeSlots);
