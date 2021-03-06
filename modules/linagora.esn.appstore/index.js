'use strict';

var moduleManager = require('../../backend/module-manager');
var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

var awesomeAppStore = new AwesomeModule('linagora.esn.awesomeappstore', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.filestore', 'filestore'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.image', 'image'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.db', 'db'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.domain', 'domain'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.community', 'community'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.pubsub', 'pubsub'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.injection', 'injection'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],
  states: {
    lib: function(dependencies, callback) {
      var schemas = dependencies('db').mongo.schemas;

      require('./backend/db/mongo/application')(schemas);

      var AwesomeAppManager = require('./backend/appstore-manager').AwesomeAppManager;
      var appManager = new AwesomeAppManager(dependencies, moduleManager);
      require('./backend/injection/pubsub').init(dependencies);

      var app = require('./backend/webserver/application')(appManager, dependencies);

      return callback(null, {
        app: app,
        manager: appManager
      });
    },

    deploy: function(dependencies, callback) {
      var webserverWrapper = dependencies('webserver-wrapper');
      webserverWrapper.injectAngularModules('appstore', ['appstore.js', 'controllers.js', 'directives.js', 'services.js'], 'esn.appstore', ['esn']);
      var lessFile = path.resolve(__dirname, './frontend/css/styles.less');
      webserverWrapper.injectLess('appstore', [lessFile], 'esn');
      webserverWrapper.addApp('appstore', this.app);
      return callback();
    },

    start: function(dependencies, callback) {
      var esnconfig = dependencies('esn-config');
      var logger = dependencies('logger');

      function startEsnModules() {
        esnconfig('injection').get('modules', function(err, modules) {
          if (err) {
            return callback(err);
          }

          if (!modules) {
            return callback(null);
          }

          moduleManager.manager.fire('start', modules).then(function() {
            callback(null);
          }, function(err) {
            // Do not fail if a module is not found.
            logger.error(err.message);
            callback(null);
          });
        });
      }

      startEsnModules();
    }
  }
});

module.exports = awesomeAppStore;
