const axios = require('axios');
const fs = require('fs');
const jwt = require('jsonwebtoken');

(async () => {
  const token = jwt.sign({ id: 3, role: 'student' }, 'classhubsecret', { expiresIn: '1h' });
  const form = new (require('form-data'))();
  form.append('assignment_id', '1');
  form.append('file', fs.createReadStream('dummy.txt'));

  try {
    const res = await axios.post('http://localhost:4000/api/submissions/submit', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
})();