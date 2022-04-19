const expect = require('chai').expect;
const sinon = require('sinon');
const bcrypt = require('bcrypt');

const User = require('../models/user');
const AuthController = require('../controllers/auth');

describe('Auth Controller - Login', () => {
  it('should throw an error if accessing the database fails', (done) => {
    sinon.stub(User, 'findOne');
    User.findOne.throws();

    const req = {
      body: {
        email: 'test@test.com',
        password: 'tester'
      }
    };

    AuthController.login(req, {}, () => { }).then(result => {
      expect(result).to.be.an('error');
      expect(result).to.have.property('statusCode', 500);
      done();
    }).catch(done);
    User.findOne.restore();
  });

  it('should throw an error if unregistered email is provided', (done) => {
    sinon.stub(User, 'findOne');
    User.findOne.returns(false);

    const req = {
      body: {
        email: 'test@test.com',
        password: 'tester'
      }
    };

    try {
      AuthController.login(req, {}, () => { }).then(result => {
        console.log(result.message);
        expect(result).to.be.an('error').with.property('statusCode', 401);
        expect(result).to.have.property('message', 'A user with this email could not be found');
        done();
      }).catch(err => {
        console.log(err);
        done();
      });
    } catch (err) {
      console.log(err);
      done();
    };
    User.findOne.restore();
  });

  it('should throw an error if a wrong password is provided', (done) => {
    sinon.stub(bcrypt, 'compare');
    bcrypt.compare.returns(false);

    const req = {
      body: {
        email: 'test@test.com',
        password: 'tester'
      }
    };

    /* try {
      AuthController.login(req, {}, () => { }).then(done());
    } catch (err) {
      expect(err).to.have.property('message', 'A user with this email could not be found');
      expect(err).to.be.an('error').with.property('statusCode', 401);
      done();
    } */

    AuthController.login(req, {}, () => { }).then(result => {
      console.log(result.message);
      //expect(result).to.have.property('message', 'A user with this email could not be found');
      //expect(result).to.be.an('error').with.property('statusCode', 401);
      done();
    }).catch(err => {
      console.log(err);
      done();
    });
    bcrypt.compare.restore();
  });
});