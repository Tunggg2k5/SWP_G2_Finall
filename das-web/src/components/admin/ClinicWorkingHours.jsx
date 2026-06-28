import { CalendarDays } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";

const dayNames = {
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7"
};

export default function ClinicWorkingHours({
  editingWorkingHour,
  loading,
  onCancelEditWorkingHour,
  onCreateWorkingHour,
  onDeleteWorkingHour,
  onEditingWorkingHourChange,
  onEditWorkingHour,
  onUpdateWorkingHour,
  onWorkingHourFormChange,
  workingHourForm,
  workingHours
}) {
  return (
    <>
      <section className="panel">
        <div className="section-title">
          <CalendarDays size={20} />
          <h2>Quản lý giờ làm phòng khám</h2>
        </div>
        <form className="form-grid" onSubmit={onCreateWorkingHour}>
          <label className="field">
            <span>Ngày trong tuần</span>
            <select value={workingHourForm.dayOfWeek} onChange={(event) => onWorkingHourFormChange({ dayOfWeek: event.target.value })}>
              {Object.entries(dayNames).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Tên ca</span>
            <input value={workingHourForm.shiftName} onChange={(event) => onWorkingHourFormChange({ shiftName: event.target.value })} />
          </label>
          <label className="field">
            <span>Bắt đầu</span>
            <input type="time" value={workingHourForm.startTime} onChange={(event) => onWorkingHourFormChange({ startTime: event.target.value })} />
          </label>
          <label className="field">
            <span>Kết thúc</span>
            <input type="time" value={workingHourForm.endTime} onChange={(event) => onWorkingHourFormChange({ endTime: event.target.value })} />
          </label>
          <button className="button primary">Thêm giờ làm</button>
        </form>
      </section>

      <section className="panel">
        <div className="section-title">
          <CalendarDays size={20} />
          <h2>Ca làm hiện tại</h2>
        </div>
        {loading ? (
          <EmptyState title="Đang tải giờ làm" text="Hệ thống đang lấy dữ liệu mới nhất." />
        ) : workingHours.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Ca</th>
                  <th>Giờ</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {workingHours.map((item) => (
                  <tr key={item._id}>
                    <td>{dayNames[item.dayOfWeek]}</td>
                    <td>{item.shiftName}</td>
                    <td>
                      {item.startTime} - {item.endTime}
                    </td>
                    <td>
                      <StatusBadge value={item.status} />
                    </td>
                    <td>
                      <button className="button small secondary" type="button" onClick={() => onEditWorkingHour(item)}>
                        Cập nhật
                      </button>
                      <button className="button small danger" type="button" onClick={() => onDeleteWorkingHour(item._id)}>
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState />
        )}
      </section>

      {editingWorkingHour && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onMouseDown={(event) => event.currentTarget === event.target && onCancelEditWorkingHour()}>
          <form className="account-modal panel" onSubmit={onUpdateWorkingHour}>
            <div className="section-title">
              <CalendarDays size={20} />
              <h2>Cập nhật giờ làm</h2>
            </div>
            <div className="form-grid account-form-grid">
              <label className="field">
                <span>Ngày trong tuần</span>
                <select value={editingWorkingHour.dayOfWeek} onChange={(event) => onEditingWorkingHourChange({ dayOfWeek: event.target.value })}>
                  {Object.entries(dayNames).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Tên ca</span>
                <input value={editingWorkingHour.shiftName} onChange={(event) => onEditingWorkingHourChange({ shiftName: event.target.value })} />
              </label>
              <label className="field">
                <span>Bắt đầu</span>
                <input type="time" value={editingWorkingHour.startTime} onChange={(event) => onEditingWorkingHourChange({ startTime: event.target.value })} />
              </label>
              <label className="field">
                <span>Kết thúc</span>
                <input type="time" value={editingWorkingHour.endTime} onChange={(event) => onEditingWorkingHourChange({ endTime: event.target.value })} />
              </label>
              <label className="field">
                <span>Trạng thái</span>
                <select value={editingWorkingHour.status} onChange={(event) => onEditingWorkingHourChange({ status: event.target.value })}>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Đã xóa</option>
                </select>
              </label>
            </div>
            <div className="row-actions">
              <button className="button primary">Lưu cập nhật</button>
              <button className="button ghost" type="button" onClick={onCancelEditWorkingHour}>
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
