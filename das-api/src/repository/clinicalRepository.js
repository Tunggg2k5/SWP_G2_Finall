import { getCollection, toObjectId } from "../config/mongodb.js";
import { COLLECTIONS } from "../models/collections.js";
import {
  findById,
  findMany,
  findOne,
  insertDocuments,
  normalizeIdFields,
  populate,
  updateById,
  updateOneAndReturn
} from "./mongoRepository.js";

const clinicalAppointmentPopulate = [
  { path: "patient", select: "fullName phone email" },
  { path: "dentist", select: "fullName" },
  { path: "nurse", select: "fullName" },
  { path: "room", select: "name status" },
  { path: "service", select: "name durationMinutes price" }
];

const treatmentRecordPopulate = [
  { path: "appointment", populate: { path: "service", select: "name" } },
  { path: "patient", select: "fullName phone email" },
  { path: "dentist", select: "fullName" },
  { path: "nurse", select: "fullName" }
];

const patientHistoryPopulate = [
  {
    path: "appointment",
    populate: [
      { path: "service", select: "name" },
      { path: "room", select: "name" }
    ]
  },
  { path: "patient", select: "fullName phone email" },
  { path: "dentist", select: "fullName" },
  { path: "nurse", select: "fullName" }
];

const treatmentPlanPopulate = [
  {
    path: "treatmentRecord",
    populate: [
      {
        path: "appointment",
        populate: [
          { path: "service", select: "name" },
          { path: "patient", select: "fullName phone" }
        ]
      },
      { path: "patient", select: "fullName phone" }
    ]
  },
  { path: "dentist", select: "fullName" }
];

const appointmentIdFields = ["patient", "dentist", "nurse", "room", "service"];

export async function findClinicalAppointments(query, limit = 120) {
  const appointments = await findMany(
    COLLECTIONS.appointments,
    normalizeIdFields(query, appointmentIdFields),
    { sort: { startAt: 1 }, limit }
  );
  await populate(appointments, clinicalAppointmentPopulate);
  return appointments;
}

export async function findClinicalTreatmentRecords(query, limit = 100) {
  const records = await findMany(
    COLLECTIONS.treatmentRecords,
    normalizeIdFields(query, ["patient", "dentist", "nurse", "appointment"]),
    { sort: { updatedAt: -1 }, limit }
  );
  await populate(records, treatmentRecordPopulate);
  return records;
}

export async function findClinicalRooms() {
  const rooms = await findMany(COLLECTIONS.clinicRooms, { isActive: { $ne: false } }, { sort: { name: 1 } });
  await populate(rooms, [
    { path: "assignedDentist", select: "fullName" },
    { path: "assignedNurse", select: "fullName phone" }
  ]);
  return rooms;
}

export function findActiveDentalServices() {
  return findMany(COLLECTIONS.dentalServices, { isActive: true }, { sort: { name: 1 } });
}

export async function findStaffSchedules(query, limit = 60) {
  const schedules = await findMany(
    COLLECTIONS.staffSchedules,
    normalizeIdFields(query, ["user", "timeSlot", "room"]),
    { sort: { workDate: 1, startTime: 1 }, limit }
  );
  await populate(schedules, [
    { path: "timeSlot", select: "slotName startTime endTime" },
    { path: "room", select: "name status" }
  ]);
  return schedules;
}

export async function hasRelatedAppointment(query) {
  const appointment = await findOne(
    COLLECTIONS.appointments,
    normalizeIdFields(query, appointmentIdFields),
    "_id"
  );
  return Boolean(appointment);
}

export async function findPatientAppointments(patientId) {
  const appointments = await findMany(
    COLLECTIONS.appointments,
    { patient: toObjectId(patientId) },
    { sort: { startAt: -1 }, limit: 10 }
  );
  await populate(appointments, [
    { path: "patient", select: "fullName phone email gender address" },
    { path: "service", select: "name" },
    { path: "dentist", select: "fullName" },
    { path: "room", select: "name" }
  ]);
  return appointments;
}

export async function findPatientTreatmentHistory(patientId) {
  const records = await findMany(
    COLLECTIONS.treatmentRecords,
    { patient: toObjectId(patientId) },
    { sort: { treatmentDate: -1, updatedAt: -1 }, limit: 50 }
  );
  await populate(records, patientHistoryPopulate);
  return records;
}

export function findAppointmentById(appointmentId) {
  return findById(COLLECTIONS.appointments, appointmentId);
}

export async function updateAppointment(appointmentId, data) {
  const appointment = await updateById(COLLECTIONS.appointments, appointmentId, data);
  await populate(appointment, clinicalAppointmentPopulate);
  return appointment;
}

export async function findAppointmentWithService(appointmentId) {
  const appointment = await findAppointmentById(appointmentId);
  await populate(appointment, { path: "service", select: "name" });
  return appointment;
}

export function findAssignedDentistRoom(dentistId) {
  return findOne(
    COLLECTIONS.clinicRooms,
    { assignedDentist: toObjectId(dentistId), isActive: true },
    "_id"
  );
}

export async function upsertTreatmentRecord(appointmentId, update) {
  const record = await updateOneAndReturn(
    COLLECTIONS.treatmentRecords,
    { appointment: toObjectId(appointmentId) },
    { ...update, appointment: toObjectId(appointmentId) },
    { upsert: true }
  );
  await populate(record, [
    { path: "appointment", populate: { path: "service", select: "name" } },
    { path: "patient", select: "fullName phone email" }
  ]);
  return record;
}

export async function upsertTreatmentPlan(treatmentRecordId, update, populateDentist = false) {
  const plan = await updateOneAndReturn(
    COLLECTIONS.treatmentPlans,
    { treatmentRecord: toObjectId(treatmentRecordId) },
    { ...update, treatmentRecord: toObjectId(treatmentRecordId) },
    { upsert: true }
  );
  if (populateDentist) await populate(plan, { path: "dentist", select: "fullName" });
  return plan;
}

export async function findTreatmentPlans(query) {
  const plans = await findMany(
    COLLECTIONS.treatmentPlans,
    normalizeIdFields(query, ["treatmentRecord", "dentist"]),
    { sort: { updatedAt: -1 }, limit: 100 }
  );
  await populate(plans, treatmentPlanPopulate);
  return plans;
}

export function findTreatmentPlanById(planId) {
  return findById(COLLECTIONS.treatmentPlans, planId);
}

export function saveTreatmentPlan(plan) {
  const update = { ...plan };
  delete update._id;
  if (update.treatmentRecord?._id) update.treatmentRecord = update.treatmentRecord._id;
  if (update.dentist?._id) update.dentist = update.dentist._id;
  return updateById(COLLECTIONS.treatmentPlans, plan._id, update);
}

export function updateTreatmentRecordPlan(recordId, planDetail) {
  return updateById(COLLECTIONS.treatmentRecords, recordId, { treatmentPlan: planDetail });
}

export function updateRoomStatus(roomId, data) {
  return updateById(COLLECTIONS.clinicRooms, roomId, data);
}

export function createRoomStatus(data) {
  return insertDocuments(COLLECTIONS.roomStatuses, data);
}

export function createNotification(data) {
  return insertDocuments(COLLECTIONS.notifications, { isRead: false, ...data });
}

export function populateClinicalAppointment(appointment) {
  return populate(appointment, clinicalAppointmentPopulate);
}
