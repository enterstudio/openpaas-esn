'use strict';

var mockery = require('mockery'),
    path = require('path'),
    fs = require('fs-extra'),
    helpers = require('../helpers');
var testConfig = require('../config/servers-conf.js');

before(function() {
  var basePath = path.resolve(__dirname + '/../..');
  var tmpPath = path.resolve(basePath, 'tmp');
  this.testEnv = {
    serversConfig: testConfig,
    basePath: basePath,
    tmp: tmpPath,
    fixtures: path.resolve(__dirname + '/fixtures'),
    mongoUrl: 'mongodb://localhost:' + testConfig.mongodb.port + '/' + testConfig.mongodb.dbname,
    writeDBConfigFile: function() {
      fs.writeFileSync(tmpPath + '/db.json', JSON.stringify({connectionString: 'mongodb://localhost:' + testConfig.mongodb.port + '/' + testConfig.mongodb.dbname}));
    },
    removeDBConfigFile: function() {
      fs.unlinkSync(tmpPath + '/db.json');
    },
    initCore: function(callback) {
      var core = require(basePath + '/backend/core');
      core.init();
      if (callback) {
        callback();
      }
      return core;
    }
  };
  this.helpers = {};
  helpers(this.helpers, this.testEnv);
  process.env.NODE_CONFIG = this.testEnv.tmp;
  process.env.NODE_ENV = 'test';
  fs.copySync(__dirname + '/default.test.json', this.testEnv.tmp + '/default.json');
});

after(function(done) {
  delete process.env.NODE_CONFIG;
  fs.unlinkSync(this.testEnv.tmp + '/default.json');
  this.helpers.mongo.dropDatabase(done);
});

beforeEach(function() {
  mockery.enable({warnOnReplace: false, warnOnUnregistered: false, useCleanCache: true});
});

afterEach(function() {
  try {
    require('mongoose').disconnect();
  } catch (e) {}
  mockery.resetCache();
  mockery.deregisterAll();
  mockery.disable();
});
