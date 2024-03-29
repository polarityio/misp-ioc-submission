const fp = require('lodash/fp');

const EVENTS_RETURN_LIMIT = 20;

const searchEvents = async (
  { term, selectedEvent },
  requestWithDefaults,
  options,
  Logger,
  callback
) => {
  try {
    const events = fp.flow(
      fp.getOr([], 'body'),
      fp.filter((event) => selectedEvent.id !== event.id),
      fp.slice(0, EVENTS_RETURN_LIMIT)
    )(
      await requestWithDefaults({
        url: `${options.url}/events/index/searchall:${fp.toLower(
          term
        )}/sort:info/direction:desc/limit:${EVENTS_RETURN_LIMIT}`,
        method: 'GET',
        headers: {
          Authorization: options.apiKey,
          Accept: 'application/json',
          'Content-type': 'application/json'
        }
      })
    );

    callback(null, { events });
  } catch (error) {
    Logger.error(
      error,
      { detail: 'Failed to Get Events from MISP' },
      'Get Events Failed'
    );
    return callback(
      {
      errors: [
        {
          err: error,
          detail: 'MISP Event Search Error - ' + error
        }
      ]
    });
  }
};


module.exports = searchEvents;