import { FileText } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import TreatmentPlanCard from "./TreatmentPlanCard.jsx";

export default function PatientTreatmentPlans({ loading, treatmentPlans }) {
  return (
    <section className="panel" id="plans">
      <div className="section-title">
        <FileText size={20} />
        <h2>Kế hoạch điều trị</h2>
      </div>
      {loading ? (
        <EmptyState title="Đang tải kế hoạch" text="Hệ thống đang lấy dữ liệu mới nhất." />
      ) : treatmentPlans.length ? (
        <div className="mini-list">
          {treatmentPlans.map((plan) => (
            <TreatmentPlanCard key={plan._id} plan={plan} />
          ))}
        </div>
      ) : (
        <EmptyState title="Chưa có kế hoạch" text="Kế hoạch điều trị sẽ hiển thị sau khi bác sĩ tạo hồ sơ." />
      )}
    </section>
  );
}
