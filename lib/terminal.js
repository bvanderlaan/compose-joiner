'use strict';

module.exports = {
  read(data) {
    return data;
  },

  write(data) {
    // escape single quote characters using '"'"'
    // They will be processed and converted back to ' via the shell so
    // I don't have to explicitly un-escape them when reading. See https://stackoverflow.com/questions/1250079/how-to-escape-single-quotes-within-single-quoted-strings
    return `'${data.replace(/'/g, '\'"\'"\'')}'`;
  },
};
