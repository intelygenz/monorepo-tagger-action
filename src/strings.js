function parseVersion(tag) {
  const regex = new RegExp(`^v(\\d+).(\\d+)(?:.(\\d+))?`, 'g');
  const matches = regex.exec(tag);

  if (!matches || matches.length <= 0) {
    return {};
  }
  const major = parseInt(matches[1]);
  const minor = parseInt(matches[2]);
  const patch = parseInt(matches[3]) || null;

  return { major, minor, patch };
}

module.exports = {
  parseVersion,
};
