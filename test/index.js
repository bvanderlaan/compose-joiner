'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');


chai.use(sinonChai);
const { expect } = chai;

describe('Joiner', () => {
 it('should fail', () => {
   expect(1).to.equal(2);
 })
});
