import {
  closeMongoDB,
  connectMongoDB,
  getCollection
} from "../config/mongodb.js";
import { getInheritanceChain, ROLE_HIERARCHY } from "../config/roleHierarchy.js";
import { COLLECTIONS } from "../models/collections.js";
import { insertDocuments } from "../repository/mongoRepository.js";
import { hashPassword } from "./password.js";
import { addMinutes, combineDateAndTime, isWorkingDate, toDateInputValue } from "./time.js";

function nextWorkingDates(count, offsetDays = 1) {
  const dates = [];
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  while (dates.length < count) {
    const dateText = toDateInputValue(date);
    if (isWorkingDate(dateText)) dates.push(dateText);
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

function previousWorkingDates(count) {
  const dates = [];
  const date = new Date();
  date.setDate(date.getDate() - 1);

  while (dates.length < count) {
    const dateText = toDateInputValue(date);
    if (isWorkingDate(dateText)) dates.push(dateText);
    date.setDate(date.getDate() - 1);
  }
  return dates;
}

async function clearDatabase() {
  await Promise.all(
    Object.values(COLLECTIONS).map((collectionName) =>
      getCollection(collectionName).deleteMany({})
    )
  );
}

async function createRoles() {
  const roleDocuments = Object.entries(ROLE_HIERARCHY).map(([roleName, config]) => ({
    roleName,
    parentRoleName: config.parent,
    isAbstract: config.abstract,
    inheritanceChain: getInheritanceChain(roleName),
    description: config.description
  }));
  const createdRoles = await insertDocuments(COLLECTIONS.roles, roleDocuments);
  return Object.fromEntries(createdRoles.map((role) => [role.roleName, role]));
}

async function createWorkingCalendar() {
  const workingHours = [];
  for (const dayOfWeek of [1, 2, 3, 4, 5, 6]) {
    workingHours.push(
      {
        dayOfWeek,
        shiftName: "Ca sÃ¡ng",
        startTime: "08:00",
        endTime: "11:30",
        status: "active"
      },
      {
        dayOfWeek,
        shiftName: "Ca chiá»u",
        startTime: "14:00",
        endTime: "17:30",
        status: "active"
      }
    );
  }
  await insertDocuments(COLLECTIONS.clinicWorkingHours, workingHours);
}

async function createClinicSettings() {
  await insertDocuments(COLLECTIONS.clinicSettings, {
    key: "public",
    clinicName: "SmileCare",
    hotline: "1900 8888",
    address: "150 Hai BÃ  TrÆ°ng, Quáº­n 1, TP. Há»“ ChÃ­ Minh",
    branches: [
      {
        id: "smilecare-q1",
        province: "TP. Há»“ ChÃ­ Minh",
        branch: "SmileCare Quáº­n 1 - 150 Hai BÃ  TrÆ°ng"
      }
    ],
    faqs: [
      {
        question: "TÃ´i cÃ³ thá»ƒ thay Ä‘á»•i lá»‹ch háº¹n sau khi Ä‘áº·t khÃ´ng?",
        answer: "Báº¡n cÃ³ thá»ƒ thay Ä‘á»•i bÃ¡c sÄ©, ngÃ y hoáº·c slot khÃ¡m. Lá»‹ch thay Ä‘á»•i sáº½ Ä‘Æ°á»£c gá»­i láº¡i cho lá»… tÃ¢n xÃ¡c nháº­n."
      },
      {
        question: "Náº¿u tÃ´i khÃ´ng chá»n bÃ¡c sÄ© thÃ¬ sao?",
        answer: "Lá»… tÃ¢n sáº½ sáº¯p xáº¿p bÃ¡c sÄ© vÃ  gá»­i thá»i gian khÃ¡m Ä‘Ã£ xÃ¡c nháº­n cho báº¡n."
      },
      {
        question: "TÃ´i cáº§n lÃ m gÃ¬ khi quÃªn máº­t kháº©u?",
        answer: "Vui lÃ²ng sá»­ dá»¥ng má»¥c QuÃªn máº­t kháº©u Ä‘á»ƒ xem sá»‘ Ä‘iá»‡n thoáº¡i lá»… tÃ¢n vÃ  liÃªn há»‡ há»— trá»£."
      }
    ]
  });
}

const dentistProfiles = [
  {
    fullName: "BS. Nguyá»…n Minh Anh",
    email: "dentist1@das.local",
    phone: "0902000001",
    yearsOfExperience: 9,
    bio: "CÃ³ kinh nghiá»‡m thÄƒm khÃ¡m, tÆ° váº¥n káº¿ hoáº¡ch Ä‘iá»u trá»‹ vÃ  theo dÃµi tiáº¿n trÃ¬nh chÄƒm sÃ³c rÄƒng miá»‡ng cho bá»‡nh nhÃ¢n.",
    avatarUrl: "/assets/doctors/doctor-minh-anh.png"
  },
  {
    fullName: "BS. Tráº§n HoÃ ng Nam",
    email: "dentist2@das.local",
    phone: "0902000002",
    yearsOfExperience: 12,
    bio: "Phá»¥ trÃ¡ch thÄƒm khÃ¡m, tÆ° váº¥n phÆ°Æ¡ng Ã¡n Ä‘iá»u trá»‹ phÃ¹ há»£p vÃ  phá»‘i há»£p cÃ¹ng Ä‘á»™i ngÅ© lÃ¢m sÃ ng trong tá»«ng ca khÃ¡m.",
    avatarUrl: "/assets/doctors/doctor-hoang-nam.png"
  },
  {
    fullName: "BS. LÃª Thanh Vy",
    email: "dentist3@das.local",
    phone: "0902000003",
    yearsOfExperience: 7,
    bio: "Táº­p trung vÃ o tráº£i nghiá»‡m thÄƒm khÃ¡m nháº¹ nhÃ ng, giáº£i thÃ­ch rÃµ káº¿ hoáº¡ch Ä‘iá»u trá»‹ vÃ  hÆ°á»›ng dáº«n chÄƒm sÃ³c sau khÃ¡m.",
    avatarUrl: "/assets/doctors/doctor-thanh-vy.png"
  }
];

async function seedUsers(roles, passwordHash) {
  const admin = await insertDocuments(COLLECTIONS.users, {
    fullName: "Quáº£n trá»‹ SmileCare",
    email: "admin@das.local",
    phone: "0900000000",
    role: "admin",
    roleRef: roles.admin._id,
    status: "active",
    gender: "unknown",
    passwordHash
  });
  await insertDocuments(COLLECTIONS.adminProfiles, {
    user: admin._id,
    position: "Quáº£n trá»‹ há»‡ thá»‘ng phÃ²ng khÃ¡m",
    permissionLevel: "super_admin",
    status: "active"
  });

  const receptionists = await insertDocuments(
    COLLECTIONS.users,
    Array.from({ length: 2 }, (_, index) => ({
      fullName: `Lá»… tÃ¢n ${index + 1}`,
      email: `receptionist${index + 1}@das.local`,
      phone: `090100000${index + 1}`,
      role: "receptionist",
      roleRef: roles.receptionist._id,
      status: "active",
      gender: "unknown",
      passwordHash
    }))
  );
  await insertDocuments(
    COLLECTIONS.receptionists,
    receptionists.map((user) => ({ user: user._id, status: "active" }))
  );

  const dentists = await insertDocuments(
    COLLECTIONS.users,
    dentistProfiles.map((dentist) => ({
      ...dentist,
      role: "dentist",
      roleRef: roles.dentist._id,
      status: "active",
      gender: "unknown",
      passwordHash
    }))
  );
  await insertDocuments(
    COLLECTIONS.dentists,
    dentists.map((user, index) => ({
      user: user._id,
      qualification: "BÃ¡c sÄ© RÄƒng HÃ m Máº·t",
      experienceYears: dentistProfiles[index].yearsOfExperience,
      description: dentistProfiles[index].bio,
      status: "active"
    }))
  );

  const nurses = await insertDocuments(
    COLLECTIONS.users,
    Array.from({ length: 3 }, (_, index) => ({
      fullName: `Y tÃ¡ ${index + 1}`,
      email: `nurse${index + 1}@das.local`,
      phone: `090300000${index + 1}`,
      role: "nurse",
      roleRef: roles.nurse._id,
      status: "active",
      gender: "unknown",
      yearsOfExperience: 2 + index,
      passwordHash
    }))
  );
  await insertDocuments(
    COLLECTIONS.nurses,
    nurses.map((user) => ({
      user: user._id,
      qualification: "Y tÃ¡ Ä‘Ã£ Ä‘Äƒng kÃ½",
      status: "active"
    }))
  );

  const patientSamples = [
    { fullName: "Nguyá»…n VÄƒn An", phone: "0911000001", gender: "male", address: "Quáº­n 1", medicalNote: "ChÆ°a ghi nháº­n dá»‹ á»©ng." },
    { fullName: "Tráº§n Thá»‹ BÃ¬nh", phone: "0911000002", gender: "female", address: "Quáº­n 3", medicalNote: "Æ¯u tiÃªn lá»‹ch buá»•i chiá»u." },
    { fullName: "LÃª Minh ChÃ¢u", phone: "0911000003", gender: "female", address: "Quáº­n BÃ¬nh Tháº¡nh", medicalNote: "Dá»‹ á»©ng Penicillin." },
    { fullName: "Pháº¡m Quá»‘c DÅ©ng", phone: "0911000004", gender: "male", address: "ThÃ nh phá»‘ Thá»§ Äá»©c", medicalNote: "CÃ³ tiá»n sá»­ cao huyáº¿t Ã¡p." },
    { fullName: "HoÃ ng Gia HÃ¢n", phone: "0911000005", gender: "female", address: "Quáº­n 7", medicalNote: "ChÆ°a ghi nháº­n bá»‡nh ná»n." }
  ];
  const patients = await insertDocuments(
    COLLECTIONS.users,
    patientSamples.map((patient, index) => ({
      fullName: patient.fullName,
      email: `patient${index + 1}@das.local`,
      phone: patient.phone,
      role: "patient",
      roleRef: roles.patient._id,
      status: "active",
      gender: patient.gender,
      address: patient.address,
      passwordHash
    }))
  );
  await insertDocuments(
    COLLECTIONS.patients,
    patients.map((user, index) => ({
      user: user._id,
      gender: patientSamples[index].gender,
      address: patientSamples[index].address,
      medicalNote: patientSamples[index].medicalNote
    }))
  );

  return { admin, receptionists, dentists, nurses, patients };
}

async function seedClinic(dentists, nurses) {
  const services = await insertDocuments(COLLECTIONS.dentalServices, [
    {
      name: "TrÃ¡m rÄƒng",
      description: "Phá»¥c há»“i vÃ¹ng rÄƒng tá»•n thÆ°Æ¡ng vÃ  hÆ°á»›ng dáº«n chÄƒm sÃ³c sau Ä‘iá»u trá»‹.",
      durationMinutes: 30,
      transitionTime: 10,
      price: 300000,
      requiresPrepayment: true,
      isConsultation: false,
      isActive: true
    },
    {
      name: "Nhá»• rÄƒng khÃ´n",
      description: "ThÄƒm khÃ¡m, cháº©n Ä‘oÃ¡n vÃ  thá»±c hiá»‡n nhá»• rÄƒng theo chá»‰ Ä‘á»‹nh cá»§a bÃ¡c sÄ©.",
      durationMinutes: 60,
      transitionTime: 10,
      price: 1500000,
      requiresPrepayment: true,
      isConsultation: false,
      isActive: true
    },
    {
      name: "TÆ° váº¥n nha khoa",
      description: "TÆ° váº¥n cho bá»‡nh nhÃ¢n chÆ°a xÃ¡c Ä‘á»‹nh rÃµ tÃ¬nh tráº¡ng rÄƒng miá»‡ng.",
      durationMinutes: 30,
      transitionTime: 10,
      price: 0,
      requiresPrepayment: false,
      isConsultation: true,
      isActive: true
    },
    {
      name: "Cáº¡o vÃ´i rÄƒng",
      description: "LÃ m sáº¡ch máº£ng bÃ¡m, vÃ´i rÄƒng vÃ  hÆ°á»›ng dáº«n vá»‡ sinh rÄƒng miá»‡ng.",
      durationMinutes: 30,
      transitionTime: 10,
      price: 250000,
      requiresPrepayment: true,
      isConsultation: false,
      isActive: true
    },
    {
      name: "Táº©y tráº¯ng rÄƒng",
      description: "Cáº£i thiá»‡n mÃ u rÄƒng theo tÃ¬nh tráº¡ng thá»±c táº¿ vÃ  chá»‰ Ä‘á»‹nh chuyÃªn mÃ´n.",
      durationMinutes: 45,
      transitionTime: 10,
      price: 1200000,
      requiresPrepayment: true,
      isConsultation: false,
      isActive: true
    }
  ]);

  await getCollection(COLLECTIONS.dentalServices).updateMany(
    { name: { $in: ["Trám răng", "TrÃ¡m rÄƒng"] } },
    { $set: { name: "Trám răng", price: "800000" } }
  );
  await getCollection(COLLECTIONS.dentalServices).updateMany(
    { name: { $in: ["Nhổ răng khôn", "Nhá»• rÄƒng khÃ´n"] } },
    { $set: { name: "Nhổ răng", price: "1500000" } }
  );
  await getCollection(COLLECTIONS.dentalServices).updateMany(
    { name: { $in: ["Tư vấn nha khoa", "TÆ° váº¥n nha khoa"] } },
    { $set: { name: "Tư vấn niềng răng", price: "500000", isConsultation: true } }
  );
  await getCollection(COLLECTIONS.dentalServices).updateMany(
    { name: { $in: ["Cạo vôi răng", "Cáº¡o vÃ´i rÄƒng"] } },
    { $set: { name: "Cạo vôi răng", price: "500000" } }
  );
  await getCollection(COLLECTIONS.dentalServices).updateMany(
    { name: { $in: ["Tẩy trắng răng", "Táº©y tráº¯ng rÄƒng"] } },
    { $set: { name: "Tẩy trắng răng", price: "2500000" } }
  );
  services.forEach((service) => {
    if (["Trám răng", "TrÃ¡m rÄƒng"].includes(service.name)) Object.assign(service, { name: "Trám răng", price: "800000" });
    if (["Nhổ răng khôn", "Nhá»• rÄƒng khÃ´n"].includes(service.name)) Object.assign(service, { name: "Nhổ răng", price: "1500000" });
    if (["Tư vấn nha khoa", "TÆ° váº¥n nha khoa"].includes(service.name)) Object.assign(service, { name: "Tư vấn niềng răng", price: "500000", isConsultation: true });
    if (["Cạo vôi răng", "Cáº¡o vÃ´i rÄƒng"].includes(service.name)) Object.assign(service, { name: "Cạo vôi răng", price: "500000" });
    if (["Tẩy trắng răng", "Táº©y tráº¯ng rÄƒng"].includes(service.name)) Object.assign(service, { name: "Tẩy trắng răng", price: "2500000" });
  });
  services.push(
    ...(await insertDocuments(COLLECTIONS.dentalServices, [
      {
        name: "Khám nha khoa",
        description: "Thăm khám tổng quát và tư vấn tình trạng răng miệng.",
        durationMinutes: 30,
        transitionTime: 10,
        price: "100000",
        requiresPrepayment: true,
        isConsultation: false,
        isActive: true
      },
      {
        name: "Điều trị tủy",
        description: "Điều trị tủy răng theo chẩn đoán chuyên môn.",
        durationMinutes: 60,
        transitionTime: 10,
        price: "3000000",
        requiresPrepayment: true,
        isConsultation: false,
        isActive: true
      },
      {
        name: "Bọc răng sứ",
        description: "Phục hình răng sứ theo kế hoạch điều trị của bác sĩ.",
        durationMinutes: 90,
        transitionTime: 10,
        price: "5000000",
        requiresPrepayment: true,
        isConsultation: false,
        isActive: true
      }
    ]))
  );

  await insertDocuments(
    COLLECTIONS.dentistServices,
    dentists.flatMap((dentist) =>
      services.map((service) => ({ dentist: dentist._id, service: service._id }))
    )
  );

  const rooms = await insertDocuments(
    COLLECTIONS.clinicRooms,
    dentists.map((dentist, index) => ({
      name: `PhÃ²ng khÃ¡m ${index + 1}`,
      roomType: "PhÃ²ng Ä‘iá»u trá»‹ nha khoa",
      description: "PhÃ²ng Ä‘iá»u trá»‹ Ä‘Æ°á»£c trang bá»‹ cho quy trÃ¬nh váº­n hÃ nh SmileCare.",
      assignedDentist: dentist._id,
      assignedNurse: nurses[index]?._id,
      equipment: [
        "MÃ¡y chá»¥p X-quang",
        "MÃ¡y Ä‘o huyáº¿t Ã¡p",
        "MÃ¡y Ä‘o SpO2",
        "Nhiá»‡t káº¿",
        "MÃ¡y theo dÃµi hÃ´ háº¥p"
      ],
      status: "available",
      isActive: true
    }))
  );

  const workingDates = nextWorkingDates(12, 0);

  return { services, rooms, workingDates };
}

async function createSampleAppointment({
  patient,
  requester,
  receptionist,
  room,
  service,
  date,
  time,
  status,
  note,
  channel = "online",
  dentistPreference = "selected"
}) {
  const startAt = combineDateAndTime(date, time);
  const endAt = addMinutes(startAt, 30);
  const activeSlotStatuses = new Set(["pending", "scheduled", "confirmed", "checked_in", "in_treatment"]);
  const appointmentSlot =
    room && activeSlotStatuses.has(status)
      ? await insertDocuments(COLLECTIONS.appointmentSlots, {
          dentist: room.assignedDentist,
          room: room._id,
          slotDate: startAt,
          startAt,
          endAt,
          status: "booked"
        })
      : null;

  return insertDocuments(COLLECTIONS.appointments, {
    patient: patient._id,
    createdBy: requester._id,
    receptionist: receptionist?._id,
    dentist: room?.assignedDentist,
    nurse: room?.assignedNurse,
    room: room?._id,
    service: service._id,
    appointmentSlot: appointmentSlot?._id,
    channel,
    bookingType: channel,
    dentistPreference,
    startAt,
    endAt,
    arrivalAt: startAt,
    checkedInAt: ["checked_in", "in_treatment", "completed"].includes(status) ? startAt : undefined,
    checkInTime: ["checked_in", "in_treatment", "completed"].includes(status) ? startAt : undefined,
    status,
    paymentStatus: status === "completed" ? "unpaid" : "not_required",
    patientNote: note,
    receptionistNote: status === "confirmed" ? "Lá»… tÃ¢n Ä‘Ã£ xÃ¡c nháº­n lá»‹ch háº¹n." : undefined
  });
}

async function seedInvoice(appointment, patient, service, paidAmount) {
  const total = Number(service.price || 0);
  const status = paidAmount >= total ? "paid" : paidAmount > 0 ? "partial" : "unpaid";
  const invoice = await insertDocuments(COLLECTIONS.invoices, {
    appointment: appointment._id,
    patient: patient._id,
    items: [{ name: service.name, amount: total }],
    total,
    totalAmount: total,
    paidAmount,
    invoiceDate: appointment.startAt,
    paidAt: status === "paid" ? appointment.endAt : undefined,
    status
  });

  if (paidAmount > 0) {
    await insertDocuments(COLLECTIONS.payments, {
      invoice: invoice._id,
      paymentMethod: "cash",
      amount: paidAmount,
      paymentStatus: "paid",
      paymentDate: appointment.endAt
    });
  }
  return invoice;
}

async function seedOperationalData(users, clinic) {
  const { receptionists, patients } = users;
  const { services, rooms, workingDates } = clinic;
  const pastDates = previousWorkingDates(4);

  const pendingRandom = await createSampleAppointment({
    patient: patients[0],
    requester: patients[0],
    service: services[0],
    date: workingDates[0],
    time: "08:00",
    status: "pending",
    note: "Äau nháº¹ rÄƒng hÃ m, chÆ°a chá»n bÃ¡c sÄ©.",
    dentistPreference: "random"
  });
  const pendingSelected = await createSampleAppointment({
    patient: patients[2],
    requester: patients[2],
    room: rooms[1],
    service: services[1],
    date: workingDates[1],
    time: "10:00",
    status: "pending",
    note: "Muá»‘n bÃ¡c sÄ© kiá»ƒm tra rÄƒng khÃ´n.",
    dentistPreference: "selected"
  });
  const confirmed = await createSampleAppointment({
    patient: patients[3],
    requester: patients[3],
    receptionist: receptionists[0],
    room: rooms[0],
    service: services[3],
    date: workingDates[0],
    time: "16:00",
    status: "confirmed",
    note: "Lá»‹ch Ä‘Ã£ Ä‘Æ°á»£c lá»… tÃ¢n xÃ¡c nháº­n."
  });
  const confirmedForPatient = await createSampleAppointment({
    patient: patients[0],
    requester: patients[0],
    receptionist: receptionists[0],
    room: rooms[1],
    service: services[3],
    date: workingDates[2],
    time: "10:00",
    status: "confirmed",
    note: "TÃ¡i khÃ¡m vÃ  vá»‡ sinh rÄƒng."
  });
  const checkedIn = await createSampleAppointment({
    patient: patients[1],
    requester: receptionists[0],
    receptionist: receptionists[0],
    room: rooms[1],
    service: services[4],
    date: workingDates[0],
    time: "10:00",
    status: "checked_in",
    note: "Bá»‡nh nhÃ¢n Ä‘Ã£ cÃ³ máº·t táº¡i phÃ²ng khÃ¡m.",
    channel: "offline"
  });
  const inTreatment = await createSampleAppointment({
    patient: patients[2],
    requester: receptionists[0],
    receptionist: receptionists[0],
    room: rooms[2],
    service: services[0],
    date: workingDates[0],
    time: "14:00",
    status: "in_treatment",
    note: "Äang thá»±c hiá»‡n Ä‘iá»u trá»‹.",
    channel: "offline"
  });
  const rejected = await createSampleAppointment({
    patient: patients[0],
    requester: patients[0],
    service: services[1],
    date: workingDates[3],
    time: "14:00",
    status: "rejected",
    note: "Lá»‹ch máº«u Ä‘Ã£ bá»‹ tá»« chá»‘i Ä‘á»ƒ kiá»ƒm tra tráº¡ng thÃ¡i.",
    dentistPreference: "random"
  });
  const completedOne = await createSampleAppointment({
    patient: patients[0],
    requester: receptionists[0],
    receptionist: receptionists[0],
    room: rooms[0],
    service: services[3],
    date: pastDates[0],
    time: "08:00",
    status: "completed",
    note: "ÄÃ£ hoÃ n táº¥t cáº¡o vÃ´i rÄƒng.",
    channel: "offline"
  });
  const completedTwo = await createSampleAppointment({
    patient: patients[1],
    requester: receptionists[0],
    receptionist: receptionists[0],
    room: rooms[1],
    service: services[0],
    date: pastDates[1],
    time: "10:00",
    status: "completed",
    note: "ÄÃ£ hoÃ n táº¥t trÃ¡m rÄƒng.",
    channel: "offline"
  });
  const completedThree = await createSampleAppointment({
    patient: patients[2],
    requester: receptionists[0],
    receptionist: receptionists[0],
    room: rooms[2],
    service: services[4],
    date: pastDates[2],
    time: "14:00",
    status: "completed",
    note: "ÄÃ£ hoÃ n táº¥t táº©y tráº¯ng rÄƒng.",
    channel: "offline"
  });
  await createSampleAppointment({
    patient: patients[4],
    requester: receptionists[0],
    receptionist: receptionists[0],
    room: rooms[0],
    service: services[2],
    date: pastDates[3],
    time: "16:00",
    status: "no_show",
    note: "Dá»¯ liá»‡u máº«u bá»‡nh nhÃ¢n váº¯ng máº·t.",
    channel: "offline"
  });

  await seedInvoice(completedOne, patients[0], services[3], 0);
  await seedInvoice(completedTwo, patients[1], services[0], 150000);
  await seedInvoice(completedThree, patients[2], services[4], services[4].price);

  const recordOne = await insertDocuments(COLLECTIONS.treatmentRecords, {
    appointment: completedOne._id,
    patient: patients[0]._id,
    dentist: rooms[0].assignedDentist,
    nurse: rooms[0].assignedNurse,
    diagnosis: "VÃ´i rÄƒng má»©c Ä‘á»™ trung bÃ¬nh.",
    treatmentResult: "ÄÃ£ lÃ m sáº¡ch vÃ´i rÄƒng vÃ  Ä‘Ã¡nh bÃ³ng.",
    treatmentNote: "HÆ°á»›ng dáº«n dÃ¹ng chá»‰ nha khoa háº±ng ngÃ y.",
    treatmentDate: completedOne.startAt,
    status: "completed"
  });
  const recordTwo = await insertDocuments(COLLECTIONS.treatmentRecords, {
    appointment: completedTwo._id,
    patient: patients[1]._id,
    dentist: rooms[1].assignedDentist,
    nurse: rooms[1].assignedNurse,
    diagnosis: "SÃ¢u rÄƒng hÃ m dÆ°á»›i.",
    treatmentResult: "ÄÃ£ lÃ m sáº¡ch vÃ  trÃ¡m phá»¥c há»“i.",
    treatmentNote: "Theo dÃµi Ãª buá»‘t trong 48 giá».",
    treatmentDate: completedTwo.startAt,
    status: "completed"
  });
  const activeRecord = await insertDocuments(COLLECTIONS.treatmentRecords, {
    appointment: inTreatment._id,
    patient: patients[2]._id,
    dentist: rooms[2].assignedDentist,
    nurse: rooms[2].assignedNurse,
    vitalSigns: {
      bloodPressure: "118/76",
      heartRate: "78",
      spo2: "99",
      temperature: "36.7",
      respiratoryRate: "18"
    },
    diagnosis: "SÃ¢u rÄƒng cáº§n phá»¥c há»“i.",
    treatmentResult: "Äang Ä‘iá»u trá»‹.",
    treatmentDate: inTreatment.startAt,
    status: "active"
  });

  await insertDocuments(COLLECTIONS.treatmentPlans, [
    {
      treatmentRecord: recordOne._id,
      dentist: rooms[0].assignedDentist,
      planDetail: "TÃ¡i khÃ¡m sau 6 thÃ¡ng vÃ  duy trÃ¬ vá»‡ sinh rÄƒng miá»‡ng.",
      estimatedCost: 0,
      startDate: completedOne.startAt,
      status: "active"
    },
    {
      treatmentRecord: recordTwo._id,
      dentist: rooms[1].assignedDentist,
      planDetail: "Kiá»ƒm tra miáº¿ng trÃ¡m sau 2 tuáº§n náº¿u cÃ²n Ãª buá»‘t.",
      estimatedCost: 0,
      startDate: completedTwo.startAt,
      status: "active"
    },
    {
      treatmentRecord: activeRecord._id,
      dentist: rooms[2].assignedDentist,
      planDetail: "HoÃ n táº¥t trÃ¡m rÄƒng vÃ  Ä‘Ã¡nh giÃ¡ khá»›p cáº¯n.",
      estimatedCost: services[0].price,
      startDate: inTreatment.startAt,
      status: "active"
    }
  ]);
  await insertDocuments(COLLECTIONS.prescriptions, [
    {
      treatmentRecord: recordTwo._id,
      dentist: rooms[1].assignedDentist,
      medicineName: "Paracetamol 500mg",
      dosage: "1 viÃªn khi Ä‘au",
      instruction: "KhÃ´ng dÃ¹ng quÃ¡ 3 viÃªn má»—i ngÃ y.",
      note: "DÃ¹ng khi cáº§n."
    },
    {
      treatmentRecord: activeRecord._id,
      dentist: rooms[2].assignedDentist,
      medicineName: "NÆ°á»›c sÃºc miá»‡ng",
      dosage: "2 láº§n má»—i ngÃ y",
      instruction: "SÃºc miá»‡ng sau khi Ä‘Ã¡nh rÄƒng.",
      note: "DÃ¹ng trong 7 ngÃ y."
    }
  ]);

  await insertDocuments(COLLECTIONS.reviews, [
    {
      appointment: completedOne._id,
      patient: patients[0]._id,
      dentist: rooms[0].assignedDentist,
      service: services[3]._id,
      rating: 5,
      ratingDentist: 5,
      ratingService: 5,
      comment: "BÃ¡c sÄ© tÆ° váº¥n rÃµ rÃ ng, thao tÃ¡c nháº¹ nhÃ ng."
    },
    {
      appointment: completedTwo._id,
      patient: patients[1]._id,
      dentist: rooms[1].assignedDentist,
      service: services[0]._id,
      rating: 4,
      ratingDentist: 5,
      ratingService: 4,
      comment: "Quy trÃ¬nh nhanh vÃ  nhÃ¢n viÃªn há»— trá»£ tá»‘t."
    },
    {
      appointment: completedThree._id,
      patient: patients[2]._id,
      dentist: rooms[2].assignedDentist,
      service: services[4]._id,
      rating: 5,
      ratingDentist: 5,
      ratingService: 5,
      comment: "Káº¿t quáº£ tá»‘t vÃ  Ä‘Æ°á»£c hÆ°á»›ng dáº«n chÄƒm sÃ³c ká»¹."
    }
  ]);

  await insertDocuments(COLLECTIONS.consultationRequests, [
    {
      fullName: "Äá»— Minh Khang",
      phone: "0988000001",
      email: "khang@example.com",
      service: services[2]._id,
      preferredDate: combineDateAndTime(workingDates[1], "14:00"),
      preferredTime: "14:00",
      message: "Muá»‘n tÆ° váº¥n Ä‘au rÄƒng trÆ°á»›c khi Ä‘áº·t lá»‹ch.",
      status: "new"
    },
    {
      fullName: "VÃµ Ngá»c Lan",
      phone: "0988000002",
      service: services[1]._id,
      preferredDate: combineDateAndTime(workingDates[2], "10:00"),
      preferredTime: "10:00",
      message: "Cáº§n tÆ° váº¥n rÄƒng khÃ´n.",
      status: "contacted",
      handledBy: receptionists[0]._id
    },
    {
      fullName: "BÃ¹i Thanh Mai",
      phone: "0988000003",
      service: services[4]._id,
      preferredDate: combineDateAndTime(workingDates[3], "16:00"),
      preferredTime: "16:00",
      message: "Quan tÃ¢m dá»‹ch vá»¥ táº©y tráº¯ng rÄƒng.",
      status: "new"
    }
  ]);

  await insertDocuments(COLLECTIONS.notifications, [
    {
      user: patients[0]._id,
      title: "Lá»‹ch háº¹n Ä‘ang chá» xÃ¡c nháº­n",
      message: `YÃªu cáº§u ${services[0].name} Ä‘ang chá» lá»… tÃ¢n xÃ¡c nháº­n.`,
      isRead: false
    },
    {
      user: patients[0]._id,
      title: "Lá»‹ch háº¹n Ä‘Ã£ Ä‘Æ°á»£c xÃ¡c nháº­n",
      message: `Lá»‹ch ${services[3].name} Ä‘Ã£ Ä‘Æ°á»£c lá»… tÃ¢n xÃ¡c nháº­n.`,
      isRead: false
    },
    {
      user: patients[1]._id,
      title: "ÄÃ£ ghi nháº­n cÃ³ máº·t",
      message: "Báº¡n Ä‘Ã£ Ä‘Æ°á»£c ghi nháº­n cÃ³ máº·t táº¡i SmileCare.",
      isRead: false
    },
    {
      user: patients[2]._id,
      title: "Äang Ä‘iá»u trá»‹",
      message: "Lá»‹ch khÃ¡m cá»§a báº¡n Ä‘Ã£ chuyá»ƒn sang tráº¡ng thÃ¡i Ä‘ang Ä‘iá»u trá»‹.",
      isRead: true
    }
  ]);

  const roomStatuses = ["available", "available", "in_use"];
  await Promise.all(
    rooms.map((room, index) =>
      getCollection(COLLECTIONS.clinicRooms).updateOne(
        { _id: room._id },
        { $set: { status: roomStatuses[index], updatedAt: new Date() } }
      )
    )
  );
  await insertDocuments(
    COLLECTIONS.roomStatuses,
    rooms.map((room, index) => ({
      room: room._id,
      nurse: room.assignedNurse,
      availabilityStatus: roomStatuses[index],
      note: "Tráº¡ng thÃ¡i phÃ²ng tá»« dá»¯ liá»‡u máº«u theo logic má»›i."
    }))
  );

  return { pendingRandom, pendingSelected, confirmed, confirmedForPatient, checkedIn, inTreatment, rejected };
}

async function run() {
  await connectMongoDB();
  await clearDatabase();
  const passwordHash = await hashPassword("nhakhoa2026");
  const roles = await createRoles();
  await createClinicSettings();
  await createWorkingCalendar();
  const users = await seedUsers(roles, passwordHash);
  const clinic = await seedClinic(users.dentists, users.nurses);
  await seedOperationalData(users, clinic);
  await closeMongoDB();
}

run().catch(async (error) => {
  await closeMongoDB();
  throw error;
});
