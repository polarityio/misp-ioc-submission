const fp = require('lodash/fp');

const { partitionFlatMap, splitOutIgnoredIps } = require('./dataTransformations');
const createLookupResults = require('./createLookupResults');
const MAX_EVENTS_PER_ATTRIBUTE = 10;

const getLookupResults = (
  entities,
  options,
  requestWithDefaults,
  Logger
) =>
  partitionFlatMap(
    async (_entitiesPartition) => {
      const { entitiesPartition, ignoredIpLookupResults } = splitOutIgnoredIps(
        _entitiesPartition
      );
      const entitiesThatExistInMISP = fp.flatten(
        await Promise.all(
          fp.map(async (entity) => {
            const searchResponse = await requestWithDefaults({
              url: `${options.url}/attributes/restSearch`,
              method: 'POST',
              headers: {
                Authorization: options.apiKey,
                Accept: 'application/json',
                'Content-type': 'application/json'
              },
              body: JSON.stringify({
                value: entity.value.toLowerCase(),
                limit: MAX_EVENTS_PER_ATTRIBUTE,
                includeEventTags: true
              })
            });

            return fp.flow(
              fp.getOr([], 'body.response.Attribute'),
              fp.map((attribute) => ({ ...attribute, type: entity.type }))
            )(searchResponse);
          }, entitiesPartition)
        )
      );
      
      const polarityTag = fp.get(
        'body.Tag[0]',
        await requestWithDefaults({
          url: `${options.url}/tags/index/searchall:Submitted_By_Polarity`,
          method: 'GET',
          headers: {
            Authorization: options.apiKey,
            Accept: 'application/json',
            'Content-type': 'application/json'
          }
        })
      );

      const categoriesAndTypes = fp.get(
        'body.result',
        await requestWithDefaults({
          url: `${options.url}/attributes/describeTypes`,
          method: 'GET',
          headers: {
            Authorization: options.apiKey,
            Accept: 'application/json',
            'Content-type': 'application/json'
          }
        })
      );

      const lookupResults = createLookupResults(
        options,
        entitiesPartition,
        entitiesThatExistInMISP,
        polarityTag,
        categoriesAndTypes
      );

      Logger.trace({ lookupResults, entitiesThatExistInMISP }, 'Lookup Results');

      return lookupResults.concat(ignoredIpLookupResults);
    },
    20,
    entities
  );

module.exports = {
  getLookupResults
};
