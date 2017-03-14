import argsToFindOptions from './argsToFindOptions';
import {isConnection, nodeType} from './relay';
import Promise from 'bluebird';

function resolverFactory(model, sql, options, mappingModel) {
  var resolverQuery;
  const queryGenerator = model.getQueryInterface().QueryGenerator;
  var reslove = function reslove(findOptions) {
    var query, options;
    const mainQueryItems = [];
    const whereQueryItems = {
      before: '',
      after: '',
    };
    if (findOptions.where && Object.keys(findOptions.where).length !== 0) {
      whereQueryItems.before = 'SELECT * FROM (';
      whereQueryItems.after = `) subquery WHERE ${queryGenerator.getWhereConditions(findOptions.where)}`;
    }
    if (findOptions.order) {
      const orders = queryGenerator.getQueryOrders(findOptions);
      if (orders.mainQueryOrder.length) {
        mainQueryItems.push(' ORDER BY ' + orders.mainQueryOrder.join(', '));
      }
    }
    if (!findOptions.limit) {
      findOptions.limit = 2000;
    }
    if (findOptions.limit > 2000) {
      // fixbug query slow
      throw new Error(`limit more than 2000,If you want 4000 row. Recommend request 2 times,
      Example (limit: 2000,offset: 0) and (limit: 2000, offset: 1)`);
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
    options = Object.assign({}, options, mappingModel ? { model: mappingModel } : {});
    return model.query(query, options);
  };
  options = options || {};
  resolverQuery = function (source, args, context, info) {
    var targetAttribute = [];
    Object.keys(args).forEach(function (key) {
      if (key !== 'limit' && key !== 'offset' && key !== 'order' && key !== 'replacements' && key !== 'where') {
        targetAttribute.push(key);
      }
    });
    var type = info.returnType,
      findOptions = argsToFindOptions(args, targetAttribute);
    info = {
      ...info,
      type: type,
      source: source
    };
    context = context || {};
    if (isConnection(type)) {
      type = nodeType(type);
    }
    type = type.ofType || type;
    findOptions.attributes = args;
    findOptions.logging = findOptions.logging || context.logging;
    findOptions.sql = sql || '';
    findOptions.where = Object.assign(findOptions.where || {}, args.where || {});
    var getType = {};
    if (options && getType.toString.call(options) === '[object Function]') {
        // before is function
      return Promise
                .resolve(options(findOptions, args, context, info))
                .then(function (findOptions) {
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
