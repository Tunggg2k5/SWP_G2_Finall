import { FileText } from "lucide-react";
import EmptyState from "../EmptyState.jsx";

export default function ClinicalTreatmentHistory({ loading, records }) {
  return (
    <section className="panel">
      <div className="section-title">
        <FileText size={20} />
        <h2>Lịch sử điều trị</h2>
      </div>
      {loading ? (
        <EmptyState title="Đang tải lịch sử" text="Hệ thống đang lấy dữ liệu mới nhất." />
      ) : records.length ? (
        <div className="mini-list">
          {records.map((record) => (
            <div className="record-card" key={record._id}>
              <strong>{record.patient?.fullName}</strong>
              <p>{record.diagnosis || "Chưa có chẩn đoán"}</p>
              <span className="mini">{record.treatmentPlan || "Chưa có kế hoạch điều trị"}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Chưa có lịch sử" text="Hồ sơ điều trị của bệnh nhân sẽ hiển thị tại đây." />
      )}
    </section>
  );
}
