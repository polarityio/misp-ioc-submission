const fp = require('lodash/fp');
const reduce = require('lodash/fp/reduce').convert({ cap: false });

const validateOptions = (options, callback) => {
  const stringOptionsErrorMessages = {
    url: 'You must provide a valid URL from your MISP Account',
    apiKey: 'You must provide a valid API Key from your MISP Account'
  };

  const stringValidationErrors = _validateStringOptions(
    stringOptionsErrorMessages,
    options
  );

  const urlValidationError = _validateUrlOption(options.url);

  const ipBlocklistRegexError = _validateValidRegex('ipBlocklistRegex', options);
  const domainBlocklistRegexError = _validateValidRegex('domainBlocklistRegex', options);

  callback(
    null,
    stringValidationErrors
      .concat(urlValidationError)
      .concat(ipBlocklistRegexError)
      .concat(domainBlocklistRegexError)
  );
};

const _validateValidRegex = (key, options) => {
  try {
    new RegExp(options[key].value, 'i');
    return [];
  } catch (error) {
    return {
      key,
      message: 'Your Ignore Regex is Not Valid'
    };
  }
}
const _validateStringOptions = (stringOptionsErrorMessages, options, otherErrors = []) =>
  reduce((agg, message, optionName) => {
    const isString = typeof options[optionName].value === 'string';
    const isEmptyString = isString && fp.isEmpty(options[optionName].value);

    return !isString || isEmptyString
      ? agg.concat({
          key: optionName,
          message
        })
      : agg;
  }, otherErrors)(stringOptionsErrorMessages);

const _validateUrlOption = ({ value: url }, otherErrors = []) =>
  url && url.endsWith('//')
    ? otherErrors.concat({
        key: 'url',
        message: 'Your Url must not end with a //'
      })
    : otherErrors;

module.exports = validateOptions;
