const fp = require('lodash/fp');
const { ENTITY_TYPES } = require('./constants');

const createLookupResults = (
  options,
  entities,
  _entitiesThatExistInMISP,
  polarityTag
) => {
  const entitiesThatExistInMISP = fp.flow(
    fp.filter(({ value }) =>
      fp.any(({ value: _value }) => fp.toLower(value) === fp.toLower(_value), entities)
    ),
    fp.map((foundEntity) => ({ ...foundEntity, type: ENTITY_TYPES[foundEntity.type]}))
  )(_entitiesThatExistInMISP);

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
          polarityTag: polarityTag && { ...polarityTag, colour: '#5ecd1e' }
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
            type: fp.includes('IP', entity.type) ? 'ip' : fp.toLower(entity.type)
          })
        : agg,
    [],
    entities
  );

module.exports = createLookupResults;
