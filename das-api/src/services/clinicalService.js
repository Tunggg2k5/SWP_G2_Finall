import * as clinicalRepository from "../repository/clinicalRepository.js";
import { createAppointmentFromSlot } from "./schedulingService.js";
import { endOfLocalDay, startOfLocalDay } from "../utils/time.js";
import {
  clinicalRoomStatusSchema,
  createTreatmentPlanSchema,
  followUpAppointmentSchema,
  performedServicesSchema,
  treatmentRecordSchema,
  updateTreatmentPlanSchema
} from "../validations/clinicalValidation.js";

function createError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function sameId(left, right) {
  const leftId = left?._id || left;
  const rightId = right?._id || right;
  return leftId?.toString() === rightId?.toString();
}

function buildScheduleQuery(user, date, scopeByUser = true) {
  const visibleStatuses = user.role === "admin"
    ? ["scheduled", "confirmed", "checked_in", "in_treatment"]
    : ["scheduled", "confirmed", "checked_in", "in_treatment"];
  const query = { status: { $in: visibleStatuses } };
  if (scopeByUser && user.role === "dentist") query.dentist = user._id;
  if (scopeByUser && user.role === "nurse") query.nurse = user._id;
  if (date) {
    query.startAt = {
      $gte: startOfLocalDay(date),
      $lte: endOfLocalDay(date)
    };
  }
  return query;
}

function buildRecordQuery(user) {
  const query = {};
  if (user.role === "dentist") query.dentist = user._id;
  if (user.role === "nurse") query.nurse = user._id;
  return query;
}

function buildStaffScheduleQuery(user, date) {
  return {
    user: user._id,
    ...(date ? { workDate: startOfLocalDay(date) } : {})
  };
}

function formatClinicDateTime(value) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(new Date(value));
}

function legacyVisitFromRecord(record) {
  if (!record) return null;
  const hasLegacyData = [
    record.vitalSigns,
    record.diagnosis,
    record.medicalHistory,
    record.treatmentResult,
    record.treatmentNote,
    record.treatmentPlan,
    record.prescription,
    record.aftercareInstructions
  ].some(Boolean);
  if (!hasLegacyData) return null;

  return {
    visitNumber: 1,
    vitalSigns: record.vitalSigns || {},
    diagnosis: record.diagnosis || "",
    medicalHistory: record.medicalHistory || "",
    treatmentResult: record.treatmentResult || "",
    treatmentNote: record.treatmentNote || "",
    treatmentPlan: record.treatmentPlan || "",
    prescription: record.prescription || "",
    aftercareInstructions: record.aftercareInstructions || "",
    updatedAt: record.updatedAt || record.treatmentDate || new Date()
  };
}

function normalizeVisits(record) {
  const visits = Array.isArray(record?.visits) ? record.visits.filter(Boolean) : [];
  if (visits.length) {
    return visits
      .map((visit, index) => ({
        ...visit,
        visitNumber: Number(visit.visitNumber || index + 1)
      }))
      .sort((first, second) => first.visitNumber - second.visitNumber);
  }
  const legacyVisit = legacyVisitFromRecord(record);
  return legacyVisit ? [legacyVisit] : [];
}

function buildVisitPayload(data, visitNumber, user) {
  return {
    visitNumber,
    vitalSigns: data.vitalSigns || {},
    diagnosis: data.diagnosis || "",
    medicalHistory: data.medicalHistory || "",
    treatmentResult: data.treatmentResult || "",
    treatmentNote: data.treatmentNote || "",
    treatmentPlan: data.treatmentPlan || "",
    prescription: data.prescription || "",
    aftercareInstructions: data.aftercareInstructions || "",
    estimatedCost: data.estimatedCost || 0,
    updatedBy: user._id,
    updatedAt: new Date()
  };
}

async function assertPatientAccess(user, patientId) {
  if (user.role === "admin") return;

  const accessQuery = { patient: patientId };
  if (user.role === "dentist") accessQuery.dentist = user._id;
  if (user.role === "nurse") accessQuery.nurse = user._id;

  const relatedAppointment = await clinicalRepository.hasRelatedAppointment(accessQuery);
  if (!relatedAppointment) {
    throw createError("Bạn không có quyền xem thông tin bệnh nhân này.", 403);
  }
}

export async function getDashboard(user, query) {
  const [appointments, records, rooms, services, staffSchedules] = await Promise.all([
    clinicalRepository.findClinicalAppointments(buildScheduleQuery(user, query.date), 120, true),
    clinicalRepository.findClinicalTreatmentRecords(buildRecordQuery(user), 60, true),
    clinicalRepository.findClinicalRooms(true),
    clinicalRepository.findActiveDentalServices(),
    clinicalRepository.findStaffSchedules(buildStaffScheduleQuery(user, query.date), 20, true)
  ]);

  const visibleRooms = user.role === "dentist"
    ? rooms.filter((room) => sameId(room.assignedDentist, user._id) || appointments.some((appointment) => sameId(appointment.room, room._id)))
    : user.role === "nurse"
      ? rooms.filter((room) => sameId(room.assignedNurse, user._id) || appointments.some((appointment) => sameId(appointment.room, room._id)))
      : rooms;

  return { appointments, records, rooms: visibleRooms, services, staffSchedules };
}

