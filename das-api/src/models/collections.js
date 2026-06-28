export const COLLECTIONS = Object.freeze({
  adminProfiles: "adminprofiles",
  appointments: "appointments",
  appointmentSlots: "appointmentslots",
  clinicSettings: "clinicsettings",
  clinicRooms: "clinicrooms",
  clinicWorkingHours: "clinicworkinghours",
  consultationRequests: "consultationrequests",
  dentalServices: "dentalservices",
  dentists: "dentists",
  dentistServices: "dentistservices",
  invoices: "invoices",
  notifications: "notifications",
  nurses: "nurses",
  patients: "patients",
  payments: "payments",
  prescriptions: "prescriptions",
  receptionists: "receptionists",
  reviews: "reviews",
  roles: "roles",
  roomStatuses: "roomstatuses",
  staffSchedules: "staffschedules",
  timeSlots: "timeslots",
  treatmentPlans: "treatmentplans",
  treatmentRecords: "treatmentrecords",
  users: "users"
});

export const COLLECTION_INDEXES = Object.freeze({
  [COLLECTIONS.users]: [
    { key: { email: 1 }, options: { unique: true, sparse: true } },
    { key: { phone: 1 }, options: { unique: true } },
    { key: { role: 1, status: 1 } }
  ],
  [COLLECTIONS.roles]: [{ key: { roleName: 1 }, options: { unique: true } }],
  [COLLECTIONS.clinicSettings]: [{ key: { key: 1 }, options: { unique: true } }],
  [COLLECTIONS.adminProfiles]: [{ key: { user: 1 }, options: { unique: true } }],
  [COLLECTIONS.patients]: [{ key: { user: 1 }, options: { unique: true } }],
  [COLLECTIONS.receptionists]: [{ key: { user: 1 }, options: { unique: true } }],
  [COLLECTIONS.dentists]: [
    { key: { user: 1 }, options: { unique: true } },
    { key: { status: 1 } }
  ],
  [COLLECTIONS.nurses]: [{ key: { user: 1 }, options: { unique: true } }],
  [COLLECTIONS.dentistServices]: [{ key: { dentist: 1, service: 1 }, options: { unique: true } }],
  [COLLECTIONS.clinicRooms]: [
    { key: { name: 1 }, options: { unique: true } },
    { key: { status: 1, isActive: 1 } }
  ],
  [COLLECTIONS.clinicWorkingHours]: [
    { key: { dayOfWeek: 1, shiftName: 1 }, options: { unique: true } }
  ],
  [COLLECTIONS.timeSlots]: [
    { key: { slotName: 1, startTime: 1, endTime: 1 }, options: { unique: true } }
  ],
  [COLLECTIONS.staffSchedules]: [
    { key: { user: 1, workDate: 1, timeSlot: 1 }, options: { unique: true } },
    { key: { user: 1, workDate: 1, startTime: 1, endTime: 1 } },
    { key: { room: 1, workDate: 1, startTime: 1, endTime: 1 } }
  ],
  [COLLECTIONS.appointmentSlots]: [
    { key: { dentist: 1, startAt: 1 } },
    { key: { room: 1, startAt: 1 } },
    { key: { status: 1, slotDate: 1 } }
  ],
  [COLLECTIONS.appointments]: [
    { key: { room: 1, startAt: 1, endAt: 1 } },
    { key: { patient: 1, startAt: -1 } },
    { key: { patient: 1, status: 1, startAt: 1, endAt: 1 } },
    { key: { dentist: 1, startAt: -1 } },
    { key: { status: 1, startAt: 1 } }
  ],
  [COLLECTIONS.invoices]: [{ key: { patient: 1, createdAt: -1 } }],
  [COLLECTIONS.notifications]: [{ key: { user: 1, isRead: 1, createdAt: -1 } }],
  [COLLECTIONS.payments]: [{ key: { invoice: 1, paymentDate: -1 } }],
  [COLLECTIONS.reviews]: [{ key: { dentist: 1, createdAt: -1 } }],
  [COLLECTIONS.roomStatuses]: [{ key: { room: 1, updatedAt: -1 } }],
  [COLLECTIONS.prescriptions]: [{ key: { treatmentRecord: 1, createdAt: -1 } }],
  [COLLECTIONS.treatmentPlans]: [{ key: { treatmentRecord: 1 }, options: { unique: true } }],
  [COLLECTIONS.treatmentRecords]: [{ key: { appointment: 1 }, options: { unique: true } }]
});

export const RELATION_COLLECTIONS = Object.freeze({
  appointment: COLLECTIONS.appointments,
  appointmentSlot: COLLECTIONS.appointmentSlots,
  assignedDentist: COLLECTIONS.users,
  assignedNurse: COLLECTIONS.users,
  cancelledBy: COLLECTIONS.users,
  confirmationBy: COLLECTIONS.users,
  createdBy: COLLECTIONS.users,
  dentist: COLLECTIONS.users,
  handledBy: COLLECTIONS.users,
  invoice: COLLECTIONS.invoices,
  nurse: COLLECTIONS.users,
  patient: COLLECTIONS.users,
  receptionist: COLLECTIONS.users,
  roleRef: COLLECTIONS.roles,
  room: COLLECTIONS.clinicRooms,
  service: COLLECTIONS.dentalServices,
  timeSlot: COLLECTIONS.timeSlots,
  treatmentRecord: COLLECTIONS.treatmentRecords,
  user: COLLECTIONS.users,
  workingHour: COLLECTIONS.clinicWorkingHours
});
