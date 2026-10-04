const crypto = require('crypto');

module.exports = {
  getRandomValues: (array) => {
    const bytes = crypto.randomBytes(array.length);
    array.set(bytes);
    return array;
  },
  getRandomBytes: (count) => {
    return new Uint8Array(crypto.randomBytes(count));
  },
  randomUUID: () => crypto.randomUUID(),
};
