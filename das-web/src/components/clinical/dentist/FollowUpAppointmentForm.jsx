import { CalendarPlus } from "lucide-react";
import { bookingSlotOptions } from "../../../pages/BookingPage.jsx";
import { formatDateTime, todayInput } from "../../../utils/format.js";

export default function FollowUpAppointmentForm({
  appointments,
  canEditAppointment,
  form,
  onChange,
  onSelectAppointment,
  onSubmit,
  rooms,
  selectedAppointment,
  user
}) {
  return (
    <section className="panel clinical-followup-panel">
      <div className="section-title">
        <CalendarPlus size={20} />
        <h2>Đặt lịch tái khám</h2>
      </div>
      <form className="form-grid" onSubmit={onSubmit}>
        <label className="field wide">
          <span>Bệnh nhân</span>
          <select value={form.appointmentId} onChange={(event) => onSelectAppointment(event.target.value)}>
            <option value="">Chọn bệnh nhân từ lịch khám</option>
            {appointments
              .filter((appointment) => canEditAppointment(user, appointment))
              .map((appointment) => (
                <option key={appointment._id} value={appointment._id}>
                  {appointment.patient?.fullName || "Bệnh nhân"} - {appointment.service?.name || "Dịch vụ"}
                </option>
              ))}
          </select>
        </label>
        <label className="field">
          <span>Bác sĩ / phòng</span>
          <select value={form.roomId} onChange={(event) => onChange("roomId", event.target.value)}>
            <option value="">Chọn bác sĩ</option>
            {rooms.map((room) => (
              <option key={room._id} value={room._id}>
                {room.assignedDentist?.fullName || room.name} - {room.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Ngày tái khám</span>
          <input type="date" min={todayInput()} value={form.date} onChange={(event) => onChange("date", event.target.value)} />
        </label>
        <label className="field">
          <span>Giờ tái khám</span>
          <select value={form.time} onChange={(event) => onChange("time", event.target.value)}>
            {bookingSlotOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field wide">
          <span>Ghi chú</span>
          <textarea value={form.note} onChange={(event) => onChange("note", event.target.value)} rows="3" />
        </label>
        {selectedAppointment && (
          <div className="clinical-selected-card wide">
            <strong>{selectedAppointment.patient?.fullName}</strong>
            <span>Lịch gốc: {formatDateTime(selectedAppointment.startAt)} / {selectedAppointment.service?.name}</span>
          </div>
        )}
        <button className="button primary">Đặt tái khám</button>
      </form>
    </section>
  );
}
