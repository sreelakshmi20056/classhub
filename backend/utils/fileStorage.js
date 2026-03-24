const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const getSupabaseUrl = () => {
  return String(
    process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL || ""
  ).trim();
};

const getSupabaseServiceRoleKey = () => {
  return String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
};

const getBucketName = () => {
  return String(process.env.SUPABASE_STORAGE_BUCKET || "classhub-files").trim();
};

const hasSupabaseStorageConfig = () => {
  return !!getSupabaseUrl() && !!getSupabaseServiceRoleKey();
};

const sanitizeName = (name) => {
  return String(name || "file")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const readFileBuffer = (filePath) => {
  return fs.promises.readFile(filePath);
};

const removeLocalFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error && error.code !== "ENOENT") {
      console.warn("Unable to remove local upload after storage move:", error.message);
    }
  }
};

const uploadToSupabaseStorage = async (file, folder = "misc") => {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseServiceRoleKey();
  const bucket = getBucketName();
  const supabase = createClient(supabaseUrl, supabaseKey);

  const safeOriginalName = sanitizeName(file.originalname || file.filename || "file");
  const objectPath = `${folder}/${Date.now()}-${safeOriginalName}`;
  const fileBuffer = await readFileBuffer(file.path);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectPath, fileBuffer, {
      contentType: file.mimetype || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  if (!data || !data.publicUrl) {
    throw new Error("Supabase Storage upload succeeded but public URL is unavailable");
  }

  await removeLocalFile(file.path);
  return data.publicUrl;
};

const persistUploadedFile = async (file, folder = "misc") => {
  if (!file) return null;

  if (!hasSupabaseStorageConfig()) {
    return file.filename;
  }

  return uploadToSupabaseStorage(file, folder);
};

module.exports = {
  hasSupabaseStorageConfig,
  persistUploadedFile,
};
