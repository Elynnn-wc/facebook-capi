const crypto = require('crypto');

function hash(value) {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

module.exports = { hash };
