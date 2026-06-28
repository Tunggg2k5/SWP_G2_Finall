import { ReceiptText } from "lucide-react";
import { useMemo, useState } from "react";
import EmptyState from "../EmptyState.jsx";
import StatusBadge from "../StatusBadge.jsx";
import { formatDateTime, formatMoney } from "../../utils/format.js";
import ReceptionAppointmentFilters from "./ReceptionAppointmentFilters.jsx";

const paymentMethodLabels = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  card: "Thẻ",
  online: "Online"
};

export default function ReceptionCheckInAppointments({
  appointmentSearch,
  checkInAppointments,
  date,
  generateInvoice,
  invoiceAmounts,
  loading,
  paymentAmounts,
  paymentMethods,
  processPayment,
  setAppointmentSearch,
  setDate,
  setInvoiceAmounts,
  setPaymentAmounts,
  setPaymentMethods
}) {
  const [invoiceFilter, setInvoiceFilter] = useState("unpaid");

  const filteredAppointments = useMemo(() => {
    return checkInAppointments.filter((appointment) => {
      const invoiceStatus = appointment.invoice?.status || "unpaid";
      return invoiceFilter === "all" || invoiceStatus === invoiceFilter;
    });
  }, [checkInAppointments, invoiceFilter]);

  function exportInvoice(appointment) {
    const invoice = appointment.invoice;
    const total = Number(invoice?.total || invoice?.totalAmount || 0);
    const paidAmount = Number(invoice?.paidAmount || 0);
    const items = invoice?.items?.length
      ? invoice.items
      : [{ name: appointment.service?.name || "Dịch vụ nha khoa", amount: total || Number(appointment.service?.price || 0) }];
    const lines = [
      "SMILECARE - HOA DON",
      `Benh nhan: ${appointment.patient?.fullName || "-"}`,
      `SDT: ${appointment.patient?.phone || "-"}`,
      `Ngay kham: ${formatDateTime(appointment.startAt)}`,
      "",
      "Dich vu:",
      ...items.map((item, index) => `${index + 1}. ${item.name}: ${formatMoney(Number(item.amount || item.price || 0))}`),
      "",
      `Tong tien: ${formatMoney(total)}`,
      `Da thanh toan: ${formatMoney(paidAmount)}`,
      `Con lai: ${formatMoney(Math.max(total - paidAmount, 0))}`,
      `Trang thai: ${invoice?.status || "unpaid"}`
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `hoa-don-${appointment.patient?.phone || appointment._id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="panel reception-checkin-panel">
      <div className="section-title">
        <ReceiptText size={20} />
        <h2>Hóa đơn và thanh toán</h2>
      </div>
      <p className="muted">Các lịch đã hoàn tất sẽ xuất hiện ở đây để lễ tân tạo hóa đơn và ghi nhận thanh toán.</p>

      <div className="toolbar-row">
        <label className="field inline-field">
          <span>Trạng thái thanh toán</span>
          <select value={invoiceFilter} onChange={(event) => setInvoiceFilter(event.target.value)}>
            <option value="unpaid">Chưa trả</option>
            <option value="partial">Trả 1 phần</option>
            <option value="paid">Đã trả đủ</option>
            <option value="all">Tất cả</option>
          </select>
        </label>
      </div>

      <ReceptionAppointmentFilters
        date={date}
        setDate={setDate}
        appointmentSearch={appointmentSearch}
        setAppointmentSearch={setAppointmentSearch}
        showDate={false}
      />

      {loading ? (
        <EmptyState title="Đang tải hóa đơn" text="Hệ thống đang lấy dữ liệu mới nhất." />
      ) : filteredAppointments.length ? (
        <div className="appointment-list checkin-list">
          {filteredAppointments.map((appointment) => {
            const invoice = appointment.invoice;
            const total = Number(invoice?.total || invoice?.totalAmount || 0);
            const paidAmount = Number(invoice?.paidAmount || 0);
            const remaining = Math.max(total - paidAmount, 0);
            return (
              <article className="appointment-card reception-checkin-card" key={appointment._id}>
                <div className="appointment-card-main">
                  <div className="patient-contact-row">
                    <div>
                      <h4>{appointment.patient?.fullName || "Bệnh nhân"}</h4>
                      <p>{appointment.patient?.phone || "Chưa có SĐT"}</p>
                    </div>
                    <StatusBadge value={appointment.status} />
                  </div>
                  <div className="appointment-slot-box">
                    <strong>{appointment.service?.name || "Dịch vụ"}</strong>
                    <span>{formatDateTime(appointment.startAt)}</span>
                    <span>Bác sĩ: {appointment.dentist?.fullName || "-"}</span>
                    {appointment.patientNote && <span>Ghi chú: {appointment.patientNote}</span>}
                  </div>
                  {invoice && (
                    <div className="invoice-payment-summary">
                      <strong>{formatMoney(paidAmount)} / {formatMoney(total)}</strong>
                      <StatusBadge value={invoice.status} />
                      <div className="invoice-items-list">
                        {(invoice.items || []).map((item, index) => (
                          <span key={`${invoice._id}-item-${index}`}>
                            {item.name}: {formatMoney(Number(item.amount || item.price || 0))}
                          </span>
                        ))}
                      </div>
                      <div className="invoice-items-list">
                        {(invoice.payments || []).map((payment, index) => (
                          <span key={payment._id || `${invoice._id}-payment-${index}`}>
                            Lần {index + 1}: {formatMoney(Number(payment.amount || 0))} - {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="row-actions schedule-status-actions checkin-status-actions">
                  {!invoice ? (
                    <>
                      <label className="payment-amount-field">
                        <span>Số tiền cần trả</span>
                        <input
                          type="number"
                          min="1"
                          step="1000"
                          value={invoiceAmounts[appointment._id] || ""}
                          onChange={(event) =>
                            setInvoiceAmounts((current) => ({
                              ...current,
                              [appointment._id]: event.target.value
                            }))
                          }
                          placeholder="Nhập số tiền"
                        />
                      </label>
                      <button className="button small ghost" type="button" onClick={() => generateInvoice(appointment)}>
                        Tạo hóa đơn
                      </button>
                    </>
                  ) : remaining > 0 ? (
                    <>
                      <label className="payment-amount-field">
                        <span>Số tiền bệnh nhân đã thanh toán</span>
                        <input
                          type="number"
                          min="1"
                          max={remaining}
                          step="1000"
                          value={paymentAmounts[appointment._id] || ""}
                          onChange={(event) =>
                            setPaymentAmounts((current) => ({
                              ...current,
                              [appointment._id]: event.target.value
                            }))
                          }
                          placeholder={String(remaining)}
                        />
                      </label>
                      <label className="payment-amount-field">
                        <span>Phương thức</span>
                        <select
                          value={paymentMethods[appointment._id] || "cash"}
                          onChange={(event) =>
                            setPaymentMethods((current) => ({
                              ...current,
                              [appointment._id]: event.target.value
                            }))
                          }
                        >
                          <option value="cash">Tiền mặt</option>
                          <option value="bank_transfer">Chuyển khoản</option>
                          <option value="card">Thẻ</option>
                          <option value="online">Online</option>
                        </select>
                      </label>
                      <button className="button small secondary" type="button" onClick={() => processPayment(appointment)}>
                        Thanh toán
                      </button>
                      <button className="button small ghost" type="button" onClick={() => exportInvoice(appointment)}>
                        Xuất hóa đơn
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="paid-complete-note">Đã thanh toán đủ</span>
                      <button className="button small ghost" type="button" onClick={() => exportInvoice(appointment)}>
                        Xuất hóa đơn
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Chưa có hóa đơn phù hợp" text="Mặc định màn này hiển thị các hóa đơn chưa trả." />
      )}
    </section>
  );
}
