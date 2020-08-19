const fp = require('lodash/fp');

const { ATTIBUTE_TYPES, ENTITY_TYPES } = require('./constants');

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

    await createTags(createdAttributes, submitTags, options, requestWithDefaults, Logger);

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

  const createdAttributes = fp.getOr([], 'body.Event.Attribute', eventCreationResults);

  return fp.map((foundEntity) => ({
    ...foundEntity,
    type: ENTITY_TYPES[foundEntity.type]
  }))(createdAttributes);
};

const buildAttributes = fp.map(({ type, value }) => ({
  type: ATTIBUTE_TYPES[type] || 'other',
  category: 'Network activity',
  to_ids: false,
  distribution: '5',
  comment: '',
  value
}));

const createTags = (createdAttributes, submitTags, options, requestWithDefaults) =>
  Promise.all(
    fp.flow(
      fp.map(fp.get('uuid')),
      fp.flatMap((uuid) =>
        fp.map(({ id, name }) =>
          requestWithDefaults({
            url: `${options.url}/tags/attachTagToObject/`,
            method: 'POST',
            headers: {
              Authorization: options.apiKey,
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uuid, tag: id || fp.trim(name)})
          })
        )(submitTags)
      )
    )(createdAttributes)
  );

module.exports = submitItems;