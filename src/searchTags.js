const fp = require('lodash/fp');
const TinyColor = require('@ctrl/tinycolor').TinyColor;

const searchTags = async (
  { term, selectedTags },
  requestWithDefaults,
  options,
  Logger,
  callback
) => {
  try {
    const tagResults = fp.getOr(
      [],
      'body.Tag',
      await requestWithDefaults({
        url: `${options.url}/tags/index/searchall:${fp.toLower(term)}`,
        method: 'GET',
        headers: {
          Authorization: options.apiKey,
          Accept: 'application/json',
          'Content-type': 'application/json'
        }
      })
    );

    const tags = fp.flow(
      fp.filter((tagResult) =>
        fp.every(
          (selectedTag) =>
            _getComparableString(tagResult) !== _getComparableString(selectedTag),
          selectedTags
        )
      ),
      fp.uniqBy(_getComparableString),
      fp.sortBy('attribute_count'),
      fp.slice(0, 50),
      fp.map((tag) => ({
        ...tag,
        font_color: new TinyColor(tag.colour).isDark() ? '#ffffff' : '#000000'
      }))
    )(tagResults);

    callback(null, { tags });
  } catch (error) {
    Logger.error(error, { detail: 'Failed to Get Tags from MISP' }, 'Get Tags Failed');
    return callback({
      err: error,
      detail: 'Failed to Get Tags from MISP'
    });
  }
};

const _getComparableString = fp.flow(fp.getOr('', 'name'), fp.lowerCase, fp.trim);

module.exports = searchTags;