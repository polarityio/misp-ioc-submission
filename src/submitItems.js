const fp = require('lodash/fp');

const { ATTIBUTE_TYPES } = require('./src/constants');

const submitItems = async (
  {
    newIocsToSubmit,
    previousEntitiesInMISP,
    shouldPublish,
    distribution,
    threatLevel,
    analysis,
    eventInfo,
    submitTags
  },
  requestWithDefaults,
  options,
  Logger,
  callback
) => {
  try {
    const createdAttributes = await createAttributes(
      threatLevel,
      eventInfo,
      shouldPublish,
      analysis,
      distribution,
      newIocsToSubmit,
      options,
      requestWithDefaults
    );

    await createTags(createdAttributes, submitTags, options, requestWithDefaults);

    return callback(null, {
      entitiesThatExistInMISP: [...createdAttributes, ...previousEntitiesInMISP]
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

const createAttributes = async (
  threatLevel,
  eventInfo,
  shouldPublish,
  analysis,
  distribution,
  newIocsToSubmit,
  options,
  requestWithDefaults
) => {
  const eventCreationResults = await requestWithDefaults({
    url: `${options.url}/events`,
    method: 'POST',
    headers: {
      Authorization: options.apiKey,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      Event: {
        threat_level_id: threatLevel,
        info: eventInfo,
        published: shouldPublish,
        analysis,
        distribution,
        Attribute: buildAttributes(newIocsToSubmit)
      }
    })
  });

  const buildAttributes = fp.map(({ type, value }) => ({
    type: ATTIBUTE_TYPES[type] || 'other',
    category: 'Network activity',
    to_ids: false,
    distribution: '5',
    comment: '',
    value
  }));

  const createdAttributes = fp.getOr([], 'body.Event.Attribute', eventCreationResults);

  return createdAttributes;
};

const createTags = (createdAttributes, submitTags, options, requestWithDefaults) =>
  Promise.all(
    fp.flow(
      fp.map(fp.get('uuid')),
      fp.flatMap((uuid) =>
        fp.map(({ name: tag }) =>
          requestWithDefaults({
            url: `${options.url}/tags/attachTagToObject/`,
            method: 'POST',
            headers: {
              Authorization: options.apiKey,
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uuid, tag })
          })
        )(submitTags)
      )
    )(createdAttributes)
  );

module.exports = submitItems;