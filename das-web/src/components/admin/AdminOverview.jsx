import { BarChart3, Settings2, ShieldCheck, UsersRound } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import { formatMoney } from "../../utils/format.js";
import { formatInheritanceChain } from "../../utils/roles.js";
import AdminMetric from "./AdminMetric.jsx";

function formatProfileCollection(value) {
  if (!value) return "Không có hồ sơ riêng";
  return value;
}

export default function AdminOverview({ loading, roleHierarchy, stats }) {
  return (
    <>
      {loading ? (
        <section className="panel">
          <EmptyState title="Đang tải thống kê" text="Hệ thống đang lấy dữ liệu mới nhất." />
        </section>
      ) : (
        <section className="metrics-grid">
          <AdminMetric icon={BarChart3} label="Doanh thu" value={formatMoney(stats?.revenue || 0)} />
          <AdminMetric icon={UsersRound} label="Bệnh nhân" value={stats?.patientCount || 0} />
          <AdminMetric icon={ShieldCheck} label="Vắng mặt" value={stats?.noShowCount || 0} />
          <AdminMetric icon={Settings2} label="Đánh giá" value={Number(stats?.review?.average || 0).toFixed(1)} />
          <AdminMetric icon={UsersRound} label="Bệnh nhân mới" value={stats?.newPatientCount || 0} />
          <AdminMetric icon={UsersRound} label="Quay lại" value={stats?.returningPatientCount || 0} />
        </section>
      )}

      <section className="panel">
        <div className="section-title">
          <ShieldCheck size={20} />
          <h2>Vai trò hệ thống</h2>
        </div>
        {loading ? (
          <EmptyState title="Đang tải phân quyền" text="Hệ thống đang lấy dữ liệu mới nhất." />
        ) : (
          <div className="inheritance-grid">
            {roleHierarchy.map((role) => (
              <article className="inheritance-card" key={role.role}>
                <strong>{role.label}</strong>
                <span>{formatInheritanceChain(role.inheritanceChain, role.label)}</span>
                <small>{role.abstract ? "Nhóm phân quyền" : `Hồ sơ: ${formatProfileCollection(role.profileCollection)}`}</small>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="section-title">
          <Settings2 size={20} />
          <h2>Dịch vụ được sử dụng nhiều</h2>
        </div>
        {stats?.serviceUsage?.length ? (
          <div className="mini-list">
            {stats.serviceUsage.map((item) => (
              <div className="mini-row" key={item._id || item.serviceName}>
                <span>{item.serviceName || "Dịch vụ"}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Chưa có dữ liệu dịch vụ" text="Dữ liệu sẽ xuất hiện khi có lịch hẹn." />
        )}
      </section>
    </>
  );
}
