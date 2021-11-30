const productMod = require('./product');
const { TYPE_FIX } = require('./types');
const github = require('@actions/github');

describe('product FIX', () => {
  const tags = {
    getLatestTagFromReleaseVersion: jest.fn(),
  };

  const branches = {
    calcPreReleaseVersionBasedOnReleaseBranches: jest.fn(),
  };

  let releaseBranchPrefix = 'release-';
  let type;
  let preReleaseName = 'rc';
  let currentMajor = 0;

  test('creates the tag in the release branch when github.context.ref is present', async () => {
    const products = productMod(tags, branches);

    // GIVEN an execution for a fix product
    type = TYPE_FIX;

    // AND the execution branch in the ref is set
    github.context.ref = 'refs/heads/release/v0.1';
    github.context.payload = '';

    // AND the latest tag returns
    const expectedTag = 'v1.0.0';
    tags.getLatestTagFromReleaseVersion.mockReturnValue(expectedTag);

    // WHEN the product action is processed
    const tag = await products.processProduct({ releaseBranchPrefix, type, preReleaseName, currentMajor });

    // THEN the created tag is expectedTag
    expect(tag).toBe('v1.0.1');
  });

  test('creates the tag in the release branch when github.context.payload from workflow is present', async () => {
    const products = productMod(tags, branches);

    // GIVEN an execution for a fix product
    type = TYPE_FIX;

    // AND the execution branch in the workflow_run payload is set
    github.context.ref = '';
    github.context.payload = {
      workflow_run: {
        head_branch: 'release/v0.1',
      },
    };

    // AND the latest tag returns
    const expectedTag = 'v1.0.0';
    tags.getLatestTagFromReleaseVersion.mockReturnValue(expectedTag);

    // WHEN the product action is processed
    const tag = await products.processProduct({ releaseBranchPrefix, type, preReleaseName, currentMajor });

    // THEN the created tag is expectedTag
    expect(tag).toBe('v1.0.1');
  });
});
