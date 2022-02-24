const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const actions = require('@actions/exec');

const { run } = require('./run');

// jest.setTimeout(100000); // NOTE: uncomment for test debugging

describe('mode component', () => {
  let octokitMock, owner, repo;

  const params = {
    componentPrefix: 'hello-',
    mode: 'component',
    type: 'final',
    tagBranch: 'main',
    dryRun: false,
    updateVersionsIn: 'false', // the default value MUST be a string
  };

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

    await run(octokitMock, owner, repo, params);

    expect(core.setFailed).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledWith('tag', 'hello-v0.100.0');
  });

  test('should output a version', async () => {
    await run(octokitMock, owner, repo, params);

    expect(core.setFailed).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledWith('version', '0.100.0');
  });

  test('create-fix-tag', async () => {
    // debug with real octokit object
    //const octokitMock = github.getOctokit(process.env.GITHUB_TOKEN);
    //const [owner, repo] = 'intelygenz/monorepo-ci-cd-poc'.split('/');

    params.currentComponentTag = 'hello-v0.98.0';
    params.type = 'fix';

    github.context.ref = 'refs/heads/release/v0.22';

    await run(octokitMock, owner, repo, params);

    expect(core.setFailed).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledWith('tag', 'hello-v0.98.1');
    expect(octokitMock.repos.getBranch).toHaveBeenCalledWith({
      branch: 'release/v0.22',
      owner: 'test-org',
      repo: 'test-repo',
    });
  });

  test('should output a version', async () => {
    await run(octokitMock, owner, repo, params);

    expect(core.setFailed).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledWith('version', '0.98.1');
  });
});

describe('mode product', () => {
  let octokitMock, owner, repo;

  const params = {
    mode: 'product',
    type: 'pre-release',
    dryRun: false,
    releaseBranchPrefix: 'release/v',
    currentMajor: '0',
    tagBranch: 'main',
    preReleaseName: 'rc',
    updateVersionsIn: 'false',
  };

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
    await run(octokitMock, owner, repo, params);

    expect(core.setFailed).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledWith('tag', 'v0.24-rc.0');
  });

  test('create-rc-tag', async () => {
    /*
        // debug with real octokit object
        const octokitMock = github.getOctokit(process.env.GITHUB_TOKEN);
        const [owner, repo] = 'intelygenz/monorepo-ci-cd-poc'.split('/');
    
    */

    await run(octokitMock, owner, repo, params);

    expect(core.setFailed).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledWith('tag', 'v0.24-rc.0');
  });

  test('generate-new-release-branch', async () => {
    /*
        // debug with real octokit object
        const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
        const [owner, repo] = 'intelygenz/monorepo-ci-cd-poc'.split('/');
    */

    params.type = 'new-release-branch';

    await run(octokitMock, owner, repo, params);

    expect(core.setFailed).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(1);
    expect(core.setOutput).toHaveBeenCalledWith('tag', 'release/v0.4');
  });

  test('calculate-fix-tag with github.context.ref', async () => {
    params.type = 'fix';

    github.context.ref = 'refs/heads/release/v0.23';
    github.context.payload = {};

    await run(octokitMock, owner, repo, params);

    expect(core.setFailed).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledWith('tag', 'v0.23.2');

    expect(octokitMock.repos.getBranch).toHaveBeenCalledWith({
      branch: 'release/v0.23',
      owner: 'test-org',
      repo: 'test-repo',
    });
  });

  test('calculate-fix-tag with github.context.payload.workflow_run', async () => {
    params.type = 'fix';

    github.context.ref = '';
    github.context.payload = {
      workflow_run: {
        head_branch: 'release/v0.23',
      },
    };

    await run(octokitMock, owner, repo, params);

    expect(core.setFailed).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledTimes(2);
    expect(core.setOutput).toHaveBeenCalledWith('tag', 'v0.23.2');

    expect(octokitMock.repos.getBranch).toHaveBeenCalledWith({
      branch: 'release/v0.23',
      owner: 'test-org',
      repo: 'test-repo',
    });
  });
});

describe('version file updater', () => {
  let octokitMock, owner, repo;

  const params = {
    componentPrefix: 'hello-',
    mode: 'component',
    type: 'final',
    tagBranch: 'main',
    dryRun: false,
    updateVersionsIn: '[{"file": "test/file.yaml", "property": "app.tag" }]',
    useTagInVersionsFile: true,
  };

  beforeEach(() => {
    [owner, repo] = 'test-org/test-repo'.split('/');

    octokitMock = {
      repos: {
        listTags: jest.fn().mockReturnValue({
          data: [{ name: 'hello-v0.97.0' }],
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

    fs.writeFile = jest.fn();
    actions.exec = jest.fn();
  });

  test('component tag is present in versions file', async () => {
    // GIVEN a version and a component prefix
    const version = 'v0.99.0';
    const expectedVersion = '0.100.0';
    const componentPrefix = 'hello-';
    octokitMock.repos.listTags = jest.fn().mockReturnValue({
      data: [{ name: componentPrefix.concat(version) }],
    });
    // AND we DO WANT the version in file
    params.useTagInVersionsFile = false;

    // WHEN we run the action
    await run(octokitMock, owner, repo, params);

    // THEN version file was written
    expect(fs.writeFile).toHaveBeenCalledTimes(1);

    // AND the component prefix in the version file was NOT stripped
    const updatedContent = fs.writeFile.mock.calls[0][1];
    expect(updatedContent).toContain(expectedVersion);
  });

  test('component version is present in versions file', async () => {
    // GIVEN a version and a component prefix
    const version = 'v0.99.0';
    const expectedTag = 'v0.100.0';
    const componentPrefix = 'hello-';
    octokitMock.repos.listTags = jest.fn().mockReturnValue({
      data: [{ name: componentPrefix.concat(version) }],
    });
    // AND we DO WANT the tag in the file
    params.useTagInVersionsFile = true;

    // WHEN we run the action
    await run(octokitMock, owner, repo, params);

    // THEN version file was written
    expect(fs.writeFile).toHaveBeenCalledTimes(1);

    // AND the component prefix in the version file was NOT stripped
    const updatedContent = fs.writeFile.mock.calls[0][1];
    expect(updatedContent).toContain(expectedTag);
  });
});
