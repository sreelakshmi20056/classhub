const db = require("./config/db");

const describe = (table) => {
  db.query(`DESCRIBE ${table}`, (err, result) => {
    if (err) console.error(`Error describing ${table}:`, err);
    else console.log(`${table}:
`, result);
  });
};

describe('assignments');
describe('submissions');
describe('notes');
describe('subjects');
db.end();
