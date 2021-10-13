const core = require('@actions/core');
const github = require('@actions/github');

const { run } = require('./run');

// jest.setTimeout(100000); // NOTE: uncomment for test debugging

describe('mode query', () => {

  let octokitMock, owner, repo;

  beforeEach(() => {

    [owner, repo] = 'test-org/test-repo'.split('/');

    octokitMock = {
      repos: {
        listTags: jest.fn().mockReturnValue({
          data: [
            { name: 'v0.3.0' },
            { name: 'v0.2.0' },
            { name: 'hello-v0.99.0' },
            { name: 'hello-v0.98.0' },
            { name: 'hello-v0.97.0' },
          ],
        }),
        getBranch: jest.fn().mockReturnValue({
          data: {
            name: 'main',
            commit: {
              sha: 'sha1234',
            },
          },
        }),
      },
      git: {
        createTag: jest.fn().mockReturnValue({ data: { sha: 'sha5678' } }),
        createRef: jest.fn().mockReturnValue({ data: { sha: 'ref12345' } }),
      },
    };

    core.setOutput = jest.fn();
    core.setFailed = jest.fn();

  });

  test('release (query component-last-tag)', async () => {
    /*
    // debug with real octokit object
    const octokitMock = github.getOctokit(process.env.GITHUB_TOKEN);
    const [owner, repo] = 'intelygenz/monorepo-ci-cd-poc'.split('/');

    */

    const params = {
      componentPrefix: 'hello-',
      mode: 'query',
      type: 'component-last-version',
    };

    await run(octokitMock, owner, repo, params);

    expect(core.setFailed).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(1);
    expect(core.setOutput).toHaveBeenCalledWith('tag', 'hello-v0.99.0');
  });
});

describe('mode component', () => {

  let octokitMock, owner, repo;

  beforeEach(() => {

    [owner, repo] = 'test-org/test-repo'.split('/');

    octokitMock = {
      repos: {
        listTags: jest.fn().mockReturnValue({
          data: [
            { name: 'v0.3.0' },
            { name: 'v0.2.0' },
            { name: 'hello-v0.99.0' },
            { name: 'hello-v0.98.0' },
            { name: 'hello-v0.97.0' },
          ],
        }),
        getBranch: jest.fn().mockReturnValue({
          data: {
            name: 'main',
            commit: {
              sha: 'sha1234',
            },
          },
        }),
      },
      git: {
        createTag: jest.fn().mockReturnValue({ data: { sha: 'sha5678' } }),
        createRef: jest.fn().mockReturnValue({ data: { sha: 'ref12345' } }),
      },
    };

    core.setOutput = jest.fn();
    core.setFailed = jest.fn();

  });

  test('create-release-tag', async () => {
    /* debug with real octokit object
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
    const [owner, repo] = 'intelygenz/monorepo-ci-cd-poc'.split('/');
    */

    const params = {
      componentPrefix: 'hello-',
      mode: 'component',
      type: 'final',
      defaultBranch: 'main',
      dryRun: false,
    };

    await run(octokitMock, owner, repo, params);

    expect(core.setFailed).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(1);
    expect(core.setOutput).toHaveBeenCalledWith('tag', 'hello-v0.100.0');
  });

  test('create-fix-tag', async () => {
    // debug with real octokit object
    //const octokitMock = github.getOctokit(process.env.GITHUB_TOKEN);
    //const [owner, repo] = 'intelygenz/monorepo-ci-cd-poc'.split('/');

    const params = {
      componentPrefix: 'hello-',
      mode: 'component',
      type: 'fix',
      dryRun: false,
      currentComponentTag: 'hello-v0.98.0',
    };

    github.context.payload = {
      ref: 'refs/heads/release/v0.22',
    };

    await run(octokitMock, owner, repo, params);

    expect(core.setFailed).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(1);
    expect(core.setOutput).toHaveBeenCalledWith('tag', 'hello-v0.98.1');
    expect(octokitMock.repos.getBranch).toHaveBeenCalledWith({
      branch: 'release/v0.22',
      owner: 'test-org',
      repo: 'test-repo',
    });
  });
});

