'use strict';
const fp = require('lodash/fp');

const validateOptions = require('./src/validateOptions');
const createRequestWithDefaults = require('./src/createRequestWithDefaults');

const { handleError } = require('./src/handleError');
const { getLookupResults } = require('./src/getLookupResults');

let Logger;
let requestWithDefaults;
const startup = (logger) => {
  Logger = logger;
  requestWithDefaults = createRequestWithDefaults(Logger);
};


const doLookup = async (entities, { url, uiUrl, ..._options }, cb) => {
  Logger.debug({ entities }, 'Entities');
  const options = {
    ..._options,
    url: url.endsWith('/') ? url.slice(0, -1) : url
  };

  let lookupResults;
  try {
    lookupResults = await getLookupResults(
      entities,
      options,
      requestWithDefaults,
      Logger
    );
  } catch (error) {
    Logger.error(error, 'Get Lookup Results Failed');
    return cb(handleError(error));
  }

  Logger.trace({ lookupResults }, 'Lookup Results');
  cb(null, lookupResults);
};




const onMessage = async ({ data: { action, ...actionParams} }, options, callback) => {
  if (action === 'deleteItem') {
    deleteItem(actionParams, options, Logger, callback);
  } else if (action === 'submitItems') {
    submitItems(actionParams, options, Logger, callback);
  } else if (action === 'getId') {
    submitItems(actionParams, options, Logger, callback);
  } else if (action === 'searchTags') {
    searchTags(actionParams, options, Logger, callback);
  } else {
    callback(null, {});
  }
};


const deleteItem = async (
  { entity, newIocs, intelObjects },
  options,
  Logger,
  callback
) => {

  let _intelId;
  if (!entity.id) {
    const result = await requestWithDefaults({
      // get object
    });

    _intelId = fp.get('body.objects.0.id', result);
    if (!_intelId)
      return callback(null, {
        newList: fp.filter(({ value }) => value !== entity.value, intelObjects),
        newIocs: [entity, ...newIocs]
      });
  }
  _intelId = _intelId || entity.id;

  try {
    await requestWithDefaults({
      //do delete
    });
  } catch (error) {
    Logger.error({ error }, 'Intel Deletion Error');
  }

  return callback(null, {
    newList: fp.filter(({ value }) => value !== entity.value, intelObjects),
    newIocs: [entity, ...newIocs]
  });
};

const submitItems = async (
  {
    newIocsToSubmit,
    previousEntitiesInTS,
    submitTags,
    isAnonymous,
    TLP,
    submitPublic,
    submitSeverity,
    manuallySetConfidence,
    submitConfidence,
    submitThreatType,
    orgTags,
    selectedTagVisibility
  },
  options,
  Logger,
  callback
) => {
  try {
    const creationResults = await Promise.all(
      fp.map(
        (entity) =>
          requestWithDefaults({
            // Create Item
            method: 'POST',
            headers: {
              entity
            },
            formData: {
              datatext: entity.value,
              classification: submitPublic ? 'public' : 'private',
              is_anonymous: JSON.stringify(isAnonymous),
              ...(manuallySetConfidence && { source_confidence_weight: '100' }),
              confidence: submitConfidence,
              tlp: TLP,
              severity: submitSeverity,
              threat_type: submitThreatType,
              tags: JSON.stringify(
                fp.map(
                  (name) => ({
                    name,
                    tlp: selectedTagVisibility.value
                  }),
                  submitTags
                )
              ),
              expiration_ts: 'null',
              default_state: 'active',
              reject_benign: 'false',
              benign_is_public: 'false',
              intelligence_source: 'Polarity'
            }
          }),
        newIocsToSubmit
      )
    );

    const { true: newEntities, false: uncreatedEntities } = fp.flow(
      fp.map((successResult) => ({
        ...fp.get('request.headers.entity', successResult),
        success: fp.get('body.success', successResult)
      })),
      fp.groupBy('success')
    )(creationResults);

    const newTags = fp.filter(
      (submitTag) => fp.includes(submitTag.name, orgTags),
      submitTags
    );

    return callback(null, {
      entitiesThatExistInTS: [...newEntities, ...previousEntitiesInTS],
      uncreatedEntities,
      orgTags: orgTags.concat(newTags)
    });
  } catch (error) {
    Logger.error(
      error,
      { detail: 'Failed to Create IOC in MISP' },
      'IOC Creation Failed'
    );
    return callback({
      err: error,
      detail: 'Failed to Create IOC in MISP'
    });
  }
};

const searchTags = async ({ term }, options, Logger, callback) => {
  try {
    
    const tags = fp.getOr(
      [],
      'body.Tag',
      await requestWithDefaults({
        url: `${options.url}/tags/index/searchall:${term}`,
        method: 'GET',
        headers: {
          Authorization: options.apiKey,
          Accept: 'application/json',
          'Content-type': 'application/json'
        }
      })
    );
    Logger.trace(
      {
        tags,
        tagspure: await requestWithDefaults({
          url: `${options.url}/tags/index/searchall:${term}`,
          method: 'GET',
          headers: {
            Authorization: options.apiKey,
            Accept: 'application/json',
            'Content-type': 'application/json'
          }
        })
      },
      'SDKLFJSDKLFJ'
    );
    callback(null, { tags });
  } catch (error) {
    Logger.error(
      error,
      { detail: 'Failed to Get Tags from MISP' },
      'Get Tags Failed'
    );
    return callback({
      err: error,
      detail: 'Failed to Get Tags from MISP'
    });
  }
};

module.exports = {
  doLookup,
  startup,
  validateOptions,
  onMessage
};
