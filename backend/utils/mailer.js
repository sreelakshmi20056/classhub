const nodemailer = require("nodemailer");
const https = require("https");

const getBrevoApiKey = () => {
  const candidates = [
    process.env.BREVO_API_KEY,
    process.env.BREVO_APIKEY,
    process.env.BREVO_KEY,
    process.env.SENDINBLUE_API_KEY,
  ];

  for (const value of candidates) {
    const key = String(value || "").trim();
    if (key) return key;
  }
  return "";
};

const hasSmtpConfig = () => {
  return (
    !!process.env.SMTP_HOST &&
    !!process.env.SMTP_PORT &&
    !!process.env.SMTP_USER &&
    !!process.env.SMTP_PASS
  );
};

const parseSecureFlag = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return null;
};

const createTransporter = ({ host, port, user, pass, secure }) => {
  const explicitSecure = parseSecureFlag(process.env.SMTP_SECURE);
  const shouldUseSecure = explicitSecure !== null ? explicitSecure : secure;

  return nodemailer.createTransport({
    host,
    port,
    secure: shouldUseSecure,
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 15000,
    auth: {
      user,
      pass,
    },
  });
};

const isTransientSmtpConnectError = (error) => {
  const code = String(error?.code || "").toUpperCase();
  return ["ETIMEDOUT", "ESOCKET", "ECONNECTION", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH"].includes(code);
};

const sendWithSmtp = async ({ to, subject, text }) => {
  const host = String(process.env.SMTP_HOST || "").trim();
  const user = String(process.env.SMTP_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || "").trim();
  const port = Number(process.env.SMTP_PORT);

  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
  const primaryTransporter = createTransporter({
    host,
    port,
    user,
    pass,
    secure: port === 465,
  });

  try {
    await primaryTransporter.sendMail({
      from: fromEmail,
      to,
      subject,
      text,
    });
    return true;
  } catch (smtpError) {
    const isGmailHost = /gmail\.com$/i.test(host);
    if (!(isGmailHost && port === 465 && isTransientSmtpConnectError(smtpError))) {
      throw smtpError;
    }

    console.warn("SMTP 465 failed, retrying with Gmail STARTTLS on port 587");
    const fallbackTransporter = createTransporter({
      host,
      port: 587,
      user,
      pass,
      secure: false,
    });

    await fallbackTransporter.sendMail({
      from: fromEmail,
      to,
      subject,
      text,
    });

    return true;
  }
};

const sendWithBrevoApi = ({ to, subject, text }) => {
  const apiKey = getBrevoApiKey();
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
  const hasBrevoApiKey = !!getBrevoApiKey();
  if (hasBrevoApiKey) {
    console.log("Email delivery mode: Brevo API");
    try {
      await sendWithBrevoApi({ to, subject, text });
      return true;
    } catch (brevoError) {
      console.error("Brevo send failed, attempting SMTP fallback", brevoError.message || brevoError);
      if (!hasSmtpConfig()) {
        throw brevoError;
      }
    }
  }

  console.warn("Email delivery mode: SMTP");

  if (!hasSmtpConfig()) {
    throw new Error("No email provider configured. Set Brevo API key or SMTP variables.");
  }

  return sendWithSmtp({ to, subject, text });
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
