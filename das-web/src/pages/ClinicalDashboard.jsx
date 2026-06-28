import { ClipboardPenLine, DoorOpen, ReceiptText, Stethoscope } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ClinicalTreatmentForm from "../components/clinical/ClinicalTreatmentForm.jsx";
import ClinicalWorkSchedule from "../components/clinical/ClinicalWorkSchedule.jsx";
import ClinicalPerformedServices from "../components/clinical/nurse/ClinicalPerformedServices.jsx";
import ClinicalRoomStatus from "../components/clinical/nurse/ClinicalRoomStatus.jsx";
import Feedback from "../components/Feedback.jsx";
import { useAuth } from "../redux/AuthContext.jsx";
import { api, getErrorMessage } from "../utils/api.js";
import { todayInput } from "../utils/format.js";

function getClinicalFeatures(role) {
  return [
    { id: "schedule", label: "Lịch khám", icon: Stethoscope },
    { id: "treatment", label: "Hồ sơ điều trị", icon: ClipboardPenLine },
    ...(role === "nurse" ? [{ id: "performedServices", label: "Dịch vụ đã làm", icon: ReceiptText }] : []),
    ...(role === "nurse" ? [{ id: "rooms", label: "Cập nhật phòng", icon: DoorOpen }] : [])
  ];
}

const defaultRecordForm = {
  appointmentId: "",
  bloodPressure: "",
  heartRate: "",
  spo2: "",
  temperature: "",
  respiratoryRate: "",
  diagnosis: "",
  treatmentResult: "",
  treatmentNote: "",
  treatmentPlan: "",
  prescription: "",
  aftercareInstructions: "",
  estimatedCost: ""
};

const defaultPerformedServicesForm = {
  appointmentId: "",
  services: {},
  extraCosts: []
};

