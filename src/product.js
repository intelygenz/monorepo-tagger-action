const github = require('@actions/github');

const { TYPE_PRE_RELEASE, TYPE_FIX, TYPE_FINAL } = require('./types');
const { parseVersion } = require('./strings');

module.exports = function (tags, branches) {
  /**
   * Compute a final tag for the product.
   *
   * The final tag is calculated based on existing pre-release tags.
   * If the last pre-release tag in the repo is v3.5-rc.4 the final tag will be 'v3.5.0'.
   *
   * @returns {String} The created tag name.
   */
  async function computeProductFinalTag() {
    const tag = await tags.getLastPreReleaseTag();
    const { major, minor } = parseVersion(tag);
    return `v${major}.${minor}.0`;
  }

  /**
   * Compute a fix tag for the product.
   *
   * The tag is calculated based on the release version that needs to be fixed.
   * If we are going to create the fix tag in the branch 'release/v2.4', then we check for the greater
   * tags in v2.4.X and creates a fix tag for the next patch version.
   *
   * @param releaseBranchPrefix The prefix for the release branch.
   * @param currentBranchName The release branch where the fix tag should be made.
   * @returns {String} The created tag name.
   */
  async function computeProductFixTag(releaseBranchPrefix, currentBranchName) {
    const releaseVersion = currentBranchName.replace(releaseBranchPrefix, '');
    const tag = await tags.getLatestTagFromReleaseVersion(releaseVersion);
    const { major, minor, patch } = parseVersion(tag);
    return `v${major}.${minor}.${patch + 1}`;
  }

  /**
   * Process a product action.
   *
   * @param releaseBranchPrefix The prefix for the release branch.
   * @param type The type of execution (TYPE_FINAL, TYPE_PRE_RELEASE, TYPE_FIX, TYPE_NEW_RELEASE_BRANCH).
   * @param preReleaseName The name of the pre-release.
   * @param currentMajor The actual major version.
   * @returns {String} The tag name created for the product.
   */
  async function processProduct({ releaseBranchPrefix, type, preReleaseName, currentMajor }) {
    if (type === TYPE_PRE_RELEASE) {
      const preReleaseVersion = await branches.calcPreReleaseVersionBasedOnReleaseBranches(
        currentMajor,
        releaseBranchPrefix
      );
      return tags.calcPrereleaseTag(preReleaseVersion, preReleaseName);
    }

    if (type === TYPE_FIX) {
      let currentBranchName = github.context.ref.replace('refs/heads/', '');
      if (github.context.payload) {
        currentBranchName = github.context.payload.workflow_run.head_branch;
      }
      return computeProductFixTag(releaseBranchPrefix, currentBranchName);
    }

    if (type === TYPE_FINAL) {
      return computeProductFinalTag();
    }
  }

  return {
    processProduct,
  };
};
