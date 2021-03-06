'use strict';

const request = require('request'),
      urljoin = require('url-join'),
      async = require('async'),
      Q = require('q'),
      _ = require('lodash'),
      path = require('path');

const JSON_CONTENT_TYPE = 'application/json',
      DEFAULT_CALENDAR_NAME = 'Events';

module.exports = function(dependencies) {
  const davserver = dependencies('davserver').utils;
  const token = dependencies('auth').token;

  return {
    getEvent,
    getEventPath,
    iTipRequest,
    getCalendarList
  };

  function getCalendarList(userId) {
    return _requestCaldav(userId, null, null, (url, token) => ({
        method: 'GET',
        url: url,
        json: true,
        headers: {
          ESNToken: token,
          Accept: JSON_CONTENT_TYPE
        }
      })).then(res => {
        if (res && res._embedded && res._embedded['dav:calendar']) {
          return _.map(res._embedded['dav:calendar'], calendar => {
            const uri = calendar._links.self.href.replace('.json', ''); // No JSON for *DAV URI

            return {
              id: path.basename(uri),
              uri: uri,
              name: calendar['dav:name'] || DEFAULT_CALENDAR_NAME,
              description: calendar['caldav:description'],
              color: calendar['apple:color']
            };
          });
        }

        return [];
      });
  }

  function getEvent(userId, calendarURI, eventUID) {
    return _requestCaldav(userId, calendarURI, eventUID, (url, token) => ({
        method: 'GET',
        url: url,
        headers: {
          ESNToken: token
        }
      })
    );
  }

  function getEventPath(userId, calendarURI, eventUID) {
    return calendarURI && eventUID ? urljoin(userId, calendarURI, eventUID + '.ics') : userId;
  }

  function iTipRequest(userId, jcal) {
    return _requestCaldav(userId, null, null, (url, token) => ({
      method: 'ITIP',
      url: url,
      headers: {
        ESNToken: token
      },
      body: jcal,
      json: true
    }));
  }

  function _requestCaldav(userId, calendarURI, eventUID, formatRequest) {
    const deferred = Q.defer();

    async.parallel([
        function(cb) {
          _buildEventUrl(userId, calendarURI, eventUID, function(url) {
            return cb(null, url);
          });
        },
        function(cb) {
          token.getNewToken({user: userId}, cb);
        }
      ],
      function(err, results) {
        if (err) {
          return deferred.reject(err);
        }

        request(formatRequest(results[0], results[1].token), function(err, response) {
          if (err || response.statusCode < 200 || response.statusCode >= 300) {
            return deferred.reject(err ? err.message : response.body);
          }

          return deferred.resolve(response.body);
        });
      });

    return deferred.promise;
  }

  function _buildEventUrl(userId, calendarURI, eventUID, callback) {
    davserver.getDavEndpoint(function(davserver) {
      return callback(urljoin(davserver, 'calendars', getEventPath(userId, calendarURI, eventUID)));
    });
  }
};
