const fp = require('lodash/fp');
const _ = require('lodash');

const { splitOutIgnoredIps } = require('./dataTransformations');
const createLookupResults = require('./createLookupResults');
const MAX_EVENTS_PER_ATTRIBUTE = 10;

let previousDomainRegexAsString = '';
let previousIpRegexAsString = '';
let domainBlocklistRegex = null;
let ipBlocklistRegex = null;

<<<<<<< Updated upstream
const getLookupResults = async (entities, options, requestWithDefaults, Logger) => {
  const { entitiesPartition, ignoredIpLookupResults } = splitOutIgnoredIps(entities);

  _setupRegexBlocklists(options, Logger);
=======
const getLookupResults = async (entities, options, requestWithDefaults, log) => {
  const { entitiesPartition, ignoredIpLookupResults } = splitOutIgnoredIps(entities);

  _setupRegexBlocklists(options, log);
>>>>>>> Stashed changes

  const entitiesThatExistInMISP = fp.flatten(
    await Promise.all(
      fp.map(async (entity) => {
        let searchResponse;

<<<<<<< Updated upstream
        if (!_isEntityBlocklisted(entity, options, Logger)) {
=======
        if (!_isEntityBlocklisted(entity, options, log)) {
>>>>>>> Stashed changes
          searchResponse = await requestWithDefaults({
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
        }

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

  log.trace({ lookupResults, entitiesThatExistInMISP }, 'Lookup Results');

  return lookupResults.concat(ignoredIpLookupResults);
};

<<<<<<< Updated upstream
function _isEntityBlocklisted(entity, options, Logger) {
  const blocklist = options.blocklist;

  Logger.trace({ blocklist: blocklist }, 'checking to see what blocklist looks like');

  if (_.includes(blocklist, entity.value.toLowerCase())) {
    Logger.trace({ HERE: 'HERE' });
    return true;
  }

  Logger.trace({ SHOULDNT_SEE_THIS: entity });
  if (entity.isIP && !entity.isPrivateIP) {
    if (ipBlocklistRegex !== null) {
      if (ipBlocklistRegex.test(entity.value)) {
        Logger.debug({ ip: entity.value }, 'Blocked BlockListed IP Lookup');
        return true;
      }
    }
  }

  if (entity.isDomain) {
    if (domainBlocklistRegex !== null) {
      if (domainBlocklistRegex.test(entity.value)) {
        Logger.debug({ domain: entity.value }, 'Blocked BlockListed Domain Lookup');
        return true;
      }
    }
  }

  return false;
}

function _setupRegexBlocklists(options, Logger) {
=======
function _isEntityBlocklisted(entity, options) {
  const blocklist = options.blocklist;

  Log.trace({ blocklist: blocklist }, 'checking to see what blocklist looks like');

  const ipIsInBlocklistRegex =
    ipBlocklistRegex !== null &&
    entity.isIP &&
    !entity.isPrivateIP &&
    ipBlocklistRegex.test(entity.value);

  if (ipIsInBlocklistRegex)
    log.debug({ ip: entity.value }, 'Blocked BlockListed IP Lookup');

  const domainIsInBlocklistRegex =
    domainBlocklistRegex !== null &&
    entity.isDomain &&
    domainBlocklistRegex.test(entity.value);

  if (domainIsInBlocklistRegex)
    log.debug({ domain: entity.value }, 'Blocked BlockListed Domain Lookup');

  return isInBlocklist || ipIsInBlocklistRegex || domainIsInBlocklistRegex;
}

function _setupRegexBlocklists(options, log) {
>>>>>>> Stashed changes
  if (
    options.domainBlocklistRegex !== previousDomainRegexAsString &&
    options.domainBlocklistRegex.length === 0
  ) {
<<<<<<< Updated upstream
    Logger.debug('Removing Domain Blocklist Regex Filtering');
    previousDomainRegexAsString = '';
    domainBlocklistRegex = null;
  } else {
    if (options.domainBlocklistRegex !== previousDomainRegexAsString) {
      previousDomainRegexAsString = options.domainBlocklistRegex;
      Logger.debug(
        { domainBlocklistRegex: previousDomainRegexAsString },
        'Modifying Domain Blocklist Regex'
      );
      domainBlocklistRegex = new RegExp(options.domainBlocklistRegex, 'i');
    }
=======
    log.debug('Removing Domain Blocklist Regex Filtering');
    previousDomainRegexAsString = '';
    domainBlocklistRegex = null;
  } else if (options.domainBlocklistRegex !== previousDomainRegexAsString) {
    previousDomainRegexAsString = options.domainBlocklistRegex;
    log.debug(
      { domainBlocklistRegex: previousDomainRegexAsString },
      'Modifying Domain Blocklist Regex'
    );
    domainBlocklistRegex = new RegExp(options.domainBlocklistRegex, 'i');
>>>>>>> Stashed changes
  }

  if (
    options.ipBlocklistRegex !== previousIpRegexAsString &&
    options.ipBlocklistRegex.length === 0
  ) {
<<<<<<< Updated upstream
    Logger.debug('Removing IP Blocklist Regex Filtering');
    previousIpRegexAsString = '';
    ipBlocklistRegex = null;
  } else {
    if (options.ipBlocklistRegex !== previousIpRegexAsString) {
      previousIpRegexAsString = options.ipBlocklistRegex;
      Logger.debug(
        { ipBlocklistRegex: previousIpRegexAsString },
        'Modifying IP Blocklist Regex'
      );
      ipBlocklistRegex = new RegExp(options.ipBlocklistRegex, 'i');
    }
=======
    log.debug('Removing IP Blocklist Regex Filtering');
    previousIpRegexAsString = '';
    ipBlocklistRegex = null;
  } else if (options.ipBlocklistRegex !== previousIpRegexAsString) {
    previousIpRegexAsString = options.ipBlocklistRegex;
    log.debug(
      { ipBlocklistRegex: previousIpRegexAsString },
      'Modifying IP Blocklist Regex'
    );
    ipBlocklistRegex = new RegExp(options.ipBlocklistRegex, 'i');
>>>>>>> Stashed changes
  }
}

module.exports = {
  getLookupResults
};
