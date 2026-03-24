const nodemailer = require("nodemailer");
const https = require("https");

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

const sendWithBrevoApi = ({ to, subject, text }) => {
  const apiKey = String(process.env.BREVO_API_KEY || "").trim();
  if (!apiKey) {
    return Promise.resolve(false);
  }

  const senderEmail = String(process.env.SMTP_FROM || process.env.SMTP_USER || "").trim();
  if (!senderEmail) {
    return Promise.reject(new Error("BREVO_API_KEY is set but SMTP_FROM/SMTP_USER sender email is missing"));
  }

  const recipients = Array.isArray(to) ? to : [to];
  const payload = JSON.stringify({
    sender: {
      email: senderEmail,
      name: "ClassHub",
    },
    to: recipients.filter(Boolean).map((email) => ({ email })),
    subject,
    textContent: text,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.brevo.com",
        path: "/v3/smtp/email",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          "api-key": apiKey,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(true);
            return;
          }

          reject(
            new Error(`Brevo API email failed (${res.statusCode}): ${body || "Unknown error"}`)
          );
        });
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
};

const sendEmail = async ({ to, subject, text }) => {
  const hasBrevoApiKey = !!String(process.env.BREVO_API_KEY || "").trim();
  if (hasBrevoApiKey) {
    return sendWithBrevoApi({ to, subject, text });
  }

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
