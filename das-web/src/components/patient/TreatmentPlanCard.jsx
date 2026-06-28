import StatusBadge from "../StatusBadge.jsx";
import { formatMoney } from "../../utils/format.js";

export default function TreatmentPlanCard({ plan }) {
  return (
    <div className="record-card" key={plan._id}>
      <strong>{plan.treatmentRecord?.appointment?.service?.name || "Kế hoạch điều trị"}</strong>
      <p>{plan.planDetail || plan.treatmentRecord?.treatmentPlan || "Chưa có mô tả kế hoạch."}</p>
      <span className="mini">Bác sĩ: {plan.dentist?.fullName || plan.treatmentRecord?.dentist?.fullName || "-"}</span>
      <span className="mini">Chi phí dự kiến: {formatMoney(plan.estimatedCost || 0)}</span>
      <StatusBadge value={plan.status} />
    </div>
  );
}
