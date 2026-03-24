const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

export const UPLOADS_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const getUploadUrl = (fileName) => {
  const cleanName = String(fileName || "")
    .trim()
    .replace(/^[\\/]+/, "")
    .replace(/^uploads[\\/]/i, "");

  if (!cleanName) return "";
  return `${UPLOADS_BASE_URL}/uploads/${encodeURIComponent(cleanName)}`;
};