export function getWorkSchedules(user, query) {
  return clinicalRepository.findStaffSchedules(buildStaffScheduleQuery(user, query.date), 60);
}

export function getSchedule(user, query) {
  return clinicalRepository.findClinicalAppointments(buildScheduleQuery(user, query.date, false), 200);
}

export function getTreatmentRecords(user) {
  return clinicalRepository.findClinicalTreatmentRecords(buildRecordQuery(user), 100);
}

export async function getPatientHistory(user, patientId) {
  if (user.role === "dentist") {
    const relatedAppointment = await clinicalRepository.hasRelatedAppointment({
      patient: patientId,
      dentist: user._id
    });

    if (!relatedAppointment) {
      throw createError("Bạn không có quyền xem lịch sử điều trị của bệnh nhân này.", 403);
    }
  }

  return clinicalRepository.findPatientTreatmentHistory(patientId);
}

export async function getPatientInformation(user, patientId) {
  await assertPatientAccess(user, patientId);

  const appointments = await clinicalRepository.findPatientAppointments(patientId);
  const patient = appointments[0]?.patient;
  if (!patient) {
    throw createError("Không tìm thấy thông tin bệnh nhân.", 404);
  }

  return { patient, appointments };
}

export async function upsertAppointmentTreatmentRecord(user, appointmentId, body) {
  const data = treatmentRecordSchema.parse(body);
  const appointment = await clinicalRepository.findAppointmentById(appointmentId);
  if (!appointment) throw createError("Không tìm thấy lịch hẹn.", 404);

  const canEdit =
    user.role === "admin" ||
    sameId(appointment.nurse, user._id) ||
    sameId(appointment.dentist, user._id);

  if (!canEdit) {
    throw createError("Chỉ nhân sự được phân công mới được cập nhật điều trị.", 403);
  }

  const existingRecord = await clinicalRepository.findTreatmentRecordByAppointment(appointment._id);
  const visitNumber = data.visitNumber || 1;
  const visits = normalizeVisits(existingRecord);
  if (visitNumber > visits.length + 1) {
    throw createError(`Cần cập nhật lần ${visits.length + 1} trước khi cập nhật lần ${visitNumber}.`, 409);
  }

  const visitPayload = buildVisitPayload(data, visitNumber, user);
  const existingVisitIndex = visits.findIndex((visit) => Number(visit.visitNumber) === visitNumber);
  if (existingVisitIndex >= 0) {
    visits[existingVisitIndex] = {
      ...visits[existingVisitIndex],
      ...visitPayload,
      createdAt: visits[existingVisitIndex].createdAt || visits[existingVisitIndex].updatedAt || new Date()
    };
  } else {
    visits.push({ ...visitPayload, createdAt: new Date() });
  }
  visits.sort((first, second) => first.visitNumber - second.visitNumber);

  const updateFields = {
    patient: appointment.patient,
    dentist: appointment.dentist,
    nurse: user.role === "nurse" ? user._id : appointment.nurse,
    treatmentDate: new Date(),
    visits,
    status: "active"
  };

  for (const field of ["vitalSigns", "diagnosis", "medicalHistory", "treatmentResult", "treatmentNote", "treatmentPlan", "prescription", "aftercareInstructions"]) {
    if (data[field] !== undefined) updateFields[field] = data[field];
  }

  const record = await clinicalRepository.upsertTreatmentRecord(appointment._id, updateFields);

  if (data.treatmentPlan) {
    await clinicalRepository.upsertTreatmentPlan(record._id, {
      treatmentRecord: record._id,
      dentist: appointment.dentist,
      planDetail: data.treatmentPlan,
      estimatedCost: data.estimatedCost || 0,
      startDate: new Date(),
      status: "active"
    });
  }

  return record;
}

export function getTreatmentPlans(user) {
  const query = {};
  if (user.role === "dentist") query.dentist = user._id;
  return clinicalRepository.findTreatmentPlans(query);
}

