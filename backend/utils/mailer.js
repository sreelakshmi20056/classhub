const nodemailer = require("nodemailer");

const hasSmtpConfig = () => {
  return (
    !!process.env.SMTP_HOST &&
    !!process.env.SMTP_PORT &&
    !!process.env.SMTP_USER &&
    !!process.env.SMTP_PASS
  );
};

const createTransporter = () => {
  const host = String(process.env.SMTP_HOST || "").trim();
  const user = String(process.env.SMTP_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || "").trim();
  const port = Number(process.env.SMTP_PORT);

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 15000,
    auth: {
      user,
      pass,
    },
  });
};

const sendEmail = async ({ to, subject, text }) => {
  if (!hasSmtpConfig()) {
    console.warn("SMTP is not configured. Skipping email send.");
    return false;
  }

  const transporter = createTransporter();
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from: fromEmail,
    to,
    subject,
    text,
  });

  return true;
};

const sendRegistrationSuccessEmail = async (toEmail, name) => {
  const displayName = name || "User";

  return sendEmail({
    to: toEmail,
    subject: "Registration Successful",
    text: `Hi ${displayName},\n\nYour ClassHub account has been registered successfully.\n\nYou can now log in and start using the platform.\n\n- ClassHub Team`,
  });
};

const sendRegistrationOtpEmail = async (toEmail, otp) => {
  return sendEmail({
    to: toEmail,
    subject: "ClassHub Registration OTP",
    text: `Your ClassHub registration OTP is ${otp}.\n\nThis OTP is valid for 10 minutes.\n\nIf you did not request this, you can ignore this email.\n\n- ClassHub Team`,
  });
};

const sendPasswordResetEmail = async (toEmail, name, resetLink) => {
  const displayName = name || "User";

  return sendEmail({
    to: toEmail,
    subject: "Reset Your ClassHub Password",
    text: `Hi ${displayName},\n\nWe received a request to reset your ClassHub password.\n\nUse the link below to set a new password (valid for 15 minutes):\n${resetLink}\n\nIf you did not request this, you can ignore this email.\n\n- ClassHub Team`,
  });
};

module.exports = {
  sendEmail,
  sendRegistrationOtpEmail,
  sendRegistrationSuccessEmail,
  sendPasswordResetEmail,
};
