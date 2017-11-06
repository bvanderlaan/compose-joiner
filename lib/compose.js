'use strict';

const fs = require('fs');
const yaml = require('yamljs');

module.exports = {
  parseYAML(yamlFile) {
    return yaml.load(yamlFile);
  },

  update(yamlData, version) {
    const newYaml = {};
    if (!Object.prototype.hasOwnProperty.call(yamlData, 'services')) {
      newYaml.services = Object.keys(yamlData)
        .filter(key => (key !== 'version'))
        .reduce((services, service) => {
          services[service] = yamlData[service]; // eslint-disable-line no-param-reassign
          return services;
        }, {});
    } else {
      Object.assign(newYaml, yamlData);
    }
    newYaml.version = version;

    return newYaml;
  },

  getServices(compose) {
    return Object.prototype.hasOwnProperty.call(compose, 'services') ? compose.services : compose;
  },

  getService(compose, serviceName) {
    if (!Object.prototype.hasOwnProperty.call(compose, 'services')) {
      return compose[serviceName];
    }
    return compose.services[serviceName];
  },

  addService(compose, service) {
    if (!Object.prototype.hasOwnProperty.call(compose, 'version')) {
      return Object.assign({}, compose, service);
    }

    const newCompose = Object.assign({}, compose);
    newCompose.services = Object.assign({}, newCompose.services, service);

    return newCompose;
  },

  removeService(compose, unwantedServiceName) {
    const newCompose = Object.assign({}, compose);

    if (Object.prototype.hasOwnProperty.call(compose, 'services')) {
      delete newCompose.services[unwantedServiceName];
    } else {
      delete newCompose[unwantedServiceName];
    }

    return newCompose;
  },

  saveYAML(compose, outputFile) {
    fs.writeFileSync(outputFile, yaml.stringify(compose, 4, 2));
  },

  join(composeA, composeB) {
    const newCompose = Object.assign({}, composeA, composeB);

    const services = Object.assign({}, composeA.services, composeB.services);
    if (Object.keys(services).length) {
      newCompose.services = services;
    }

    return newCompose;
  },
};
