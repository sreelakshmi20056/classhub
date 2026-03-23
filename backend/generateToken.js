const jwt = require('jsonwebtoken');
console.log(jwt.sign({id:3, role:'student'}, 'classhubsecret', { expiresIn: '1h' }));
