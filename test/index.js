'use strict';

const chai = require('chai');
const { stripIndent } = require('common-tags');
const fs = require('fs');
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
        expect(terminal.read("{'services':{'nginx':{'name':'hello'}}}"))
          .to.equals('{"services":{"nginx":{"name":"hello"}}}');
      });
    });

    describe('Write', () => {
      it('should replace double quotes with single quotes and wrap in double quotes', () => {
        expect(terminal.write('{"services":{"nginx":{"name":"hello"}}}'))
          .to.equals('"{\'services\':{\'nginx\':{\'name\':\'hello\'}}}"');
      });
    });
  });
});
