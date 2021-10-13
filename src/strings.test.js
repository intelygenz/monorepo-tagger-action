const strings = require('./strings');

describe('strings helpers', function () {
  test('parseVersion', () => {
    const version = strings.parseVersion('v1.2.3');

    expect(version).toStrictEqual({ major: 1, minor: 2, patch: 3 });
  });

  test('parseVersion', () => {
    const version = strings.parseVersion('v1.2-rc.0');

    expect(version).toStrictEqual({ major: 1, minor: 2, patch: null });
  });

  test('parseVersion incorrect version', () => {
    const version = strings.parseVersion('bad-format');

    expect(version).toEqual({});
  });
});
