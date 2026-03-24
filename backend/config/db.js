const dns = require("dns");
const { Pool } = require("pg");

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const getProjectRefFromUrl = (url) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return String(parsed.hostname || "").split(".")[0] || "";
  } catch (error) {
    return "";
  }
};

const buildConnectionString = () => {
  const directUrl = String(process.env.DATABASE_URL || process.env.DB_URL || "").trim();
  if (directUrl) return directUrl;

  const projectRef = getProjectRefFromUrl(process.env.SUPABASE_PROJECT_URL);
  const password = String(process.env.DB_PASS || "").trim();

  if (!projectRef || !password) {
    return "";
  }

  return `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;
};

const connectionString = buildConnectionString();
if (!connectionString) {
  throw new Error(
    "Missing database config. Set DATABASE_URL (or DB_URL), or set SUPABASE_PROJECT_URL and DB_PASS."
  );
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const toPgSql = (sql) => {
  let index = 1;
  return String(sql || "").replace(/\?/g, () => `$${index++}`);
};

const normalizeError = (err) => {
  if (!err) return err;
  if (err.code === "23505") err.code = "ER_DUP_ENTRY";
  if (err.code === "42701") err.code = "ER_DUP_FIELDNAME";
  if (err.code === "42P01") err.code = "ER_NO_SUCH_TABLE";
  return err;
};

const mapResult = (sql, result) => {
  const statement = String(sql || "").trim().toLowerCase();
  const rows = result?.rows || [];

  if (statement.startsWith("select") || statement.startsWith("with")) {
    return rows;
  }

  if (statement.startsWith("insert")) {
    return {
      insertId: rows[0]?.id || null,
      affectedRows: result?.rowCount || 0,
      rowCount: result?.rowCount || 0,
      rows,
    };
  }

  return {
    affectedRows: result?.rowCount || 0,
    rowCount: result?.rowCount || 0,
    rows,
  };
};

const maybeAddReturningId = (sql) => {
  const trimmed = String(sql || "").trim();
  const lower = trimmed.toLowerCase();
  if (!lower.startsWith("insert") || lower.includes("returning")) {
    return trimmed;
  }
  return `${trimmed} RETURNING id`;
};

const query = (sql, params, callback) => {
  let queryParams = params;
  let cb = callback;

  if (typeof queryParams === "function") {
    cb = queryParams;
    queryParams = [];
  }

  const safeParams = Array.isArray(queryParams) ? queryParams : [];
  const preparedSql = maybeAddReturningId(toPgSql(sql));

  if (typeof cb === "function") {
    pool
      .query(preparedSql, safeParams)
      .then((result) => cb(null, mapResult(sql, result)))
      .catch((err) => cb(normalizeError(err)));
    return;
  }

  return pool
    .query(preparedSql, safeParams)
    .then((result) => mapResult(sql, result))
    .catch((err) => {
      throw normalizeError(err);
    });
};

const connect = (callback) => {
  pool
    .query("SELECT 1")
    .then(() => {
      console.log("PostgreSQL Connected ✅");
      if (typeof callback === "function") callback(null);
    })
    .catch((err) => {
      const normalized = normalizeError(err);
      console.error("PostgreSQL connection error:", normalized.message);
      if (typeof callback === "function") callback(normalized);
    });
};

const end = () => pool.end();

pool.on("error", (err) => {
  const normalized = normalizeError(err);
  console.error("PostgreSQL runtime error:", normalized.message);
});

module.exports = {
  query,
  connect,
  end,
};