describe('mode product', () => {

  let octokitMock, owner, repo;

  beforeEach(() => {
    [owner, repo] = 'test-org/test-repo'.split('/');
    octokitMock = {
      repos: {
        listBranches: jest.fn().mockReturnValue({
          data: [{ name: 'main' }, { name: 'release/v0.22' }, { name: 'release/v0.23' }],
        }),
        listTags: jest.fn().mockReturnValue({
          data: [
            { name: 'v0.4-rc.1' },
            { name: 'v0.3.0' },
            { name: 'v0.2.0' },
            { name: 'v0.23.1' },
            { name: 'v0.23.0' },
            { name: 'hello-v0.99.0' },
            { name: 'hello-v0.98.0' },
            { name: 'hello-v0.97.0' },
          ],
        }),
        getBranch: jest.fn().mockReturnValue({
          data: {
            name: 'main',
            commit: {
              sha: 'sha1234',
            },
          },
        }),
      },
      git: {
        createTag: jest.fn().mockReturnValue({ data: { sha: 'sha5678' } }),
        createRef: jest.fn().mockReturnValue({ data: { sha: 'ref12345' } }),
      },
    };

    core.setOutput = jest.fn();
    core.setFailed = jest.fn();

  });

  test('calculate-rc-tag', async () => {
    /*
    // debug with real octokit object
    const octokitMock = github.getOctokit(process.env.GITHUB_TOKEN);
    const [owner, repo] = 'intelygenz/monorepo-ci-cd-poc'.split('/');

    */

    const params = {
      mode: 'product',
      type: 'pre-release',
      dryRun: false,
      releaseBranchPrefix: 'release/v',
      currentMajor: '0',
      defaultBranch: 'main',
      preReleaseName: 'rc'
    };

    await run(octokitMock, owner, repo, params);

    expect(core.setFailed).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(1);
    expect(core.setOutput).toHaveBeenCalledWith('tag', 'v0.24-rc.0');
  });

  test('create-rc-tag', async () => {
    /*
    // debug with real octokit object
    const octokitMock = github.getOctokit(process.env.GITHUB_TOKEN);
    const [owner, repo] = 'intelygenz/monorepo-ci-cd-poc'.split('/');

    */

    const params = {
      mode: 'product',
      type: 'pre-release',
      dryRun: false,
      releaseBranchPrefix: 'release/v',
      currentMajor: '0',
      defaultBranch: 'main',
      preReleaseName: 'rc'
    };

    await run(octokitMock, owner, repo, params);

    expect(core.setFailed).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(1);
    expect(core.setOutput).toHaveBeenCalledWith('tag', 'v0.24-rc.0');
  });

  test('generate-prerelease', async () => {
    /*
    // debug with real octokit object
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
    const [owner, repo] = 'intelygenz/monorepo-ci-cd-poc'.split('/');
    */

    const params = {
      componentPrefix: '',
      releaseBranchPrefix: 'release/v',
      mode: 'product',
      type: 'new-release-branch',
      dryRun: false,
      defaultBranch: 'main',
      currentComponentTag: 'component-v0.0.0',
      currentMajor: 0,
      preReleaseName: '',
    };

    await run(octokitMock, owner, repo, params);

    expect(core.setFailed).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(1);
    expect(core.setOutput).toHaveBeenCalledWith('tag', 'release/v0.4');
  });

  test('calculate-fix-tag', async () => {
    const params = {
      mode: 'product',
      type: 'fix',
      releaseBranchPrefix: 'release/v',
      dryRun: true,
    };

    github.context.ref = 'refs/heads/main';
    github.context.payload = {
      workflow_run: {
        head_branch: 'release/v0.23',
      },
    };

    await run(octokitMock, owner, repo, params);

    expect(core.setFailed).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(1);
    expect(core.setOutput).toHaveBeenCalledWith('tag', 'v0.23.2');
  });
});
