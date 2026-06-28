export default function TreatmentRecordCard({ plan, record }) {
  return (
    <div className="record-card" key={record._id}>
      <strong>{record.appointment?.service?.name}</strong>
      <p>{record.diagnosis || "Chưa có chẩn đoán"}</p>
      <span className="mini">{record.treatmentResult || "Chưa có kết quả điều trị"}</span>
      <div className="appointment-subpanel treatment-plan-inline">
        <strong>Kế hoạch điều trị</strong>
        <span>{plan?.planDetail || record.treatmentPlan || "Chưa có kế hoạch điều trị"}</span>
      </div>
    </div>
  );
}
