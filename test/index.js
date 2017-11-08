'use strict';

const Promise = require('bluebird');
const chai = require('chai');
const { stripIndent } = require('common-tags');
const { execAsync } = Promise.promisifyAll(require('child_process'));
const fs = require('fs');
const path = require('path');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const yaml = require('yamljs');

const {
  addService,
  getService,
  getServices,
  join,
  parseYAML,
  removeService,
  removeProperty,
  saveYAML,
  update,
} = require('../lib/compose');
const terminal = require('../lib/terminal');

chai.use(sinonChai);
const { expect } = chai;

describe('Joiner', () => {
  describe('Parse YAML', () => {
    before(() => sinon.stub(yaml, 'load').returns({
      version: '2',
      services: {
        myService: {
          name: 'hello',
        },
      },
    }));
    after(() => yaml.load.restore());

    it('should load yaml', () => {
      expect(parseYAML('myYAMLFile.yml')).to.deep.equals({
        version: '2',
        services: {
          myService: {
            name: 'hello',
          },
        },
      });
    });
  });

  describe('Update Compose Version', () => {
    describe('when already at the same version', () => {
      before(() => sinon.stub(yaml, 'load').returns({
        version: '2',
        services: {
          myService: {
            name: 'hello',
          },
        },
      }));
      after(() => yaml.load.restore());

      it('should modify compose configuration', () => {
        expect(update(parseYAML('myYAMLFile.yml'), '2')).to.deep.equals({
          version: '2',
          services: {
            myService: {
              name: 'hello',
            },
          },
        });
      });
    });

    describe('when already at least at version 2', () => {
      before(() => sinon.stub(yaml, 'load').returns({
        version: '2',
        services: {
          myService: {
            name: 'hello',
          },
        },
      }));
      after(() => yaml.load.restore());

      it('should modify compose configuration', () => {
        expect(update(parseYAML('myYAMLFile.yml'), '2.3')).to.deep.equals({
          version: '2.3',
          services: {
            myService: {
              name: 'hello',
            },
          },
        });
      });
    });

    describe('when version 1', () => {
      before(() => sinon.stub(yaml, 'load').returns({
        myService: {
          name: 'hello',
        },
      }));
      after(() => yaml.load.restore());

      it('should modify compose configuration', () => {
        expect(update(parseYAML('myYAMLFile.yml'), '2.3')).to.deep.equals({
          version: '2.3',
          services: {
            myService: {
              name: 'hello',
            },
          },
        });
      });
    });
  });

  describe('Get Services', () => {
    describe('when version 1', () => {
      before(() => sinon.stub(yaml, 'load').returns({
        myService: {
          name: 'hello',
        },
        myOtherService: {
          name: 'world',
        },
      }));
      after(() => yaml.load.restore());

      it('should return hash of services', () => {
        expect(getServices(parseYAML('myYAMLFile.yml'))).to.deep.equals({
          myService: {
            name: 'hello',
          },
          myOtherService: {
            name: 'world',
          },
        });
      });
    });

    describe('when version 2+', () => {
      before(() => sinon.stub(yaml, 'load').returns({
        version: '2',
        services: {
          myService: {
            name: 'hello',
          },
        },
      }));
      after(() => yaml.load.restore());

      it('should return hash of services', () => {
        expect(getServices(parseYAML('myYAMLFile.yml'))).to.deep.equals({
          myService: {
            name: 'hello',
          },
        });
      });
    });
  });

  describe('Get Service', () => {
    describe('when version 1', () => {
      before(() => sinon.stub(yaml, 'load').returns({
        myService: {
          name: 'hello',
        },
        myOtherService: {
          name: 'world',
        },
      }));
      after(() => yaml.load.restore());

      it('should return the selected service object', () => {
        expect(getService(parseYAML('myYAMLFile.yml'), 'myService')).to.deep.equals({
          name: 'hello',
        });
      });
    });

    describe('when version 2+', () => {
      before(() => sinon.stub(yaml, 'load').returns({
        version: '2',
        services: {
          myService: {
            name: 'hello',
          },
          myOtherService: {
            name: 'world',
          },
        },
      }));
      after(() => yaml.load.restore());

      it('should return the selected service object', () => {
        expect(getService(parseYAML('myYAMLFile.yml'), 'myService')).to.deep.equals({
          name: 'hello',
        });
      });
    });
  });

  describe('Remove Service', () => {
    describe('when version 1', () => {
      before(() => sinon.stub(yaml, 'load').returns({
        myService: {
          name: 'hello',
        },
        myOtherService: {
          name: 'world',
        },
      }));
      after(() => yaml.load.restore());

      it('should remove unwanted service', () => {
        expect(removeService(parseYAML('myYAMLFile.yml'), 'myOtherService')).to.deep.equals({
          myService: {
            name: 'hello',
          },
        });
      });
    });

    describe('when has no services', () => {
      before(() => sinon.stub(yaml, 'load').returns({
        version: '2',
      }));
      after(() => yaml.load.restore());

      it('should remove unwanted service', () => {
        expect(removeService(parseYAML('myYAMLFile.yml'), 'myOtherService')).to.deep.equals({
          version: '2',
        });
      });
    });

    describe('when has services', () => {
      before(() => sinon.stub(yaml, 'load').returns({
        version: '2',
        services: {
          myService: {
            name: 'hello',
          },
          myOtherService: {
            name: 'world',
          },
        },
      }));
      after(() => yaml.load.restore());

      it('should remove unwanted service', () => {
        expect(removeService(parseYAML('myYAMLFile.yml'), 'myOtherService')).to.deep.equals({
          version: '2',
          services: {
            myService: {
              name: 'hello',
            },
          },
        });
      });
    });
  });

  describe('Remove Service property', () => {
    describe('when version 1', () => {
      describe('when service does not exist', () => {
        before(() => sinon.stub(yaml, 'load').returns({
          myService: {
            name: 'hello',
            volumes: [
              '~/data:/var/data',
            ],
          },
        }));
        after(() => yaml.load.restore());

        it('should do nothing', () => {
          expect(removeProperty(parseYAML('myYAMLFile.yml'), 'myOtherService', 'volumes')).to.deep.equals({
            myService: {
              name: 'hello',
              volumes: [
                '~/data:/var/data',
              ],
            },
          });
        });
      });

      describe('when service does exist but the property does not', () => {
        before(() => sinon.stub(yaml, 'load').returns({
          myService: {
            name: 'hello',
          },
        }));
        after(() => yaml.load.restore());

        it('should do nothing', () => {
          expect(removeProperty(parseYAML('myYAMLFile.yml'), 'myService', 'volumes')).to.deep.equals({
            myService: {
              name: 'hello',
            },
          });
        });
      });

      describe('when service and property does exist', () => {
        before(() => sinon.stub(yaml, 'load').returns({
          myService: {
            name: 'hello',
            volumes: [
              '~/data:/var/data',
            ],
          },
        }));
        after(() => yaml.load.restore());

        it('should remove unwanted property', () => {
          expect(removeProperty(parseYAML('myYAMLFile.yml'), 'myService', 'volumes')).to.deep.equals({
            myService: {
              name: 'hello',
            },
          });
        });
      });
    });

    describe('when service does not exist', () => {
      before(() => sinon.stub(yaml, 'load').returns({
        version: '2',
        services: {
          myService: {
            name: 'hello',
            volumes: [
              '~/data:/var/data',
            ],
          },
        },
      }));
      after(() => yaml.load.restore());

      it('should do nothing', () => {
        expect(removeProperty(parseYAML('myYAMLFile.yml'), 'myOtherService', 'volumes')).to.deep.equals({
          version: '2',
          services: {
            myService: {
              name: 'hello',
              volumes: [
                '~/data:/var/data',
              ],
            },
          },
        });
      });
    });

    describe('when service does exist but the property does not', () => {
      before(() => sinon.stub(yaml, 'load').returns({
        version: '2',
        services: {
          myService: {
            name: 'hello',
          },
        },
      }));
      after(() => yaml.load.restore());

      it('should do nothing', () => {
        expect(removeProperty(parseYAML('myYAMLFile.yml'), 'myService', 'volumes')).to.deep.equals({
          version: '2',
          services: {
            myService: {
              name: 'hello',
            },
          },
        });
      });
    });

    describe('when service and property does exist', () => {
      before(() => sinon.stub(yaml, 'load').returns({
        version: '2',
        services: {
          myService: {
            name: 'hello',
            volumes: [
              '~/data:/var/data',
            ],
          },
        },
      }));
      after(() => yaml.load.restore());

      it('should remove unwanted property', () => {
        expect(removeProperty(parseYAML('myYAMLFile.yml'), 'myService', 'volumes')).to.deep.equals({
          version: '2',
          services: {
            myService: {
              name: 'hello',
            },
          },
        });
      });
    });
  });

  describe('Add Service', () => {
    describe('when version 1', () => {
      before(() => sinon.stub(yaml, 'load').returns({
        myService: {
          name: 'hello',
        },
      }));
      after(() => yaml.load.restore());

      it('should add service', () => {
        const newService = {
          myOtherService: {
            name: 'world',
          },
        };
        expect(addService(parseYAML('myYAMLFile.yml'), newService)).to.deep.equals({
          myService: {
            name: 'hello',
          },
          myOtherService: {
            name: 'world',
          },
        });
      });
    });

    describe('when has no services', () => {
      before(() => sinon.stub(yaml, 'load').returns({
        version: '2',
      }));
      after(() => yaml.load.restore());

      it('should add service', () => {
        const newService = {
          myService: {
            name: 'hello',
          },
        };

        expect(addService(parseYAML('myYAMLFile.yml'), newService)).to.deep.equals({
          version: '2',
          services: {
            myService: {
              name: 'hello',
            },
          },
        });
      });
    });

    describe('when has services', () => {
      before(() => sinon.stub(yaml, 'load').returns({
        version: '2',
        services: {
          myService: {
            name: 'hello',
          },
        },
      }));
      after(() => yaml.load.restore());

      it('should add service', () => {
        const newService = {
          myOtherService: {
            name: 'world',
          },
        };
        expect(addService(parseYAML('myYAMLFile.yml'), newService)).to.deep.equals({
          version: '2',
          services: {
            myService: {
              name: 'hello',
            },
            myOtherService: {
              name: 'world',
            },
          },
        });
      });
    });
  });

  describe('Join two Compose files', () => {
    describe('when version 1', () => {
      before(() => {
        sinon.stub(yaml, 'load')
          .onFirstCall()
          .returns({
            myService: {
              name: 'hello',
            },
          })
          .onSecondCall()
          .returns({
            myOtherService: {
              name: 'world',
            },
          });
      });
      after(() => yaml.load.restore());

      it('should join both compose files', () => {
        expect(join(parseYAML('myYAMLFile.yml'), parseYAML('myOtherYAMLFile.yml'))).to.deep.equals({
          myService: {
            name: 'hello',
          },
          myOtherService: {
            name: 'world',
          },
        });
      });
    });

    describe('when one compose has no services', () => {
      before(() => {
        sinon.stub(yaml, 'load')
          .onFirstCall()
          .returns({
            version: '2',
          })
          .onSecondCall()
          .returns({
            version: '2',
            services: {
              myService: {
                name: 'hello',
              },
            },
          });
      });
      after(() => yaml.load.restore());

      it('should add service', () => {
        expect(join(parseYAML('myYAMLFile.yml'), parseYAML('myOtherYAMLFile.yml'))).to.deep.equals({
          version: '2',
          services: {
            myService: {
              name: 'hello',
            },
          },
        });
      });
    });

    describe('when both compose have services', () => {
      before(() => {
        sinon.stub(yaml, 'load')
          .onFirstCall()
          .returns({
            version: '2',
            services: {
              myService: {
                name: 'hello',
              },
            },
          })
          .onSecondCall()
          .returns({
            version: '2.2',
            services: {
              myOtherService: {
                name: 'world',
              },
            },
          });
      });
      after(() => yaml.load.restore());

      it('should add service', () => {
        expect(join(parseYAML('myYAMLFile.yml'), parseYAML('myOtherYAMLFile.yml'))).to.deep.equals({
          version: '2.2',
          services: {
            myService: {
              name: 'hello',
            },
            myOtherService: {
              name: 'world',
            },
          },
        });
      });
    });

    describe('when both compose have same service', () => {
      before(() => {
        sinon.stub(yaml, 'load')
          .onFirstCall()
          .returns({
            version: '2',
            services: {
              myService: {
                name: 'hello',
              },
            },
          })
          .onSecondCall()
          .returns({
            version: '2.2',
            services: {
              myService: {
                name: 'world',
              },
            },
          });
      });
      after(() => yaml.load.restore());

      it('should overwrite first compose service', () => {
        expect(join(parseYAML('myYAMLFile.yml'), parseYAML('myOtherYAMLFile.yml'))).to.deep.equals({
          version: '2.2',
          services: {
            myService: {
              name: 'world',
            },
          },
        });
      });
    });
  });

  describe('Save YAML', () => {
    before(() => {
      sinon.stub(yaml, 'load').returns({
        version: '2',
        services: {
          myService: {
            name: 'hello',
            ports: [200, 80],
          },
        },
      });
      sinon.stub(fs, 'writeFileSync');
    });
    after(() => {
      yaml.load.restore();
      fs.writeFileSync.restore();
    });

    it('should save out the YAML', () => {
      expect(() => saveYAML(parseYAML('myYAMLFile.yml'), 'myOutput.yaml'))
        .to.not.throw();

      expect(fs.writeFileSync).to.have.been.calledOnce;
      // stripIndent removes the trailing new line which is needed
      // eslint-disable-next-line prefer-template
      expect(fs.writeFileSync).to.have.been.calledWith('myOutput.yaml', stripIndent`
        version: '2'
        services:
          myService:
            name: hello
            ports:
              - 200
              - 80` + '\n');
    });
  });

  describe('Terminal', () => {
    describe('Read', () => {
      it('should replace single quotes with double quotes', () => {
        expect(terminal.read('\'{"services":{"nginx":{"name":"hello"}}}\''))
          .to.equals('\'{"services":{"nginx":{"name":"hello"}}}\'');
      });
    });

    describe('Write', () => {
      it('should replace double quotes with single quotes and wrap in double quotes', () => {
        expect(terminal.write('{"services":{"nginx":{"name":"hello","command":""route -n | awk \'/UG[ \\t]/{print $$2}\'""}}}'))
          .to.equals('\'{"services":{"nginx":{"name":"hello","command":""route -n | awk \'"\'"\'/UG[ \\t]/{print $$2}\'"\'"\'""}}}\'');
      });
    });
  });

  describe(':: Integration ::', () => {
    describe('CLI ::', () => {
      describe('Parse', () => {
        it('should read in the YAML', () => {
          const joiner = path.resolve('bin/compose-joiner');
          const data = path.resolve('data1.yml');

          return execAsync(`${joiner} parse ${data}`)
            .then((stdout) => {
              expect(stdout).to.exist.and.not.be.empty;

              // Because the strings I'm comparing has both single and double quotes I'm opting
              // to use string template syntax so that I don't have to escape so much muddling
              // up the assertion. Its not how you should use string templates I know but I think
              // its better then the alternative in this case.

              // eslint-disable-next-line quotes
              expect(stdout).to.equal(`'{"version":"2.2","services":{"my-service":{"image":"myservice:latest","ports":["8080:80"],"environment":["COMMAND=\\"route -n | awk '"'"'/UG[ \\\\t]/{print $$2}'"'"'\\""]}}}'\n`);
            });
        });

        it('should print out property when piped through xargs', () => {
          const joiner = path.resolve('bin/compose-joiner');
          const data = path.resolve('data1.yml');

          return execAsync(`${joiner} parse ${data} | xargs echo`)
            .then((stdout) => {
              expect(stdout).to.exist.and.not.be.empty;
              // eslint-disable-next-line quotes
              expect(stdout).to.equal(`{"version":"2.2","services":{"my-service":{"image":"myservice:latest","ports":["8080:80"],"environment":["COMMAND=\\"route -n | awk '/UG[ \\\\t]/{print $$2}'\\""]}}}\n`);
            });
        });
      });

      describe('Remove', () => {
        it('should remove the service', () => {
          const joiner = path.resolve('bin/compose-joiner');
          // eslint-disable-next-line quotes
          const composeData = `'{"version":"2.2","services":{"nginx":{"image":"nginx","ports":["80:80","443:443"],"volumes":["/var/run/docker.sock:/tmp/docker.sock:ro","/etc/nginx/conf.d"]},"dnsmasq":{"image":"andyshinn/dnsmasq","ports":["192.168.99.100:53:53/tcp","192.168.99.100:53:53/udp"],"cap_add":["NET_ADMIN"],"command":"--address=/local/192.168.99.100","restart":"always"},"redis":{"image":"redis:2.8.13","ports":["6379:6379"],"volumes":["/var/docker/redis:/data"]},"zookeeper":{"image":"jplock/zookeeper:3.4.6","ports":["2181:2181"],"volumes":["/var/run/docker.sock:/var/run/docker.sock:ro"]},"kafka":{"image":"wurstmeister/kafka:0.9.0.1","ports":["9092"],"links":["zookeeper:zookeeper"],"environment":["KAFKA_ZOOKEEPER_CONNECT=zookeeper","HOSTNAME_COMMAND=\\"route -n | awk '"'"'/UG[ \\\\t]/{print $$2}'"'"'\\""],"volumes":["/var/run/docker.sock:/var/run/docker.sock"]}}}'`;

          return execAsync(`${joiner} remove nginx ${composeData}`)
            .then((stdout) => {
              expect(stdout).to.exist.and.not.be.empty;
              // eslint-disable-next-line quotes
              expect(stdout).to.equal(`'{"version":"2.2","services":{"dnsmasq":{"image":"andyshinn/dnsmasq","ports":["192.168.99.100:53:53/tcp","192.168.99.100:53:53/udp"],"cap_add":["NET_ADMIN"],"command":"--address=/local/192.168.99.100","restart":"always"},"redis":{"image":"redis:2.8.13","ports":["6379:6379"],"volumes":["/var/docker/redis:/data"]},"zookeeper":{"image":"jplock/zookeeper:3.4.6","ports":["2181:2181"],"volumes":["/var/run/docker.sock:/var/run/docker.sock:ro"]},"kafka":{"image":"wurstmeister/kafka:0.9.0.1","ports":["9092"],"links":["zookeeper:zookeeper"],"environment":["KAFKA_ZOOKEEPER_CONNECT=zookeeper","HOSTNAME_COMMAND=\\"route -n | awk '"'"'/UG[ \\\\t]/{print $$2}'"'"'\\""],"volumes":["/var/run/docker.sock:/var/run/docker.sock"]}}}'\n`);
            });
        });

        it('should print out property when piped through xargs', () => {
          const joiner = path.resolve('bin/compose-joiner');
          // eslint-disable-next-line quotes
          const composeData = `'{"version":"2.2","services":{"nginx":{"image":"nginx","ports":["80:80","443:443"],"volumes":["/var/run/docker.sock:/tmp/docker.sock:ro","/etc/nginx/conf.d"]},"dnsmasq":{"image":"andyshinn/dnsmasq","ports":["192.168.99.100:53:53/tcp","192.168.99.100:53:53/udp"],"cap_add":["NET_ADMIN"],"command":"--address=/local/192.168.99.100","restart":"always"},"redis":{"image":"redis:2.8.13","ports":["6379:6379"],"volumes":["/var/docker/redis:/data"]},"zookeeper":{"image":"jplock/zookeeper:3.4.6","ports":["2181:2181"],"volumes":["/var/run/docker.sock:/var/run/docker.sock:ro"]},"kafka":{"image":"wurstmeister/kafka:0.9.0.1","ports":["9092"],"links":["zookeeper:zookeeper"],"environment":["KAFKA_ZOOKEEPER_CONNECT=zookeeper","HOSTNAME_COMMAND=\\"route -n | awk '"'"'/UG[ \\\\t]/{print $$2}'"'"'\\""],"volumes":["/var/run/docker.sock:/var/run/docker.sock"]}}}'`;

          return execAsync(`${joiner} remove nginx ${composeData} | xargs echo`)
            .then((stdout) => {
              expect(stdout).to.exist.and.not.be.empty;
              // eslint-disable-next-line quotes
              expect(stdout).to.equal(`{"version":"2.2","services":{"dnsmasq":{"image":"andyshinn/dnsmasq","ports":["192.168.99.100:53:53/tcp","192.168.99.100:53:53/udp"],"cap_add":["NET_ADMIN"],"command":"--address=/local/192.168.99.100","restart":"always"},"redis":{"image":"redis:2.8.13","ports":["6379:6379"],"volumes":["/var/docker/redis:/data"]},"zookeeper":{"image":"jplock/zookeeper:3.4.6","ports":["2181:2181"],"volumes":["/var/run/docker.sock:/var/run/docker.sock:ro"]},"kafka":{"image":"wurstmeister/kafka:0.9.0.1","ports":["9092"],"links":["zookeeper:zookeeper"],"environment":["KAFKA_ZOOKEEPER_CONNECT=zookeeper","HOSTNAME_COMMAND=\\"route -n | awk '/UG[ \\\\t]/{print $$2}'\\""],"volumes":["/var/run/docker.sock:/var/run/docker.sock"]}}}\n`);
            });
        });

        it('should remove the service when piped to from parse command', () => {
          const joiner = path.resolve('bin/compose-joiner');
          const data = path.resolve('data.yml');

          return execAsync(`${joiner} parse ${data}`)
            .then((stdout) => {
              expect(stdout).to.exist.and.not.be.empty;
              return execAsync(`${joiner} remove nginx ${stdout}`);
            })
            .then((stdout) => {
              expect(stdout).to.exist.and.not.be.empty;
              // eslint-disable-next-line quotes
              expect(stdout).to.equal(`'{"version":"2.2","services":{"dnsmasq":{"image":"andyshinn/dnsmasq","ports":["192.168.99.100:53:53/tcp","192.168.99.100:53:53/udp"],"cap_add":["NET_ADMIN"],"command":"--address=/local/192.168.99.100","restart":"always"},"redis":{"image":"redis:2.8.13","ports":["6379:6379"],"volumes":["/var/docker/redis:/data"]},"zookeeper":{"image":"jplock/zookeeper:3.4.6","ports":["2181:2181"],"volumes":["/var/run/docker.sock:/var/run/docker.sock:ro"]},"kafka":{"image":"wurstmeister/kafka:0.9.0.1","ports":["9092"],"links":["zookeeper:zookeeper"],"environment":["KAFKA_ZOOKEEPER_CONNECT=zookeeper","HOSTNAME_COMMAND=\\"route -n | awk '"'"'/UG[ \\\\t]/{print $$2}'"'"'\\""],"volumes":["/var/run/docker.sock:/var/run/docker.sock"]}}}'\n`);
            });
        });
      });

      describe('Property', () => {
        describe('Get', () => {
          it('should print out property', () => {
            const joiner = path.resolve('bin/compose-joiner');
            // eslint-disable-next-line quotes
            const composeData = `'{"version":"2.2","services":{"my-service":{"image":"myservice:latest","ports":["8080:80"],"environment":["COMMAND=\\"route -n | awk '"'"'/UG[ \\\\t]/{print $$2}'"'"'\\""]}}}'`;

            return execAsync(`${joiner} property my-service environment ${composeData}`)
              .then((stdout) => {
                expect(stdout).to.exist.and.not.be.empty;
                // eslint-disable-next-line quotes
                expect(stdout).to.equal(`  my-service.environment = '["COMMAND=\\"route -n | awk '"'"'/UG[ \\\\t]/{print $$2}'"'"'\\""]'\n`);
              });
          });

          it('should print out properly when piped to xargs', () => {
            const joiner = path.resolve('bin/compose-joiner');
            // eslint-disable-next-line quotes
            const composeData = `'{"version":"2.2","services":{"my-service":{"image":"myservice:latest","ports":["8080:80"],"environment":["COMMAND=\\"route -n | awk '"'"'/UG[ \\\\t]/{print $$2}'"'"'\\""]}}}'`;

            return execAsync(`${joiner} property my-service environment ${composeData} | xargs echo`)
              .then((stdout) => {
                expect(stdout).to.exist.and.not.be.empty;
                // eslint-disable-next-line quotes
                expect(stdout).to.equal(`my-service.environment = ["COMMAND=\\"route -n | awk '/UG[ \\\\t]/{print $$2}'\\""]\n`);
              });
          });

          it('should print out property when piped to from parse command', () => {
            const joiner = path.resolve('bin/compose-joiner');
            const data = path.resolve('data1.yml');

            return execAsync(`${joiner} parse ${data}`)
              .then((stdout) => {
                expect(stdout).to.exist.and.not.be.empty;
                return execAsync(`${joiner} property my-service environment ${stdout}`);
              })
              .then((stdout) => {
                expect(stdout).to.exist.and.not.be.empty;
                // eslint-disable-next-line quotes
                expect(stdout).to.equal(`  my-service.environment = '["COMMAND=\\"route -n | awk '"'"'/UG[ \\\\t]/{print $$2}'"'"'\\""]'\n`);
              });
          });
        });

        describe('Update', () => {
          it('should update property', () => {
            const joiner = path.resolve('bin/compose-joiner');
            // eslint-disable-next-line quotes
            const composeData = `'{"version":"2.2","services":{"my-service":{"image":"myservice:latest","ports":["8080:80"],"environment":["COMMAND=\\"route -n | awk '"'"'/UG[ \\\\t]/{print $$2}'"'"'\\""]}}}'`;

            return execAsync(`${joiner} property my-service environment ${composeData} --add [\\"8080:80\\"]`)
              .then((stdout) => {
                expect(stdout).to.exist.and.not.be.empty;
                // eslint-disable-next-line quotes
                expect(stdout).to.equal(`'{"version":"2.2","services":{"my-service":{"image":"myservice:latest","ports":["8080:80"],"environment":["8080:80"]}}}'\n`);
              });
          });

          it('should print out property when piped through xargs', () => {
            const joiner = path.resolve('bin/compose-joiner');
            // eslint-disable-next-line quotes
            const composeData = `'{"version":"2.2","services":{"my-service":{"image":"myservice:latest","ports":["8080:80"],"environment":["COMMAND=\\"route -n | awk '"'"'/UG[ \\\\t]/{print $$2}'"'"'\\""]}}}'`;

            return execAsync(`${joiner} property my-service environment ${composeData} --add [\\"8080:80\\"] | xargs echo`)
              .then((stdout) => {
                expect(stdout).to.exist.and.not.be.empty;
                // eslint-disable-next-line quotes
                expect(stdout).to.equal(`{"version":"2.2","services":{"my-service":{"image":"myservice:latest","ports":["8080:80"],"environment":["8080:80"]}}}\n`);
              });
          });

          it('should update property when piped to from parse command', () => {
            const joiner = path.resolve('bin/compose-joiner');
            const data = path.resolve('data1.yml');

            return execAsync(`${joiner} parse ${data}`)
              .then((stdout) => {
                expect(stdout).to.exist.and.not.be.empty;
                return execAsync(`${joiner} property my-service environment --add [\\"8080:80\\"] ${stdout}`);
              })
              .then((stdout) => {
                expect(stdout).to.exist.and.not.be.empty;
                // eslint-disable-next-line quotes
                expect(stdout).to.equal(`'{"version":"2.2","services":{"my-service":{"image":"myservice:latest","ports":["8080:80"],"environment":["8080:80"]}}}'\n`);
              });
          });
        });

        describe('Remove', () => {
          it('should remove property', () => {
            const joiner = path.resolve('bin/compose-joiner');
            // eslint-disable-next-line quotes
            const composeData = `'{"version":"2.2","services":{"my-service":{"image":"myservice:latest","ports":["8080:80"],"environment":["COMMAND=\\"route -n | awk '"'"'/UG[ \\\\t]/{print $$2}'"'"'\\""]}}}'`;

            return execAsync(`${joiner} property my-service environment ${composeData} -D`)
              .then((stdout) => {
                expect(stdout).to.exist.and.not.be.empty;
                // eslint-disable-next-line quotes
                expect(stdout).to.equal(`'{"version":"2.2","services":{"my-service":{"image":"myservice:latest","ports":["8080:80"]}}}'\n`);
              });
          });

          it('should print out property when piped through xargs', () => {
            const joiner = path.resolve('bin/compose-joiner');
            // eslint-disable-next-line quotes
            const composeData = `'{"version":"2.2","services":{"my-service":{"image":"myservice:latest","ports":["8080:80"],"environment":["COMMAND=\\"route -n | awk '"'"'/UG[ \\\\t]/{print $$2}'"'"'\\""]}}}'`;

            return execAsync(`${joiner} property my-service environment ${composeData} -D | xargs echo`)
              .then((stdout) => {
                expect(stdout).to.exist.and.not.be.empty;
                // eslint-disable-next-line quotes
                expect(stdout).to.equal(`{"version":"2.2","services":{"my-service":{"image":"myservice:latest","ports":["8080:80"]}}}\n`);
              });
          });

          it('should remove property when piped to from parse command', () => {
            const joiner = path.resolve('bin/compose-joiner');
            const data = path.resolve('data1.yml');

            return execAsync(`${joiner} parse ${data}`)
              .then((stdout) => {
                expect(stdout).to.exist.and.not.be.empty;
                return execAsync(`${joiner} property my-service environment -D ${stdout}`);
              })
              .then((stdout) => {
                expect(stdout).to.exist.and.not.be.empty;
                // eslint-disable-next-line quotes
                expect(stdout).to.equal(`'{"version":"2.2","services":{"my-service":{"image":"myservice:latest","ports":["8080:80"]}}}'\n`);
              });
          });
        });
      });
    });
  });
});
