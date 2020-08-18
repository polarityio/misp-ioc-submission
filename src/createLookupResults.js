const fp = require('lodash/fp');
const { THREAT_TYPES } = require('./constants');

const createLookupResults = (options, entities, _entitiesThatExistInMISP) => {
  const entitiesThatExistInMISP = fp.filter(
    ({ value }) =>
      fp.any(({ value: _value }) => fp.toLower(value) === fp.toLower(_value), entities),
    _entitiesThatExistInMISP
  );
  const notFoundEntities = getNotFoundEntities(entitiesThatExistInMISP, entities);
  return [
    {
      entity: { ...entities[0], value: 'MISP IOC Submission' },
      isVolatile: true,
      data: {
        summary: [
          ...(entitiesThatExistInMISP.length ? ['Entities Found'] : []),
          ...(notFoundEntities.length ? ['New Entites'] : [])
        ],
        details: {
          url: options.url,
          entitiesThatExistInMISP,
          notFoundEntities,
          threatTypes: getThreatTypes(entities)
        }
      }
    }
  ];
};

const getNotFoundEntities = (entitiesThatExistInMISP, entities) =>
  fp.reduce(
    (agg, entity) =>
      !fp.any(
        ({ value }) => fp.lowerCase(entity.value) === fp.lowerCase(value),
        entitiesThatExistInMISP
      )
        ? agg.concat({
            ...entity,
            type: fp.includes('IP', entity.type) ? 'ip' : entity.type
          })
        : agg,
    [],
    entities
  );

const getThreatTypes = fp.flow(
  fp.flatMap(fp.get('types')),
  fp.uniq,
  fp.flatMap((uniqEntityType) => fp.getOr([], uniqEntityType, THREAT_TYPES)),
  fp.uniqBy('type')
);

module.exports = createLookupResults;
