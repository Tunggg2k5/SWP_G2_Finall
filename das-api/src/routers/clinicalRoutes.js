import { Router } from "express";
import {
  createFollowUpAppointment,
  createTreatmentPlan,
  getDashboard,
  getPatientHistory,
  getPatientInformation,
  getSchedule,
  getTreatmentPlans,
  getTreatmentRecords,
  getWorkSchedules,
  updateClinicalRoomStatus,
  updatePerformedServices,
  updateTreatmentPlan,
  upsertAppointmentTreatmentRecord
} from "../controllers/clinicalController.js";
import { authorize, requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth, authorize("dentist", "nurse", "admin"));

router.get("/dashboard", getDashboard);
router.get("/work-schedules", getWorkSchedules);
router.get("/schedule", getSchedule);
router.get("/treatment-records", getTreatmentRecords);
router.get("/patients/:patientId/history", getPatientHistory);
router.get("/patients/:patientId", getPatientInformation);
router.put("/appointments/:appointmentId/treatment-record", authorize("dentist", "nurse", "admin"), upsertAppointmentTreatmentRecord);
router.put("/appointments/:appointmentId/performed-services", authorize("nurse", "admin"), updatePerformedServices);
router.get("/treatment-plans", authorize("dentist", "admin"), getTreatmentPlans);
router.post("/appointments/:appointmentId/treatment-plan", authorize("dentist", "admin"), createTreatmentPlan);
router.patch("/treatment-plans/:id", authorize("dentist", "admin"), updateTreatmentPlan);
router.post("/appointments/:appointmentId/follow-up", authorize("dentist", "admin"), createFollowUpAppointment);
router.patch("/rooms/:id/status", authorize("nurse", "admin"), updateClinicalRoomStatus);

export default router;
