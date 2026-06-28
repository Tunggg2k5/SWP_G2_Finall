import { DoorOpen } from "lucide-react";
import EmptyState from "../../EmptyState.jsx";
import StatusBadge from "../../StatusBadge.jsx";

export default function ClinicalRoomStatus({ loading, rooms, onSetRoomStatus }) {
  return (
    <section className="panel">
      <div className="section-title">
        <DoorOpen size={20} />
        <h2>Cập nhật trạng thái phòng</h2>
      </div>
      <div className="room-grid">
        {loading ? (
          <EmptyState title="Đang tải phòng khám" text="Hệ thống đang lấy dữ liệu mới nhất." />
        ) : rooms.length ? (
          rooms.map((room) => (
            <article className="room-card" key={room._id}>
              <h4>{room.name}</h4>
              <span className="mini">{room.assignedDentist?.fullName || "Chưa gán bác sĩ"}</span>
              <StatusBadge value={room.status} />
              <div className="row-actions">
                <button className="button small" onClick={() => onSetRoomStatus(room._id, "cleaning")}>
                  Vệ sinh
                </button>
                <button className="button small" onClick={() => onSetRoomStatus(room._id, "available")}>
                  Sẵn sàng
                </button>
              </div>
            </article>
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}
