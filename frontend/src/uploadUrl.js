const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:4000/api";

export const UPLOADS_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const getUploadUrl = (fileName) => {
  const raw = String(fileName || "").trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const cleanName = raw
    .trim()
    .replace(/^[\\/]+/, "")
    .replace(/^uploads[\\/]/i, "");

  return `${UPLOADS_BASE_URL}/uploads/${encodeURIComponent(cleanName)}`;
};
