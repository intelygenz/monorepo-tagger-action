const tagsMod = require('./tags.js');

describe('get component last tag', () => {

  const owner = 'test';
  const repo = 'test';
  let octokit;

  beforeEach(() => {
    const listTagMock = jest.fn().mockReturnValue({
      data: [{ name: 'component1-last-tag' }, { name: 'component1-another-tag' }],
    });
    octokit = {
      repos: {
        listTags: listTagMock,
      },
    };
  })

  test('find last', async () => {
    const tags = tagsMod(octokit, owner, repo);
    const res = await tags.getLastTagWithPrefix('component1-');

    expect(res).toBe('component1-last-tag');
  });

  test('wrong component tag', async () => {
    const tags = tagsMod(octokit, owner, repo);
    const res = await tags.getLastTagWithPrefix('unknown-component');

    expect(res).toBeNull();
  });
});
