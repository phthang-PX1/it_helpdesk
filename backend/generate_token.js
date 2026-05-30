const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign({
  nhan_vien_id: 1,
  tai_khoan: 'test',
  vai_tro: 'IT_L1'
}, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

console.log(token);
