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
  loading,
  onCreateWorkingHour,
  onDeleteWorkingHour,
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
                      <button className="button small secondary" type="button" onClick={() => onUpdateWorkingHour(item)}>
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

    </>
  );
}
