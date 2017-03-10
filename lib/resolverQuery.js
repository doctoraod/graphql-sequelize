'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _argsToFindOptions = require('./argsToFindOptions');

var _argsToFindOptions2 = _interopRequireDefault(_argsToFindOptions);

var _relay = require('./relay');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function resolverFactory(model, sql, options) {
  var resolverQuery;
  const queryGenerator = model.getQueryInterface().QueryGenerator;
  var reslove = function reslove(findOptions) {
    var query, options;
    const mainQueryItems = [];
    const whereQueryItems = {
      before: '',
      after: ''
    };
    if (findOptions.where) {
      whereQueryItems.before = 'SELECT * FROM (';
      whereQueryItems.after = `) subquery WHERE ${queryGenerator.getWhereConditions(findOptions.where)}`;
    }
    if (findOptions.order) {
      const orders = queryGenerator.getQueryOrders(findOptions);
      if (orders.mainQueryOrder.length) {
        mainQueryItems.push(' ORDER BY ' + orders.mainQueryOrder.join(', '));
      }
    }
    const limitOrder = queryGenerator.addLimitAndOffset(findOptions);
    if (limitOrder) {
      mainQueryItems.push(limitOrder);
    }
    query = `${whereQueryItems.before}${findOptions.sql}${whereQueryItems.after}${mainQueryItems.join('')}`;
    options = {
      replacements: findOptions.replacements,
      type: model.QueryTypes.SELECT
    };
    return model.query(query, options);
  };
  options = options || {};
  resolverQuery = function resolverQuery(source, args, context, info) {
    var targetAttribute = [];
    Object.keys(args).forEach(function (key) {
      if (key !== 'limit' && key !== 'order' && key !== 'replacements' && key !== 'where') {
        targetAttribute.push(key);
      }
    });
    var type = info.returnType,
        findOptions = (0, _argsToFindOptions2.default)(args, targetAttribute);
    info = _extends({}, info, {
      type: type,
      source: source
    });
    context = context || {};
    if ((0, _relay.isConnection)(type)) {
      type = (0, _relay.nodeType)(type);
    }
    type = type.ofType || type;
    findOptions.attributes = args;
    findOptions.logging = findOptions.logging || context.logging;
    findOptions.sql = sql || '';
    findOptions.where = Object.assign(findOptions.where, args.where || {});
    var getType = {};
    if (options && getType.toString.call(options) === '[object Function]') {
      // before is function
      return _bluebird2.default.resolve(options(findOptions, args, context, info)).then(function (findOptions) {
        return reslove(findOptions);
      });
    } else {
      findOptions.replacements = options;
      return reslove(findOptions);
    }
  };
  return resolverQuery;
}

module.exports = resolverFactory;