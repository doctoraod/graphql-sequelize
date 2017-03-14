'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = argsToFindOptions;

var _replaceWhereOperators = require('./replaceWhereOperators');

function argsToFindOptions(args, targetAttributes) {
  var result = {};

  if (args) {
    Object.keys(args).forEach(function (key) {
      if (~targetAttributes.indexOf(key)) {
        result.where = result.where || {};
        result.where[key] = args[key];
      }

      if (key === 'limit' && args[key]) {
        result.limit = parseInt(args[key], 10);
      }

      if (key === 'offset' && args[key]) {
        result.offset = parseInt(args[key], 10);
      }

      if (key === 'order' && args[key]) {
        if (Array.isArray(args[key])) {
          result.order = args[key];
        } else if (args[key].indexOf('reverse:') === 0) {
          result.order = [[args[key].substring(8), 'DESC']];
        } else {
          result.order = [[args[key], 'ASC']];
        }
      }

      if (key === 'where' && args[key]) {
        // setup where
        result.where = (0, _replaceWhereOperators.replaceWhereOperators)(args.where);
      }
    });
  }
  if (!result.limit) {
    result.limit = 2000;
  }
  if (result.limit > 2000) {
    // fixbug query slow
    throw new Error(`limit more than 2000,If you want 4000 row. Recommend request 2 times,
    Example (limit: 2000,offset: 0) and (limit: 2000, offset: 1)`);
  }
  return result;
}