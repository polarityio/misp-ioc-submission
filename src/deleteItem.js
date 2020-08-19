const fp = require('lodash/fp');

const deleteItem = async (
  { entity, newIocs, intelObjects },
  requestWithDefaults,
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

module.exports = deleteItem;