const expect = require('chai').expect;
const authMiddleware = require('../middleware/is-auth');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

describe('Auth middleware', () => {
  it('should throw an error if no authorization header is present', () => {
    const req = {
      get: function (headerName) {
        return null;
      }
    }

    expect(authMiddleware.bind(this, req, {}, () => { })).to.throw('Not authenticated!').with.property('statusCode', 401);
  });

  it('should throw an error if the authorization header is only one string', () => {
    const req = {
      get: function (headerName) {
        return 'asinglestring';
      }
    }

    expect(authMiddleware.bind(this, req, {}, () => { })).to.throw('jwt must be provided');
  });

  it('should throw an error if the token cannot be verified', () => {
    const req = {
      get: function (headerName) {
        return 'Bearer abc';
      }
    }

    expect(authMiddleware.bind(this, req, {}, () => { })).to.throw('jwt malformed');
  });

  it('should yield a userId after decoding the token', () => {
    const req = {
      get: (headerName) => {
        return 'Bearer abc';
      }
    }
    sinon.stub(jwt, 'verify');
    jwt.verify.returns({ userId: 'abc' });
    authMiddleware(req, {}, () => { });
    expect(req).to.have.property('userId', 'abc');
    expect(jwt.verify.called).to.be.true;
    jwt.verify.restore();
  });

});
