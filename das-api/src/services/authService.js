import { env } from "../config/environment.js";
import { getInheritanceChain } from "../config/roleHierarchy.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { sendPasswordResetOtp } from "../utils/mailer.js";
import { signToken } from "../utils/tokens.js";
import * as userRepository from "../repository/userRepository.js";

function httpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function serializeUser(user) {
  const object = { ...user };
  delete object.passwordHash;
  delete object.resetPasswordCodeHash;
  delete object.resetPasswordExpiresAt;
  return object;
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function ensurePatientRole() {
  return userRepository.upsertRole(
    { roleName: "patient" },
    {
      roleName: "patient",
      parentRoleName: "user",
      isAbstract: false,
      inheritanceChain: getInheritanceChain("patient"),
      description: "Bá»‡nh nhÃ¢n Ä‘áº·t lá»‹ch trá»±c tuyáº¿n, xem lá»‹ch sá»­ khÃ¡m, há»§y hoáº·c dá»i lá»‹ch vÃ  Ä‘Ã¡nh giÃ¡ dá»‹ch vá»¥."
    }
  );
}

export async function registerPatient(data) {
  const existing = await userRepository.findUserByPhone(data.phone);

  if (existing) {
    throw httpError("Sá»‘ Ä‘iá»‡n thoáº¡i Ä‘Ã£ Ä‘Æ°á»£c Ä‘Äƒng kÃ½.", 409);
  }

  if (data.email) {
    const emailOwner = await userRepository.findUserByEmail(data.email);
    if (emailOwner) {
      throw httpError("Email Ä‘Ã£ Ä‘Æ°á»£c Ä‘Äƒng kÃ½.", 409);
    }
  }

  const patientRole = await ensurePatientRole();
  const user = await userRepository.createUser({
    fullName: data.fullName || `Bá»‡nh nhÃ¢n ${data.phone}`,
    email: data.email || undefined,
    phone: data.phone,
    gender: data.gender,
    address: data.address || undefined,
    passwordHash: await hashPassword(data.password),
    roleRef: patientRole._id,
    role: "patient"
  });
  await userRepository.createPatientProfile({
    user: user._id,
    gender: data.gender,
    address: data.address || undefined
  });

  return {
    message: "ÄÄƒng kÃ½ tÃ i khoáº£n thÃ nh cÃ´ng. Vui lÃ²ng Ä‘Äƒng nháº­p báº±ng sá»‘ Ä‘iá»‡n thoáº¡i."
  };
}

export async function login(data) {
  const user = await userRepository.findUserByPhone(data.phone);

  if (!user || !(await comparePassword(data.password, user.passwordHash))) {
    throw httpError("Sá»‘ Ä‘iá»‡n thoáº¡i hoáº·c máº­t kháº©u khÃ´ng Ä‘Ãºng.", 401);
  }

  if (user.status !== "active") {
    throw httpError("TÃ i khoáº£n Ä‘ang khÃ´ng hoáº¡t Ä‘á»™ng.", 403);
  }

  return {
    user: serializeUser(user),
    token: signToken(user)
  };
}

export async function requestPasswordReset(data) {
  const user = await userRepository.findUserByEmailWithResetFields(data.email);
  const genericMessage = "Nếu email tồn tại, hệ thống sẽ gửi mã OTP đặt lại mật khẩu.";

  if (!user) {
    return { message: genericMessage };
  }

  const verificationCode = generateVerificationCode();
  const ttlMinutes = env.PASSWORD_RESET_OTP_TTL_MINUTES || 10;
  await userRepository.saveUser({
    ...user,
    resetPasswordCodeHash: await hashPassword(verificationCode),
    resetPasswordExpiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000)
  });

  const mailResult = await sendPasswordResetOtp({
    to: user.email,
    fullName: user.fullName,
    otp: verificationCode,
    ttlMinutes
  });

  return {
    message: genericMessage,
    verificationCode: !mailResult.sent && env.MAIL_DEV_RETURN_OTP ? verificationCode : undefined
  };
}

