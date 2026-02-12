const VERSION_RE = /^(version\s*=\s*")([^"]+)(")/m;

module.exports.readVersion = function (contents) {
  const match = contents.match(VERSION_RE);
  return match ? match[2] : undefined;
};

module.exports.writeVersion = function (contents, version) {
  return contents.replace(VERSION_RE, `$1${version}$3`);
};
