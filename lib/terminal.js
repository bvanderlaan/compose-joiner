'use strict';

module.exports = {
  read(data) {
    return data.replace(/'/g, '"');
  },

  write(data) {
    return `"${data.replace(/"/g, '\'')}"`;
  },
};
