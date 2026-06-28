import { useMemo, useState } from "react";
import { ClipboardPenLine } from "lucide-react";
import StatusBadge from "../StatusBadge.jsx";
import { formatDateTime } from "../../utils/format.js";

export default function ClinicalTreatmentForm({
  appointments,
  form,
  onChange,
  onSubmit,
  records = [],
  selectedAppointment,
  user
}) {
  const isNurse = user?.role === "nurse";
  const isDentist = user?.role === "dentist";
  const [dentistSearch, setDentistSearch] = useState("");
  const [activeRecordIndex, setActiveRecordIndex] = useState(0);
  const [activeVisit, setActiveVisit] = useState(1);
  const [visitCount, setVisitCount] = useState(5);

  const selectedPatientId = selectedAppointment?.patient?._id || selectedAppointment?.patient;
  const dentistRecords = useMemo(() => {
    const keyword = dentistSearch.trim().toLowerCase();
    return records
      .filter((record) => {
        const patientId = record.patient?._id || record.patient;
        const bySelectedAppointment = selectedPatientId ? patientId?.toString?.() === selectedPatientId?.toString?.() : true;
        if (!keyword) return bySelectedAppointment;
        const name = record.patient?.fullName?.toLowerCase?.() || "";
        const phone = record.patient?.phone?.toLowerCase?.() || "";
        return name.includes(keyword) || phone.includes(keyword);
      })
      .sort((first, second) => new Date(second.treatmentDate || second.updatedAt || 0) - new Date(first.treatmentDate || first.updatedAt || 0));
  }, [dentistSearch, records, selectedPatientId]);
  const activeRecord = dentistRecords[Math.min(activeRecordIndex, Math.max(dentistRecords.length - 1, 0))];

  function addVisitPage() {
    setVisitCount((current) => current + 1);
    setActiveVisit(visitCount + 1);
  }

  return (
    <section className="panel clinical-treatment-panel">
      <div className="section-title">
        <ClipboardPenLine size={20} />
        <h2>Hồ sơ điều trị</h2>
      </div>
      <form className="stack" onSubmit={onSubmit}>
        <label className="field">
          <span>Lịch khám</span>
          <select value={form.appointmentId} onChange={(event) => onChange("appointmentId", event.target.value)}>
            <option value="">Chọn lịch khám</option>
            {appointments.map((appointment) => (
              <option key={appointment._id} value={appointment._id}>
                {appointment.patient?.fullName || "Bệnh nhân"} - {appointment.service?.name || "Dịch vụ"} - {formatDateTime(appointment.startAt)}
              </option>
            ))}
          </select>
        </label>

        {selectedAppointment && (
          <div className="clinical-selected-card">
            <strong>{selectedAppointment.patient?.fullName}</strong>
            <span>{selectedAppointment.service?.name} / {selectedAppointment.room?.name}</span>
            <StatusBadge value={selectedAppointment.status} />
          </div>
        )}

        {isDentist ? (
          <div className="clinical-record-browser">
            <label className="field">
              <span>Tìm hồ sơ theo tên hoặc SĐT</span>
              <input
                value={dentistSearch}
                onChange={(event) => {
                  setDentistSearch(event.target.value);
                  setActiveRecordIndex(0);
                }}
                placeholder="Nhập tên hoặc số điện thoại bệnh nhân"
              />
            </label>
            {dentistRecords.length ? (
              <>
                <div className="treatment-page-tabs">
                  {dentistRecords.map((record, index) => (
                    <button
                      className={index === Math.min(activeRecordIndex, dentistRecords.length - 1) ? "active" : ""}
                      key={record._id || index}
                      onClick={() => setActiveRecordIndex(index)}
                      type="button"
                    >
                      Lần {dentistRecords.length - index}
                    </button>
                  ))}
                </div>
                <div className="readonly-record-grid">
                  <div className="clinical-selected-card wide">
                    <strong>{activeRecord.patient?.fullName || "Bệnh nhân"}</strong>
                    <span>{activeRecord.patient?.phone || "Chưa có SĐT"}</span>
                    <span>{formatDateTime(activeRecord.treatmentDate || activeRecord.updatedAt)}</span>
                  </div>
                  <ReadOnlyField label="Huyết áp" value={activeRecord.vitalSigns?.bloodPressure} />
                  <ReadOnlyField label="Nhịp tim" value={activeRecord.vitalSigns?.heartRate} />
                  <ReadOnlyField label="SpO2" value={activeRecord.vitalSigns?.spo2} />
                  <ReadOnlyField label="Nhiệt độ" value={activeRecord.vitalSigns?.temperature} />
                  <ReadOnlyField label="Nhịp thở" value={activeRecord.vitalSigns?.respiratoryRate} />
                  <ReadOnlyField label="Chẩn đoán" value={activeRecord.diagnosis} wide />
                  <ReadOnlyField label="Điều trị đã thực hiện" value={activeRecord.treatmentResult} wide />
                  <ReadOnlyField label="Đơn thuốc" value={activeRecord.prescription} wide />
                  <ReadOnlyField label="Điều trị dự kiến" value={activeRecord.treatmentPlan} wide />
                  <ReadOnlyField label="Hướng dẫn sau điều trị" value={activeRecord.aftercareInstructions} wide />
                  <ReadOnlyField label="Ghi chú điều trị" value={activeRecord.treatmentNote} wide />
                </div>
              </>
            ) : (
              <div className="empty-state">
                <strong>Không có hồ sơ điều trị</strong>
                <span>Không tìm thấy hồ sơ điều trị phù hợp với bệnh nhân hoặc từ khóa hiện tại.</span>
              </div>
            )}
          </div>
        ) : isNurse ? (
          <div className="form-grid">
            <div className="treatment-page-tabs wide">
              {Array.from({ length: visitCount }, (_, index) => (
                <button
                  className={activeVisit === index + 1 ? "active" : ""}
                  key={index + 1}
                  onClick={() => setActiveVisit(index + 1)}
                  type="button"
                >
                  Lần {index + 1}
                </button>
              ))}
              <button className="add-page" onClick={addVisitPage} type="button">
                +
              </button>
            </div>
            <div className="clinical-selected-card wide">
              <strong>Trang {activeVisit}</strong>
              <span>{activeVisit === 1 ? "Lần điều trị đầu tiên" : `Lần điều trị ${activeVisit}`}</span>
            </div>
            <label className="field">
              <span>Huyết áp</span>
              <input disabled={isDentist} value={form.bloodPressure} onChange={(event) => onChange("bloodPressure", event.target.value)} />
            </label>
            <label className="field">
              <span>Nhịp tim</span>
              <input disabled={isDentist} value={form.heartRate} onChange={(event) => onChange("heartRate", event.target.value)} />
            </label>
            <label className="field">
              <span>SpO2</span>
              <input disabled={isDentist} value={form.spo2} onChange={(event) => onChange("spo2", event.target.value)} />
            </label>
            <label className="field">
              <span>Nhiệt độ</span>
              <input disabled={isDentist} value={form.temperature} onChange={(event) => onChange("temperature", event.target.value)} />
            </label>
            <label className="field">
              <span>Nhịp thở</span>
              <input disabled={isDentist} value={form.respiratoryRate} onChange={(event) => onChange("respiratoryRate", event.target.value)} />
            </label>
            <label className="field wide">
              <span>Ghi chú hỗ trợ chẩn đoán</span>
              <textarea disabled={isDentist} value={form.treatmentNote} onChange={(event) => onChange("treatmentNote", event.target.value)} rows="3" />
            </label>
            <label className="field wide">
              <span>Chẩn đoán</span>
              <textarea disabled={isDentist} value={form.diagnosis} onChange={(event) => onChange("diagnosis", event.target.value)} rows="3" />
            </label>
            <label className="field wide">
              <span>Điều trị đã thực hiện</span>
              <textarea disabled={isDentist} value={form.treatmentResult} onChange={(event) => onChange("treatmentResult", event.target.value)} rows="3" />
            </label>
            <label className="field wide">
              <span>Đơn thuốc</span>
              <textarea disabled={isDentist} value={form.prescription} onChange={(event) => onChange("prescription", event.target.value)} rows="3" />
            </label>
            <label className="field wide">
              <span>Điều trị dự kiến</span>
              <textarea disabled={isDentist} value={form.treatmentPlan} onChange={(event) => onChange("treatmentPlan", event.target.value)} rows="3" />
            </label>
            <label className="field wide">
              <span>Hướng dẫn sau điều trị</span>
              <textarea disabled={isDentist} value={form.aftercareInstructions} onChange={(event) => onChange("aftercareInstructions", event.target.value)} rows="3" />
            </label>
          </div>
        ) : (
          <>
            {isDentist && (
              <div className="form-grid">
                <label className="field">
                  <span>Huyết áp</span>
                  <input disabled value={form.bloodPressure} onChange={(event) => onChange("bloodPressure", event.target.value)} />
                </label>
                <label className="field">
                  <span>Nhịp tim</span>
                  <input disabled value={form.heartRate} onChange={(event) => onChange("heartRate", event.target.value)} />
                </label>
                <label className="field">
                  <span>SpO2</span>
                  <input disabled value={form.spo2} onChange={(event) => onChange("spo2", event.target.value)} />
                </label>
                <label className="field">
                  <span>Nhiệt độ</span>
                  <input disabled value={form.temperature} onChange={(event) => onChange("temperature", event.target.value)} />
                </label>
                <label className="field">
                  <span>Nhịp thở</span>
                  <input disabled value={form.respiratoryRate} onChange={(event) => onChange("respiratoryRate", event.target.value)} />
                </label>
              </div>
            )}
            <label className="field">
              <span>Chẩn đoán</span>
              <textarea disabled={isDentist} value={form.diagnosis} onChange={(event) => onChange("diagnosis", event.target.value)} rows="3" />
            </label>
            <label className="field">
              <span>Điều trị dự kiến</span>
              <textarea disabled={isDentist} value={form.treatmentPlan} onChange={(event) => onChange("treatmentPlan", event.target.value)} rows="3" />
            </label>
            <label className="field">
              <span>Đơn thuốc</span>
              <textarea disabled={isDentist} value={form.prescription} onChange={(event) => onChange("prescription", event.target.value)} rows="3" />
            </label>
            <div className="form-grid">
              <label className="field">
                <span>Chi phí dự kiến</span>
                <input disabled={isDentist} type="number" min="0" value={form.estimatedCost} onChange={(event) => onChange("estimatedCost", event.target.value)} />
              </label>
              <label className="field">
                <span>Điều trị đã thực hiện</span>
                <input disabled={isDentist} value={form.treatmentResult} onChange={(event) => onChange("treatmentResult", event.target.value)} />
              </label>
            </div>
            <label className="field">
              <span>Ghi chú điều trị</span>
              <textarea disabled={isDentist} value={form.treatmentNote} onChange={(event) => onChange("treatmentNote", event.target.value)} rows="3" />
            </label>
            <label className="field">
              <span>Hướng dẫn sau điều trị</span>
              <textarea disabled={isDentist} value={form.aftercareInstructions} onChange={(event) => onChange("aftercareInstructions", event.target.value)} rows="3" />
            </label>
          </>
        )}
        {!isDentist && (
          <div className="row-actions clinical-treatment-actions">
            <button className="button primary">{isNurse ? "Lưu thông tin chung" : "Lưu điều trị"}</button>
          </div>
        )}
      </form>
    </section>
  );
}

function ReadOnlyField({ label, value, wide = false }) {
  return (
    <div className={`readonly-record-field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <strong>{value || "Chưa cập nhật"}</strong>
    </div>
  );
}
