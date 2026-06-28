import { Settings2 } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { formatMoney } from "../../utils/format.js";

export default function DentalServiceManagement({
  editingService,
  loading,
  onCancelEditService,
  onCreateService,
  onDeleteService,
  onEditingServiceChange,
  onEditService,
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
          <div className="form-grid account-form-grid">
            <label className="field">
              <span>Thời lượng (phút)</span>
              <input
                min="10"
                max="480"
                step="5"
                type="number"
                value={serviceForm.durationMinutes}
                onChange={(event) => onServiceFormChange({ durationMinutes: event.target.value })}
              />
            </label>
            <label className="field inline-check-field">
              <input
                type="checkbox"
                checked={Boolean(serviceForm.requiresPrepayment)}
                onChange={(event) => onServiceFormChange({ requiresPrepayment: event.target.checked })}
              />
              <span>Cần đặt cọc</span>
            </label>
            <label className="field inline-check-field">
              <input
                type="checkbox"
                checked={Boolean(serviceForm.isConsultation)}
                onChange={(event) => onServiceFormChange({ isConsultation: event.target.checked })}
              />
              <span>Dịch vụ tư vấn</span>
            </label>
          </div>
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
                <button className="button small secondary" type="button" onClick={() => onEditService(service)}>
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

      {editingService && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onMouseDown={(event) => event.currentTarget === event.target && onCancelEditService()}>
          <form className="account-modal panel" onSubmit={onUpdateService}>
            <div className="section-title">
              <Settings2 size={20} />
              <h2>Cập nhật dịch vụ</h2>
            </div>
            <label className="field">
              <span>Tên dịch vụ</span>
              <input value={editingService.name} onChange={(event) => onEditingServiceChange({ name: event.target.value })} required />
            </label>
            <label className="field">
              <span>Mô tả</span>
              <textarea value={editingService.description || ""} onChange={(event) => onEditingServiceChange({ description: event.target.value })} rows="3" />
            </label>
            <div className="form-grid account-form-grid">
              <label className="field">
                <span>Giá tiền</span>
                <input
                  min="0"
                  step="1000"
                  type="number"
                  value={editingService.price}
                  onChange={(event) => onEditingServiceChange({ price: event.target.value })}
                />
              </label>
              <label className="field">
                <span>Thời lượng (phút)</span>
                <input
                  min="10"
                  max="480"
                  step="5"
                  type="number"
                  value={editingService.durationMinutes}
                  onChange={(event) => onEditingServiceChange({ durationMinutes: event.target.value })}
                />
              </label>
              <label className="field">
                <span>Trạng thái</span>
                <select value={editingService.isActive ? "active" : "inactive"} onChange={(event) => onEditingServiceChange({ isActive: event.target.value === "active" })}>
                  <option value="active">Hiển thị</option>
                  <option value="inactive">Ẩn</option>
                </select>
              </label>
              <label className="field inline-check-field">
                <input
                  type="checkbox"
                  checked={Boolean(editingService.requiresPrepayment)}
                  onChange={(event) => onEditingServiceChange({ requiresPrepayment: event.target.checked })}
                />
                <span>Cần đặt cọc</span>
              </label>
              <label className="field inline-check-field">
                <input
                  type="checkbox"
                  checked={Boolean(editingService.isConsultation)}
                  onChange={(event) => onEditingServiceChange({ isConsultation: event.target.checked })}
                />
                <span>Dịch vụ tư vấn</span>
              </label>
            </div>
            <div className="row-actions">
              <button className="button primary">Lưu cập nhật</button>
              <button className="button ghost" type="button" onClick={onCancelEditService}>
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
