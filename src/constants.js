const IGNORED_IPS = new Set(['127.0.0.1', '255.255.255.255', '0.0.0.0']);

const ATTIBUTE_TYPES = {
  domain: 'domain',
  ip: 'ip-src',
  email: 'email-src',
  md5: 'x509-fingerprint-md5',
  sha1: 'x509-fingerprint-sha1',
  sha256: 'x509-fingerprint-sha256'
};

const ENTITY_TYPES = {
  domain: 'domain',
  IPv4: 'ip',
  IPv6: 'ip',
  email: 'email',
  MD5: 'md5',
  SHA1: 'sha1',
  SHA256: 'sha256'
};

module.exports = {
  IGNORED_IPS,
  ATTIBUTE_TYPES,
  ENTITY_TYPES
};
