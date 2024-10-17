module.exports = {
  name: 'MISP IOC Submission',
  acronym: 'MISP+',
  description:
    'Malware Information and Sharing Platform (MISP) threat intelligence platform IOC Submission',
  entityTypes: ['domain', 'IPv4', 'IPv6', 'MD5', 'SHA1', 'SHA256', 'email'],
  defaultColor: 'light-pink',
  styles: ['./styles/styles.less'],
  block: {
    component: {
      file: './components/block.js'
    },
    template: {
      file: './templates/block.hbs'
    }
  },
  summary: {
    component: {
      file: './components/summary.js'
    },
    template: {
      file: './templates/summary.hbs'
    }
  },
  onDemandOnly: true,
  request: {
    // Provide the path to your certFile. Leave an empty string to ignore this option.
    // Relative paths are relative to the integration's root directory
    cert: '',
    // Provide the path to your private key. Leave an empty string to ignore this option.
    // Relative paths are relative to the integration's root directory
    key: '',
    // Provide the key passphrase if required.  Leave an empty string to ignore this option.
    // Relative paths are relative to the integration's root directory
    passphrase: '',
    // Provide the Certificate Authority. Leave an empty string to ignore this option.
    // Relative paths are relative to the integration's root directory
    ca: '',
    // An HTTP proxy to be used. Supports proxy Auth with Basic Auth, identical to support for
    // the url parameter (by embedding the auth info in the uri)
    proxy: ''
  },
  logging: {
    level: 'info' //trace, debug, info, warn, error, fatal
  },
  options: [
    {
      key: 'url',
      name: 'MISP URL',
      description:
        'URL of your MISP instance to include the schema (i.e., https://) and port if applicable',
      default: '',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'apiKey',
      name: 'Authentication Key',
      description:
        'You MISP authentication key. If you have access to an authentication key, you can find it under "Event Actions" -> "Automation" in the MISP web interface.',
      default: '',
      type: 'password',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'allowDelete',
      name: 'Allow IOC Deletion',
      description: 'If checked, users will be able to delete attributes from MISP.',
      default: false,
      type: 'boolean',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'blocklist',
      name: 'Ignored Entities',
      description:
        'A Comma Separated List of Domains and IPs you wish the integration to ignore and not look up.',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: false
    },
    {
      key: 'domainBlocklistRegex',
      name: 'Ignored Domain Regex',
      description:
        'Any searched Domains that match this Regex will be ignored and not look up.',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: false
    },
    {
      key: 'ipBlocklistRegex',
      name: 'Ignored IP Regex',
      description:
        'Any searched IP Address that match this Regex will be ignored and not look up.',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: false
    }
  ]
};
