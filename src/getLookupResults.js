const fp = require('lodash/fp');

const { _P, partitionFlatMap, splitOutIgnoredIps } = require('./dataTransformations');
const createLookupResults = require('./createLookupResults');

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

      const entitiesThatExistInTS = await partitionFlatMap(
        async (entities) =>
          fp.getOr(
            [],
            'body',
            await requestWithDefaults({
              // query to get found entities
            })
          ),
        5,
        entitiesPartition
      );

      const orgTags = fp.flow(
        fp.getOr([], 'body'),
        fp.map(fp.get('name'))
      )(
        await requestWithDefaults({
          // get tags
        })
      );

      const lookupResults = createLookupResults(
        options,
        entitiesPartition,
        entitiesThatExistInTS,
        orgTags
      );

      Logger.trace({ lookupResults, entitiesThatExistInTS }, 'Lookup Results');

      return lookupResults.concat(ignoredIpLookupResults);
    },
    20,
    entities
  );

module.exports = {
  getLookupResults
};
