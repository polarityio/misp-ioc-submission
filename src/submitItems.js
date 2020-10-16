const fp = require('lodash/fp');

const { ATTIBUTE_TYPES, ENTITY_TYPES } = require('./constants');

const submitItems = async (
  {
    previousEntitiesInMISP,
    submitTags,
    ...attributeCreationProperties
  },
  requestWithDefaults,
  options,
  Logger,
  callback
) => {
  try {
    const createdAttributes = await createAttributes(
      attributeCreationProperties,
      options,
      requestWithDefaults,
      Logger
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
      errors: [
        {
          err: error,
          detail: 'MISP IOC Submission Error - ' + error
        }
      ]
    });
  }
};

const createAttributes = async (
  {
    newIocsToSubmit,
    shouldPublish,
    eventInfo,
    distribution,
    threatLevel,
    analysis,
    attributeCategory,
    attributeType,
    submitNewEvent,
    selectedEvent
  },
  options,
  requestWithDefaults,
  Logger
) => {
  const eventResults = await requestWithDefaults({
    url: `${options.url}/events${submitNewEvent ? '' : `/${selectedEvent.id}`}`,
    method: 'POST',
    headers: {
      Authorization: options.apiKey,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      Event: {
        ...(submitNewEvent && {
          threat_level_id: threatLevel,
          info: eventInfo,
          published: shouldPublish,
          analysis,
          distribution
        }),
        Attribute: buildAttributes(
          distribution,
          attributeCategory,
          attributeType
        )(newIocsToSubmit)
      }
    })
  });
  

  const createdAttributes = fp.flow(
    fp.getOr([], 'body.Event.Attribute'),
    fp.thru((attributes) =>
      submitNewEvent
        ? attributes
        : getOnlyNewlyCreatedAttributes(attributes, newIocsToSubmit)
    )
  )(eventResults);

  return createdAttributes;
};

const getOnlyNewlyCreatedAttributes = (attributes, newIocsToSubmit) =>
  fp.reduce(
    (agg, attribute) => {
      const foundIoc = fp.find(
        (newIoc) => formatComparableString(newIoc) === formatComparableString(attribute),
        newIocsToSubmit
      );
      return foundIoc ? agg.concat({ ...attribute, type: foundIoc.type }) : agg;
    },
    [],
    attributes
  );

const buildAttributes = (distribution, attributeCategory, attributeType) =>
  fp.map(({ type, value }) => ({
    category: attributeCategory || 'Network activity',
    type: attributeType || ATTIBUTE_TYPES[type] || 'other',
    to_ids: false,
    distribution,
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
            body: JSON.stringify({ uuid, tag: id || fp.trim(name) })
          })
        )(submitTags)
      )
    )(createdAttributes)
  );

const formatComparableString = fp.flow(fp.get('value'), fp.toLower, fp.trim);

module.exports = submitItems;
