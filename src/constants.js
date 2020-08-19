const IGNORED_IPS = new Set(['127.0.0.1', '255.255.255.255', '0.0.0.0']);

const ATTIBUTE_TYPES = {
  domain: 'domain',
  IPv4: 'ip-src',
  IPv6: 'ip-src',
  MD5: 'x509-fingerprint-md5',
  SHA1: 'x509-fingerprint-sha1',
  SHA256: 'x509-fingerprint-sha256'
};

module.exports = {
  IGNORED_IPS,
  ATTIBUTE_TYPES
};
