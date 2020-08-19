const fp = require('lodash/fp');

const searchTags = async ({ term }, requestWithDefaults, options, Logger, callback) => {
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

    callback(null, { tags });
  } catch (error) {
    Logger.error(error, { detail: 'Failed to Get Tags from MISP' }, 'Get Tags Failed');
    return callback({
      err: error,
      detail: 'Failed to Get Tags from MISP'
    });
  }
};

module.exports = searchTags;