export default function ClinicalDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const clinicalFeatures = useMemo(() => getClinicalFeatures(user?.role), [user?.role]);
  const [activeFeature, setActiveFeature] = useState("schedule");
  const [date, setDate] = useState(todayInput());
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [services, setServices] = useState([]);
  const [staffSchedules, setStaffSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordForm, setRecordForm] = useState(defaultRecordForm);
  const [performedServicesForm, setPerformedServicesForm] = useState(defaultPerformedServicesForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/clinical/dashboard", { params: { date } });
      const nextAppointments = res.data.appointments || [];
      const nextRooms = res.data.rooms || [];
      const nextServices = res.data.services || [];

      setAppointments(nextAppointments);
      setRecords(res.data.records || []);
      setRooms(nextRooms);
      setServices(nextServices);
      setStaffSchedules(res.data.staffSchedules || []);
      setRecordForm((current) => ({
        ...current,
        appointmentId: current.appointmentId || nextAppointments[0]?._id || ""
      }));
      setPerformedServicesForm((current) => ({
        ...current,
        appointmentId: current.appointmentId || nextAppointments[0]?._id || ""
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [date]);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab && clinicalFeatures.some((item) => item.id === tab)) {
      setActiveFeature(tab);
    } else if (!clinicalFeatures.some((item) => item.id === activeFeature)) {
      setActiveFeature("schedule");
    }
  }, [activeFeature, clinicalFeatures, location.search]);

  const clinicalColumns = useMemo(() => buildClinicalColumns(appointments, rooms), [appointments, rooms]);
  const clinicalRows = useMemo(() => buildClinicalRows(appointments, clinicalColumns), [appointments, clinicalColumns]);
  const selectedAppointment = appointments.find((appointment) => appointment._id === recordForm.appointmentId);
  const selectedPerformedAppointment = appointments.find((appointment) => appointment._id === performedServicesForm.appointmentId);

  function updateRecord(field, value) {
    setRecordForm((current) => ({ ...current, [field]: value }));
  }

  function updatePerformedServices(field, value) {
    setPerformedServicesForm((current) => ({ ...current, [field]: value }));
  }

  function openFeature(featureId) {
    setActiveFeature(featureId);
    navigate(`/dashboard?tab=${featureId}`, { replace: true });
  }

  function selectTreatmentAppointment(appointment) {
    const appointmentPatientId = appointment.patient?._id || appointment.patient;
    const matchingRecords = records.filter((record) => {
      const recordPatientId = record.patient?._id || record.patient;
      return recordPatientId?.toString?.() === appointmentPatientId?.toString?.();
    });
    if (user?.role === "dentist") {
      if (!matchingRecords.length) {
        setError("Không có hồ sơ điều trị của bệnh nhân này.");
        return;
      }
    }
    const latestRecord = matchingRecords[0];
    setRecordForm((current) => ({
      ...current,
      appointmentId: appointment._id,
      bloodPressure: latestRecord?.vitalSigns?.bloodPressure || "",
      heartRate: latestRecord?.vitalSigns?.heartRate || "",
      spo2: latestRecord?.vitalSigns?.spo2 || "",
      temperature: latestRecord?.vitalSigns?.temperature || "",
      respiratoryRate: latestRecord?.vitalSigns?.respiratoryRate || "",
      diagnosis: latestRecord?.diagnosis || "",
      treatmentResult: latestRecord?.treatmentResult || "",
      treatmentNote: latestRecord?.treatmentNote || "",
      treatmentPlan: latestRecord?.treatmentPlan || "",
      prescription: latestRecord?.prescription || "",
      aftercareInstructions: latestRecord?.aftercareInstructions || "",
      estimatedCost: latestRecord?.estimatedCost || ""
    }));
    openFeature("treatment");
  }

  function selectPerformedServicesAppointment(appointment) {
    const serviceState = {};
    (appointment.performedServices || []).forEach((item) => {
      const serviceId = item.service?._id || item.service;
      if (serviceId) {
        serviceState[serviceId] = {
          selected: true,
          name: item.name,
          amount: item.amount
        };
      }
    });
    setPerformedServicesForm({
      appointmentId: appointment._id,
      services: serviceState,
      extraCosts: appointment.extraCosts || []
    });
    openFeature("performedServices");
  }

  function togglePerformedService(service, selected, amount = null) {
    setPerformedServicesForm((current) => ({
      ...current,
      services: {
        ...current.services,
        [service._id]: {
          selected,
          name: service.name,
          amount: amount ?? current.services[service._id]?.amount ?? service.price ?? 0
        }
      }
    }));
  }

  function addExtraCost() {
    setPerformedServicesForm((current) => ({
      ...current,
      extraCosts: [...current.extraCosts, { name: "", amount: "" }]
    }));
  }

  function updateExtraCost(index, field, value) {
    setPerformedServicesForm((current) => ({
      ...current,
      extraCosts: current.extraCosts.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    }));
  }

  function removeExtraCost(index) {
    setPerformedServicesForm((current) => ({
      ...current,
      extraCosts: current.extraCosts.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  async function submitRecord(event) {
    event.preventDefault();
    if (!recordForm.appointmentId) {
      setError("Chọn lịch khám trước khi lưu điều trị.");
      return;
    }

    try {
      setError("");
      setMessage("");
      const payload = user?.role === "nurse"
        ? {
            vitalSigns: {
              bloodPressure: recordForm.bloodPressure,
              heartRate: recordForm.heartRate,
              spo2: recordForm.spo2,
              temperature: recordForm.temperature,
              respiratoryRate: recordForm.respiratoryRate
            },
            treatmentNote: recordForm.treatmentNote,
            diagnosis: recordForm.diagnosis,
            treatmentResult: recordForm.treatmentResult,
            treatmentPlan: recordForm.treatmentPlan,
            prescription: recordForm.prescription,
            aftercareInstructions: recordForm.aftercareInstructions
          }
        : {
            diagnosis: recordForm.diagnosis,
            treatmentResult: recordForm.treatmentResult,
            treatmentNote: recordForm.treatmentNote,
            treatmentPlan: recordForm.treatmentPlan,
            prescription: recordForm.prescription,
            aftercareInstructions: recordForm.aftercareInstructions,
            estimatedCost: Number(recordForm.estimatedCost || 0)
          };
      await api.put(`/clinical/appointments/${recordForm.appointmentId}/treatment-record`, payload);
      setMessage(user?.role === "nurse" ? "Đã lưu thông tin chung." : "Đã lưu thông tin điều trị.");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function submitPerformedServices(event) {
    event.preventDefault();
    if (!performedServicesForm.appointmentId) {
      setError("Chọn lịch khám trước khi xác nhận dịch vụ.");
      return;
    }

    const selectedServices = Object.entries(performedServicesForm.services)
      .filter(([, item]) => item.selected)
      .map(([serviceId, item]) => ({
        serviceId,
        name: item.name,
        amount: Number(item.amount || 0)
      }));
    const extraCosts = performedServicesForm.extraCosts
      .filter((item) => item.name || Number(item.amount || 0) > 0)
      .map((item) => ({
        name: item.name || "Chi phí khác",
        amount: Number(item.amount || 0)
      }));

    if (!selectedServices.length && !extraCosts.length) {
      setError("Chọn ít nhất một dịch vụ hoặc chi phí khác.");
      return;
    }

    try {
      setError("");
      setMessage("");
      await api.put(`/clinical/appointments/${performedServicesForm.appointmentId}/performed-services`, {
        services: selectedServices.length ? selectedServices : extraCosts,
        extraCosts: selectedServices.length ? extraCosts : []
      });
      setMessage("Đã gửi dịch vụ đã thực hiện về phần hóa đơn của lễ tân.");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function setRoomStatus(roomId, status) {
    try {
      setError("");
      setMessage("");
      await api.patch(`/clinical/rooms/${roomId}/status`, { status });
      setMessage("Đã cập nhật trạng thái phòng khám.");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="page-grid clinical-dashboard">
      <Feedback error={error} message={message} />

      {activeFeature === "schedule" && (
        <ClinicalWorkSchedule
          appointments={appointments}
          canEditAppointment={canEditAppointment}
          clinicalColumns={clinicalColumns}
          clinicalRows={clinicalRows}
          date={date}
          isLockedAppointment={isLockedAppointment}
          loading={loading}
          onDateChange={setDate}
          onSelectTreatment={selectTreatmentAppointment}
          onSelectPerformedServices={selectPerformedServicesAppointment}
          rooms={rooms}
          staffSchedules={staffSchedules}
          user={user}
        />
      )}

      {activeFeature === "treatment" && (
        <ClinicalTreatmentForm
          appointments={appointments}
          form={recordForm}
          onChange={updateRecord}
          onSubmit={submitRecord}
          records={records}
          selectedAppointment={selectedAppointment}
          user={user}
        />
      )}

      {activeFeature === "performedServices" && user?.role === "nurse" && (
        <ClinicalPerformedServices
          appointments={appointments}
          form={performedServicesForm}
          onAddExtraCost={addExtraCost}
          onChange={updatePerformedServices}
          onExtraCostChange={updateExtraCost}
          onRemoveExtraCost={removeExtraCost}
          onSubmit={submitPerformedServices}
          onToggleService={togglePerformedService}
          selectedAppointment={selectedPerformedAppointment}
          services={services}
        />
      )}

      {activeFeature === "rooms" && user?.role === "nurse" && (
        <ClinicalRoomStatus loading={loading} onSetRoomStatus={setRoomStatus} rooms={rooms} />
      )}
    </div>
  );
}

function buildClinicalColumns(appointments, rooms) {
  const columns = new Map();
  rooms.forEach((room) => {
    if (room.assignedDentist?._id && !columns.has(room.assignedDentist._id)) {
      columns.set(room.assignedDentist._id, {
        _id: room.assignedDentist._id,
        fullName: room.assignedDentist.fullName,
        roomName: room.name
      });
    }
  });
  appointments.forEach((appointment) => {
    if (appointment.dentist?._id && !columns.has(appointment.dentist._id)) {
      columns.set(appointment.dentist._id, {
        _id: appointment.dentist._id,
        fullName: appointment.dentist.fullName,
        roomName: appointment.room?.name
      });
    }
  });

  return Array.from(columns.values());
}

function buildClinicalRows(appointments, columns) {
  const grouped = new Map(columns.map((column) => [column._id, []]));
  appointments
    .slice()
    .sort((first, second) => queueSortValue(first) - queueSortValue(second))
    .forEach((appointment) => {
      const dentistId = appointment.dentist?._id;
      if (grouped.has(dentistId)) {
        grouped.get(dentistId).push(appointment);
      }
    });

  const rowCount = Math.max(1, ...columns.map((column) => grouped.get(column._id)?.length || 0));
  return Array.from({ length: rowCount }, (_, index) => ({
    index: index + 1,
    cells: columns.map((column) => grouped.get(column._id)?.[index] || null)
  }));
}

function queueSortValue(appointment) {
  return new Date(appointment.checkedInAt || appointment.checkInTime || appointment.startAt || 0).getTime();
}

function canEditAppointment(user, appointment) {
  return user?.role === "admin" || appointment.nurse?._id === user?._id || appointment.dentist?._id === user?._id;
}

function isLockedAppointment(appointment) {
  return ["cancelled", "no_show", "rejected"].includes(appointment.status);
}
