import { DoorOpen } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function ClinicRoomManagement({
  dentistUsers,
  loading,
  nurseUsers,
  onCreateRoom,
  onDeleteRoom,
  onRoomFormChange,
  onUpdateRoom,
  roomForm,
  rooms
}) {
  return (
    <>
      <section className="panel">
        <div className="section-title">
          <DoorOpen size={20} />
          <h2>Tạo phòng khám</h2>
        </div>
        <form className="form-grid" onSubmit={onCreateRoom}>
          <label className="field">
            <span>Tên phòng</span>
            <input value={roomForm.name} onChange={(event) => onRoomFormChange({ name: event.target.value })} required />
          </label>
          <label className="field">
            <span>Bác sĩ phụ trách</span>
            <select value={roomForm.assignedDentist} onChange={(event) => onRoomFormChange({ assignedDentist: event.target.value })}>
              <option value="">Chưa gán</option>
              {dentistUsers.map((dentist) => (
                <option key={dentist._id} value={dentist._id}>
                  {dentist.fullName}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Y tá phụ trách</span>
            <select value={roomForm.assignedNurse} onChange={(event) => onRoomFormChange({ assignedNurse: event.target.value })}>
              <option value="">Không gán</option>
              {nurseUsers.map((nurse) => (
                <option key={nurse._id} value={nurse._id}>
                  {nurse.fullName}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Trạng thái</span>
            <select value={roomForm.status} onChange={(event) => onRoomFormChange({ status: event.target.value })}>
              <option value="available">Sẵn sàng</option>
              <option value="unavailable">Tạm ngưng</option>
            </select>
          </label>
          <button className="button primary">Thêm phòng</button>
        </form>
      </section>

      <section className="panel">
        <div className="section-title">
          <DoorOpen size={20} />
          <h2>Phòng khám</h2>
        </div>
        <div className="mini-list">
          {loading ? (
            <EmptyState title="Đang tải phòng khám" text="Hệ thống đang lấy dữ liệu mới nhất." />
          ) : rooms.map((room) => (
            <div className="mini-row" key={room._id}>
              <span>{room.name}</span>
              <span>{room.assignedDentist?.fullName || "Chưa gán bác sĩ"}</span>
              <span>{room.assignedNurse?.fullName || "Không gán y tá"}</span>
              <StatusBadge value={room.status} />
              <StatusBadge value={room.isActive ? "active" : "inactive"} />
              <button className="button small secondary" type="button" onClick={() => onUpdateRoom(room)}>
                Cập nhật
              </button>
              <button className="button small danger" type="button" onClick={() => onDeleteRoom(room)}>
                Xóa
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
