import { CalendarDays, DoorOpen } from "lucide-react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { formatTime } from "../../utils/format.js";
import ReceptionAppointmentFilters from "./ReceptionAppointmentFilters.jsx";

export default function ReceptionClinicalQueue({
  appointmentSearch,
  applyScheduleStatus,
  date,
  defaultStatusAction,
  dentistColumns,
  isLockedScheduleAppointment,
  loading,
  queueSlots,
  receptionStatusActionOptions,
  rooms,
  setAppointmentSearch,
  setDate,
  setStatusActions,
  statusActions
}) {
  return (
    <section className="panel reception-schedule-panel">
      <div className="section-title">
        <CalendarDays size={20} />
        <h2>Lịch khám theo thứ tự check-in</h2>
      </div>

      <div className="reception-room-status-grid">
        {rooms.map((room) => (
          <article className="reception-room-status-card" key={room._id}>
            <DoorOpen size={20} />
            <div>
              <strong>{room.name}</strong>
              <span>{room.assignedDentist?.fullName || "Chưa có bác sĩ phụ trách"}</span>
            </div>
            <StatusBadge value={room.status} />
          </article>
        ))}
      </div>

      <ReceptionAppointmentFilters
        date={date}
        setDate={setDate}
        appointmentSearch={appointmentSearch}
        setAppointmentSearch={setAppointmentSearch}
      />

      {loading ? (
        <EmptyState title="Đang tải lịch khám" text="Hệ thống đang lấy dữ liệu mới nhất." />
      ) : dentistColumns.length ? (
        <div className="reception-slot-board">
          <div
            className="reception-slot-grid reception-slot-grid-head"
            style={{ gridTemplateColumns: `130px repeat(${dentistColumns.length}, minmax(270px, 1fr))` }}
          >
            <div className="reception-slot-corner">Slot</div>
            {dentistColumns.map((dentist) => (
              <div className="reception-dentist-head" key={dentist._id}>
                <strong>{dentist.fullName}</strong>
                <span>{dentist.roomName || "Chưa gán phòng"}</span>
              </div>
            ))}
          </div>

          {queueSlots.map(({ slot, dentistQueues }) => (
            <div
              className="reception-slot-grid reception-slot-grid-row"
              style={{ gridTemplateColumns: `130px repeat(${dentistColumns.length}, minmax(270px, 1fr))` }}
              key={slot.slotId}
            >
              <div className="reception-slot-label">
                <strong>{slot.slotName}</strong>
                <span>{slot.timeLabel}</span>
              </div>
              {dentistQueues.map(({ dentist, appointments }) => (
                <div className="reception-dentist-queue" key={`${slot.slotId}-${dentist._id}`}>
                  {appointments.length ? (
                    appointments.map((appointment) => {
                      const locked = isLockedScheduleAppointment(appointment);
                      return (
                        <article className={`schedule-cell-card ${locked ? "locked" : ""}`} key={appointment._id}>
                          <div>
                            <strong>{appointment.patient?.fullName || "Bệnh nhân"}</strong>
                            <span>{appointment.service?.name || "Dịch vụ"} / {appointment.room?.name || "Phòng"}</span>
                            <span>Giờ khám: {formatTime(appointment.startAt)}</span>
                            {appointment.checkedInAt && <span>Có mặt: {formatTime(appointment.checkedInAt)}</span>}
                            <StatusBadge value={appointment.status} />
                            {locked && <small>Lịch đã hủy hoặc bị từ chối, không thể đổi trạng thái.</small>}
                          </div>
                          <div className="row-actions schedule-status-actions">
                            <select
                              value={statusActions[appointment._id] || defaultStatusAction(appointment)}
                              disabled={locked}
                              onChange={(event) =>
                                setStatusActions((current) => ({ ...current, [appointment._id]: event.target.value }))
                              }
                            >
                              {receptionStatusActionOptions.map((option) => (
                                <option value={option.value} key={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <button className="button small" disabled={locked} onClick={() => applyScheduleStatus(appointment)}>
                              Cập nhật
                            </button>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <span className="schedule-empty-cell">Chưa có bệnh nhân</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Chưa có bác sĩ trong hàng đợi" text="Bảng này sẽ hiển thị khi có bác sĩ hoặc phòng khám được gán trong dữ liệu hệ thống." />
      )}
    </section>
  );
}