export async function resetPassword(data) {
  const user = await userRepository.findUserByEmailWithResetFields(data.email);

  if (!user || !user.resetPasswordCodeHash || !user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
    throw httpError("MÃ£ xÃ¡c minh khÃ´ng há»£p lá»‡ hoáº·c Ä‘Ã£ háº¿t háº¡n.", 400);
  }

  const isValidCode = await comparePassword(data.verificationCode, user.resetPasswordCodeHash);
  if (!isValidCode) {
    throw httpError("MÃ£ xÃ¡c minh khÃ´ng há»£p lá»‡ hoáº·c Ä‘Ã£ háº¿t háº¡n.", 400);
  }

  await userRepository.saveUser({
    ...user,
    passwordHash: await hashPassword(data.newPassword),
    resetPasswordCodeHash: null,
    resetPasswordExpiresAt: null
  });

  return { message: "ÄÃ£ Ä‘áº·t láº¡i máº­t kháº©u. Vui lÃ²ng Ä‘Äƒng nháº­p báº±ng máº­t kháº©u má»›i." };
}

export function getCurrentUser(user) {
  return { user: serializeUser(user) };
}

export async function updateProfile(user, data) {
  if (data.phone && data.phone !== user.phone) {
    const duplicate = await userRepository.findDuplicatePhone(data.phone, user._id);
    if (duplicate) {
      throw httpError("Sá»‘ Ä‘iá»‡n thoáº¡i Ä‘Ã£ tá»“n táº¡i.", 409);
    }
  }

  if (data.email && data.email !== user.email) {
    const duplicate = await userRepository.findDuplicateEmail(data.email, user._id);
    if (duplicate) {
      throw httpError("Email đã tồn tại.", 409);
    }
  }

  const update = {};
  for (const key of ["fullName", "email", "phone", "gender", "bio"]) {
    if (data[key] !== undefined) update[key] = data[key];
  }
  if (data.address !== undefined) update.address = data.address || undefined;
  if (data.avatarUrl !== undefined) update.avatarUrl = data.avatarUrl || undefined;

  const updatedUser = await userRepository.updateUserById(user._id, update);

  if (updatedUser.role === "patient" && (data.gender || data.address !== undefined)) {
    await userRepository.updatePatientProfileByUser(updatedUser._id, {
      gender: data.gender,
      address: data.address || undefined
    });
  }

  return { user: serializeUser(updatedUser) };
}

export async function getNotifications(user) {
  const notifications = await userRepository.findNotificationsByUser(user._id);
  return { notifications };
}

export async function markAllNotificationsRead(user) {
  await userRepository.markAllNotificationsRead(user._id);
  return getNotifications(user);
}

export async function markNotificationRead(user, notificationId) {
  const notification = await userRepository.markNotificationRead(user._id, notificationId);

  if (!notification) {
    throw httpError("KhÃ´ng tÃ¬m tháº¥y thÃ´ng bÃ¡o.", 404);
  }

  return { notification };
}

export async function deleteNotification(user, notificationId) {
  const notification = await userRepository.deleteNotification(user._id, notificationId);

  if (!notification) {
    throw httpError("Không tìm thấy thông báo.", 404);
  }

  return getNotifications(user);
}

export async function deleteAllNotifications(user) {
  await userRepository.deleteAllNotifications(user._id);
  return { notifications: [] };
}

export async function changePassword(user, data) {
  const storedUser = await userRepository.findUserByIdWithPassword(user._id);

  if (!(await comparePassword(data.currentPassword, storedUser.passwordHash))) {
    throw httpError("Máº­t kháº©u hiá»‡n táº¡i khÃ´ng Ä‘Ãºng.", 400);
  }

  await userRepository.saveUser({
    ...storedUser,
    passwordHash: await hashPassword(data.newPassword)
  });

  return { message: "ÄÃ£ Ä‘á»•i máº­t kháº©u." };
}

export function logout() {
  return { message: "ÄÃ£ Ä‘Äƒng xuáº¥t." };
}