export async function createTreatmentPlan(user, appointmentId, body) {
  const data = createTreatmentPlanSchema.parse(body);
  const appointment = await clinicalRepository.findAppointmentById(appointmentId);
  if (!appointment) throw createError("Không tìm thấy lịch hẹn.", 404);

  if (user.role === "dentist" && !sameId(appointment.dentist, user._id)) {
    throw createError("Chỉ bác sĩ phụ trách mới được quản lý kế hoạch điều trị.", 403);
  }

  const record = await clinicalRepository.upsertTreatmentRecord(appointment._id, {
    patient: appointment.patient,
    dentist: appointment.dentist,
    nurse: appointment.nurse,
    diagnosis: data.diagnosis,
    treatmentPlan: data.treatmentPlan,
    treatmentNote: data.treatmentNote,
    treatmentDate: new Date(),
    status: "active"
  });

  const plan = await clinicalRepository.upsertTreatmentPlan(
    record._id,
    {
      treatmentRecord: record._id,
      dentist: appointment.dentist,
      planDetail: data.treatmentPlan,
      estimatedCost: data.estimatedCost,
      startDate: new Date(),
      status: "active"
    },
    true
  );

  return { plan, record };
}

export async function updateTreatmentPlan(user, planId, body) {
  const data = updateTreatmentPlanSchema.parse(body);
  const existing = await clinicalRepository.findTreatmentPlanById(planId);
  if (!existing) throw createError("Không tìm thấy kế hoạch điều trị.", 404);

  if (user.role === "dentist" && !sameId(existing.dentist, user._id)) {
    throw createError("Chỉ bác sĩ phụ trách mới được cập nhật kế hoạch điều trị.", 403);
  }

  Object.assign(existing, data);
  if (data.status === "completed") existing.endDate = new Date();
  const savedPlan = await clinicalRepository.saveTreatmentPlan(existing);

  if (data.planDetail) {
    await clinicalRepository.updateTreatmentRecordPlan(existing.treatmentRecord, data.planDetail);
  }

  return savedPlan;
}

export async function createFollowUpAppointment(user, appointmentId, body) {
  const data = followUpAppointmentSchema.parse(body);
  const source = await clinicalRepository.findAppointmentWithService(appointmentId);
  if (!source) throw createError("Không tìm thấy lịch hẹn gốc.", 404);

  if (user.role === "dentist" && !sameId(source.dentist, user._id)) {
    throw createError("Chỉ bác sĩ phụ trách mới được đặt lịch tái khám cho bệnh nhân này.", 403);
  }

  let roomId = data.roomId;
  if (!roomId && user.role === "dentist") {
    const room = await clinicalRepository.findAssignedDentistRoom(user._id);
    roomId = room?._id;
  }

  if (!roomId) {
    throw createError("Cần chọn phòng/bác sĩ để đặt lịch tái khám.", 400);
  }

  const appointment = await createAppointmentFromSlot({
    requester: user,
    patientId: source.patient,
    serviceId: data.serviceId || source.service?._id || source.service,
    date: data.date,
    startAt: data.startAt,
    roomId,
    channel: "offline",
    note: data.note || `Lịch tái khám từ lịch ${source.service?.name || "khám"}.`,
    dentistPreference: "selected"
  });

  await clinicalRepository.populateClinicalAppointment(appointment);

  await clinicalRepository.createNotification({
    user: appointment.patient?._id || appointment.patient,
    title: "Bác sĩ đã đặt lịch tái khám",
    message: `Lịch tái khám của bạn được đặt lúc ${formatClinicDateTime(appointment.startAt)} với ${appointment.dentist?.fullName || "bác sĩ"}.`,
    isRead: false
  });

  return appointment;
}

export async function updateClinicalRoomStatus(user, roomId, body) {
  const data = clinicalRoomStatusSchema.parse(body);
  const room = await clinicalRepository.updateRoomStatus(roomId, data);
  if (!room) throw createError("Không tìm thấy phòng khám.", 404);

  await clinicalRepository.createRoomStatus({
    room: room._id,
    nurse: user.role === "nurse" ? user._id : undefined,
    availabilityStatus: data.status,
    note: "Cập nhật trạng thái phòng từ bảng điều khiển lâm sàng."
  });

  return room;
}

export async function updatePerformedServices(user, appointmentId, body) {
  const data = performedServicesSchema.parse(body);
  const appointment = await clinicalRepository.findAppointmentById(appointmentId);
  if (!appointment) throw createError("Không tìm thấy lịch khám.", 404);

  const canEdit =
    user.role === "admin" ||
    sameId(appointment.nurse, user._id) ||
    sameId(appointment.dentist, user._id);

  if (!canEdit) {
    throw createError("Chỉ nhân sự được phân công mới được cập nhật dịch vụ đã thực hiện.", 403);
  }

  const services = data.services.map((item) => ({
    service: item.serviceId,
    name: item.name,
    amount: item.amount
  }));
  const extraCosts = data.extraCosts.map((item) => ({
    name: item.name,
    amount: item.amount
  }));
  const performedTotal = [...services, ...extraCosts].reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return clinicalRepository.updateAppointment(appointmentId, {
    performedServices: services,
    extraCosts,
    performedTotal
  });
}
