const github = require('@actions/github');
const core = require('@actions/core');
const { parseVersion } = require('./strings');

module.exports = function (octokit, owner, repo) {
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
  async function createNewReleaseBranch(lastPreReleaseTag, releaseBranchPrefix, dryRun) {
    const tag = lastPreReleaseTag;
    if (!tag) {
      return core.setFailed('There are any pre-release yet');
    }

    const { major, minor } = parseVersion(tag);

    const releaseBranch = `${releaseBranchPrefix}${major}.${minor}`;
    if (!dryRun) {
      const created = await createBranch(releaseBranch);

      if (!created) {
        return core.setFailed(`The release branch '${releaseBranch}' already exist`);
      }
    }

    console.log(`🚀 New release '${releaseBranch}' created`);
    return releaseBranch;
  }

  async function getAllBranchesNames() {
    let branchNames = [];
    let data_length = 0;
    let page = 0;
    do {
      const { data } = await octokit.repos.listBranches({
        owner,
        repo,
        per_page: 100,
        page,
      });
      const branchNamesPerPage = data.map((branch) => branch.name);
      data_length = branchNamesPerPage.length;
      branchNames.push(...branchNamesPerPage);
      page++;
    } while (data_length == 100);

    return branchNames.reverse();
  }

  async function createBranch(branchName) {
    console.log('branchName', branchName);

    // TODO: Review return on error
    try {
      console.log(`Creating ref "refs/heads/${branchName}" with sha: ${github.context.sha}`);
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: github.context.sha,
      });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  /**
   * Calculates and return the version of the next pre-release based on existing release branches.
   *
   * Search for branches that matches with {releaseBranchPrefix}{currentMajor}.0 then:
   * - If there aren't any then the next release version is v{currentMajor}.0.
   * - If there are any, sum one to the greatest minor version
   *
   * @param currentMajor Current major version of the release cycle.
   * @param releaseBranchPrefix The release branch refix (eg. release/).
   * @returns {String} The calculated pre-release version.
   */
  async function calcPreReleaseVersionBasedOnReleaseBranches(currentMajor, releaseBranchPrefix) {
    const branches = await getAllBranchesNames();
    let major = currentMajor;
    let minor = 0;

    const regex = new RegExp(`^${releaseBranchPrefix}(\\d+).(\\d+)$`, 'g');

    // search for release branches with a greater major version, to return an error if any is found
    const greaterReleaseBranches = branches.filter((branchName) => {
      return branchName.match(`^${releaseBranchPrefix}${major + 1}.[0-9]+$`);
    });
    if (greaterReleaseBranches.length > 0) {
      throw new Error('Branch with greater major version already exist');
    }

    // search for release branches with current major version
    const releaseBranchesForCurrentManjor = branches.filter((branchName) => {
      return branchName.match(`^${releaseBranchPrefix}${major}.[0-9]+$`);
    });

    // if no branches with the current major version is found, then the next pre-release cycle
    // is v${major}.${minor}
    if (releaseBranchesForCurrentManjor.length === 0) {
      return `${major}.${minor}`;
    }

    // take the greatest minor and sum one
    const releaseBranch = releaseBranchesForCurrentManjor[0];
    const matches = regex.exec(releaseBranch);
    major = parseInt(matches[1]);
    minor = parseInt(matches[2]);

    return `${major}.${minor + 1}`;
  }

  return {
    createBranch,
    createNewReleaseBranch,
    calcPreReleaseVersionBasedOnReleaseBranches,
  };
};
