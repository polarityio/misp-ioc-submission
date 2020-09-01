const fp = require('lodash/fp');

const deleteItem = async (
  { entity, newIocs, intelObjects },
  requestWithDefaults,
  options,
  Logger,
  callback
) => {
  try {
    await requestWithDefaults({
      method: 'POST',
      url: `${options.url}/attributes/delete/${entity.id}`,
      headers: {
        Authorization: options.apiKey,
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    });
  } catch (error) {
    Logger.error(error, 'Attribute Deletion Error');
    return callback({
      err: error,
      detail: 'Failed to Delete Attribute in MISP'
    });
  }

  return callback(null, {
    newList: fp.filter(({ value }) => value !== entity.value, intelObjects),
    newIocs: [entity, ...newIocs]
  });
};

module.exports = deleteItem;