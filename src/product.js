const core = require('@actions/core');
const github = require('@actions/github');

const { TYPE_PRE_RELEASE, TYPE_NEW_RELEASE_BRANCH, TYPE_FIX, TYPE_FINAL } = require('./types');
const { parseVersion } = require('./strings');

module.exports = function (tags, branches) {

  /**
   * Creates a new release branch.
   *
   * The release branch name is based on existing pre-release tags.
   * If the last pre-release tag in the repo is v3.5-rc.4 the release branch will be '${releaseBranchPrefix}3.5'.
   *
   * @param releaseBranchPrefix The prefix for the release branch.
   * @param dryRun If the execution should be real.
   * @returns {String} The created branch name.
   */
  async function createNewReleaseBranch(releaseBranchPrefix, dryRun) {
    const tag = await tags.getLastPreReleaseTag();
    if (!tag) {
      return core.setFailed('There are any pre-release yet');
    }

    const { major, minor } = parseVersion(tag);

    const releaseBranch = `${releaseBranchPrefix}${major}.${minor}`;
    if (!dryRun) {
      const created = await branches.createBranch(releaseBranch);

      if (!created) {
        return core.setFailed(`The release branch '${releaseBranch}' already exist`);
      }
    }

    console.log(`🚀 New release '${releaseBranch}' created`);
    return releaseBranch;
  }

  /**
   * Creates a final tag for the product.
   *
   * The final tag is calculated based on existing pre-release tags.
   * If the last pre-release tag in the repo is v3.5-rc.4 the final tag will be 'v3.5.0'.
   *
   * @param releaseBranch The branch in which the final tag will be made.
   * @param dryRun If the execution should be real.
   * @returns {String} The created tag name.
   */
  async function createProductFinalTag(releaseBranch, dryRun) {
    if (!releaseBranch) {
      return core.setFailed('You need to specify the release branch to tag');
    }

    const tag = await tags.getLastPreReleaseTag();
    if (!tag) {
      return core.setFailed('There are any pre-release yet');
    }
    console.log(`Create release tag in branch ${releaseBranch}`);

    const { major, minor } = parseVersion(tag);

    const releaseTag = `v${major}.${minor}.0`;
    if (!dryRun) {
      await tags.createTag(releaseTag, releaseBranch);
    }

    console.log(`🚀 New release tag '${releaseTag}' created`);

    return releaseTag;
  }

  /**
   * Creates a pre-release tag for the product.
   *
   * The tag is calculated based on the pre-release version.
   * If we are working with the pre-release version v2.4, then we check for the greater tags
   * in v2.4-rc.X and creates the pre-release tag for the next pre-release.
   *
   * @param releaseBranchPrefix The prefix for the release branch.
   * @param preReleaseVersion The version for the current pre-release.
   * @param preReleaseName The name of the pre-release.
   * @param branch The name of the branch in which to create the tag.
   * @param dryRun If the execution should be real.
   * @returns {String} The created tag name.
   */
  async function createProductPreReleaseTag(releaseBranchPrefix, preReleaseVersion, preReleaseName, branch, dryRun) {
    const preReleaseTag = await tags.calcPrereleaseTag(preReleaseVersion, preReleaseName);

    if (!dryRun) {
      await tags.createTag(preReleaseTag, branch);
    }

    return preReleaseTag;
  }

  /**
   * Create a fix tag for the product.
   *
   * The tag is calculated based on the release version that needs to be fixed.
   * If we are going to create the fix tag in the branch 'release/v2.4', then we check for the greater
   * tags in v2.4.X and creates a fix tag for the next patch version.
   *
   * @param releaseBranchPrefix The prefix for the release branch.
   * @param currentBranchName The release branch where the fix tag should be made.
   * @param dryRun If the execution should be real.
   * @returns {String} The created tag name.
   */
  async function createProductFixTag(releaseBranchPrefix, currentBranchName, dryRun) {
    const releaseVersion = currentBranchName.replace(releaseBranchPrefix, '');
    const tag = await tags.getLatestTagFromReleaseVersion(releaseVersion);
    if (!tag) {
      return core.setFailed('There are any release yet');
    }

    const { major, minor, patch } = parseVersion(tag);

    const fixTag = `v${major}.${minor}.${patch + 1}`;
    if (!dryRun) {
      await tags.createTag(fixTag, currentBranchName);
    }

    console.log(`🚀 New fix '${fixTag}' created`);
    return fixTag;
  }

  /**
   * Process a product action.
   *
   * @param releaseBranchPrefix The prefix for the release branch.
   * @param type The type of execution (TYPE_FINAL, TYPE_PRE_RELEASE, TYPE_FIX, TYPE_NEW_RELEASE_BRANCH).
   * @param preReleaseName The name of the pre-release.
   * @param currentMajor The actual major version.
   * @param branch The branch in which the tag needs to be made.
   * @param dryRun If the execution should be real.
   * @returns {String} The tag name created for the product.
   */
  async function processProduct({ releaseBranchPrefix, type, preReleaseName, currentMajor, branch, dryRun }) {
    if (type === TYPE_PRE_RELEASE) {
      const preReleaseVersion = await branches.calcPreReleaseVersionBasedOnReleaseBranches(
        currentMajor,
        releaseBranchPrefix
      );
      return createProductPreReleaseTag(releaseBranchPrefix, preReleaseVersion, preReleaseName, branch, dryRun);
    }

    if (type === TYPE_NEW_RELEASE_BRANCH) {
      return createNewReleaseBranch(releaseBranchPrefix, dryRun);
    }

    if (type === TYPE_FIX) {
      let currentBranchName = github.context.ref.replace('refs/heads/', '');
      if (github.context.payload) {
        currentBranchName = github.context.payload.workflow_run.head_branch;
      }
      return createProductFixTag(releaseBranchPrefix, currentBranchName, dryRun);
    }

    if (type === TYPE_FINAL) {
      return createProductFinalTag(branch, dryRun);
    }
  }

  return {
    processProduct,
  };
};
