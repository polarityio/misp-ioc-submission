const fp = require('lodash/fp');

const { _P, partitionFlatMap, splitOutIgnoredIps } = require('./dataTransformations');
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

            return fp.getOr([], 'body.response.Attribute', searchResponse);
          }, entitiesPartition)
        )
      );
      
      Logger.trace({
        test: 'entitiesThatExistInMISP',
        entitiesThatExistInMISP
      });



      const lookupResults = createLookupResults(
        options,
        entitiesPartition,
        entitiesThatExistInMISP
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
