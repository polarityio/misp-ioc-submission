const fp = require('lodash/fp');

const { splitOutIgnoredIps } = require('./dataTransformations');
const createLookupResults = require('./createLookupResults');
const { flow, find, get, toLower, eq, trim, map, getOr, split, filter } = require('lodash/fp');
const MAX_EVENTS_PER_ATTRIBUTE = 10;

const getLookupResults = async (entities, options, requestWithDefaults, Logger) => {
  const { entitiesPartition, ignoredIpLookupResults } = splitOutIgnoredIps(entities);

  const _entitiesPartition = filter(
    (entity) => !_isEntityBlocklisted(entity, options, Logger),
    entitiesPartition
  );

  const entitiesThatExistInMISP = fp.flatten(
    await Promise.all(
      map(async (entity) => {
        const searchResponse = !_isEntityBlocklisted(entity, options, Logger)
          ? await requestWithDefaults({
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
            })
          : {};

        return flow(
          getOr([], 'body.response.Attribute'),
          map((attribute) => ({ ...attribute, type: entity.type }))
        )(searchResponse);
      }, _entitiesPartition)
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
    _entitiesPartition,
    entitiesThatExistInMISP,
    polarityTag,
    categoriesAndTypes
  );

  Logger.trace({ lookupResults, entitiesThatExistInMISP }, 'Lookup Results');

  return lookupResults.concat(ignoredIpLookupResults);
};

function _isEntityBlocklisted(
  entity,
  { blocklist, ipBlocklistRegex, domainBlocklistRegex },
  Logger
) {
  const isInBlocklist = flow(
    split(','),
    map(flow(trim, toLower)),
    find((blocklistItem) => flow(get('value'), toLower, eq(blocklistItem))(entity))
  )(blocklist);

  Logger.trace({ blocklist, isInBlocklist }, 'checking to see what blocklist looks like');

  const ipIsInBlocklistRegex =
    ipBlocklistRegex &&
    entity.isIP &&
    new RegExp(ipBlocklistRegex, 'i').test(entity.value);

  if (ipIsInBlocklistRegex)
    Logger.debug({ ip: entity.value }, 'Blocked BlockListed IP Lookup');

  const domainIsInBlocklistRegex =
    domainBlocklistRegex &&
    entity.isDomain &&
    new RegExp(domainBlocklistRegex, 'i').test(entity.value);

  if (domainIsInBlocklistRegex)
    Logger.debug({ domain: entity.value }, 'Blocked BlockListed Domain Lookup');

  return isInBlocklist || ipIsInBlocklistRegex || domainIsInBlocklistRegex;
}

module.exports = {
  getLookupResults
};
