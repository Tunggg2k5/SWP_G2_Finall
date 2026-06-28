import { FileText } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import TreatmentRecordCard from "./TreatmentRecordCard.jsx";

export default function PatientTreatmentRecords({ loading, records, treatmentPlans = [] }) {
  const planByRecord = new Map(
    treatmentPlans
      .filter((plan) => plan.treatmentRecord?._id)
      .map((plan) => [plan.treatmentRecord._id, plan])
  );

  return (
    <section className="panel" id="records">
      <div className="section-title">
        <FileText size={20} />
        <h2>Hồ sơ điều trị</h2>
      </div>
      {loading ? (
        <EmptyState title="Đang tải hồ sơ" text="Hệ thống đang lấy dữ liệu mới nhất." />
      ) : records.length ? (
        <div className="mini-list">
          {records.map((record) => (
            <TreatmentRecordCard key={record._id} plan={planByRecord.get(record._id)} record={record} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </section>
  );
}
