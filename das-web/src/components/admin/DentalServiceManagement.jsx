import { Settings2 } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { formatMoney } from "../../utils/format.js";

export default function DentalServiceManagement({
  loading,
  onCreateService,
  onDeleteService,
  onServiceFormChange,
  onUpdateService,
  serviceForm,
  services
}) {
  return (
    <>
      <section className="panel">
        <div className="section-title">
          <Settings2 size={20} />
          <h2>Thêm dịch vụ nha khoa</h2>
        </div>
        <form className="stack" onSubmit={onCreateService}>
          <label className="field">
            <span>Tên dịch vụ</span>
            <input value={serviceForm.name} onChange={(event) => onServiceFormChange({ name: event.target.value })} required />
          </label>
          <label className="field">
            <span>Mô tả</span>
            <textarea value={serviceForm.description} onChange={(event) => onServiceFormChange({ description: event.target.value })} rows="3" />
          </label>
          <label className="field">
            <span>Giá tiền</span>
            <input
              min="0"
              step="1000"
              type="number"
              value={serviceForm.price}
              onChange={(event) => onServiceFormChange({ price: event.target.value })}
            />
          </label>
          <button className="button primary">Thêm dịch vụ</button>
        </form>
      </section>

      <section className="panel">
        <div className="section-title">
          <Settings2 size={20} />
          <h2>Dịch vụ</h2>
        </div>
        {loading ? (
          <EmptyState title="Đang tải dịch vụ" text="Hệ thống đang lấy dữ liệu mới nhất." />
        ) : (
          <div className="mini-list">
            {services.map((service) => (
              <div className="mini-row" key={service._id}>
                <span>{service.name}</span>
                <span>{service.description || "Chưa có mô tả"}</span>
                <strong>{formatMoney(Number(service.price || 0))}</strong>
                <StatusBadge value={service.isActive ? "active" : "inactive"} />
                <button className="button small secondary" type="button" onClick={() => onUpdateService(service)}>
                  Cập nhật
                </button>
                <button className="button small danger" type="button" onClick={() => onDeleteService(service)}>
                  Xóa
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
