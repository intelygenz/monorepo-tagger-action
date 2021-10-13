module.exports = function (octokit, owner, repo) {
  /**
   * Returns the last tag with a prefix.
   *
   * @param prefix The prefix to search tags on.
   * @returns {String} The last tag found with the given prefix.
   */
  async function getLastTagWithPrefix(prefix) {
    return getLastTag(`^${prefix}`);
  }

  /**
   * Returns the last pre-release tag.
   *
   * @returns {String} The last pre-release tag found.
   */
  async function getLastPreReleaseTag() {
    return getLastTag(`^v[0-9]+.[0-9]+-`);
  }

  /**
   * Returns the last tag matching a given regex.
   *
   * @param regex The regex.
   * @returns {String} The last tag matching the given regex.
   */
  async function getLastTag(regex) {
    const tagNames = await getAllTagsNames();
    const tagsWithComponent = tagNames.filter((tagName) => {
      return tagName.match(regex);
    });
    if (tagsWithComponent.length !== 0) {
      return tagsWithComponent[0];
    }

    return null;
  }

  /**
   * Returns the last tag created for the given release version.
   *
   * @param releaseVersion The release version (eg. 3.4).
   * @returns {String} The last tag created for the given {releaseVersion}.
   */
  async function getLatestTagFromReleaseVersion(releaseVersion) {
    const tagNames = await getAllTagsNames();
    const tagsWithPrefix = tagNames.filter((tagName) => tagName.match(`^v${releaseVersion}.[0-9]+$`));
    if (tagsWithPrefix.length !== 0) {
      return tagsWithPrefix[0];
    }
    return null;
  }

  /**
   * Returns all tags names in the repo.
   *
   * @returns {List} List with all existing tags names.
   */
  async function getAllTagsNames() {
    let tagNames = [];
    let data_length = 0;
    let page = 0;
    do {
      const { data } = await octokit.repos.listTags({
        owner,
        repo,
        per_page: 100,
        page,
      });
      const tagNamesPerPage = data.map((tag) => tag.name);
      data_length = tagNamesPerPage.length;
      tagNames.push(...tagNamesPerPage);
      page++;
    } while (data_length === 100);

    return tagNames;
  }

  /**
   * Calculates and return the next pre-release tag.
   *
   * The tag is calculated checking for the next pre-release number in the given pre-release version.
   *
   * @param preReleaseVersion The pre-release version to calculate the next tag. (eg. 3.4)
   * @param preReleaseName The name of the pre-release (eg. rc)
   * @returns {String} The calculated tag.
   */
  async function calcPrereleaseTag(preReleaseVersion, preReleaseName) {
    const tagNames = await getAllTagsNames();
    const tagsWithPrefix = tagNames.filter((tagName) => tagName.match(`^v${preReleaseVersion}-${preReleaseName}`));

    if (tagsWithPrefix.length === 0) {
      return `v${preReleaseVersion}-${preReleaseName}.0`;
    }

    const regex = new RegExp(`^v${preReleaseVersion}-${preReleaseName}.(\\d+)$`, 'g');
    const releaseTag = tagsWithPrefix[0];

    const matches = regex.exec(releaseTag);
    const bumpVersion = parseInt(matches[1]);
    return `v${preReleaseVersion}-${preReleaseName}.${bumpVersion + 1}`;
  }

  /**
   * Creates a tag in a given branch.
   *
   * @param tagName The tag name to create.
   * @param branch The branch in which to create the tag.
   */
  async function createTag(tagName, branch) {
    console.log('Creating tag');
    const { data: branchData } = await octokit.repos.getBranch({
      owner,
      repo,
      branch,
    });
    const mainBranchSHA = branchData.commit.sha;
    const { data: tagData } = await octokit.git.createTag({
      owner,
      repo,
      tag: tagName,
      message: `Release ${tagName}`,
      object: mainBranchSHA,
      type: 'commit',
    });
    const { data: createTagData } = await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/tags/${tagName}`,
      sha: tagData.sha,
      object: mainBranchSHA,
      type: 'commit',
    });
    console.log('Tag ref created: ', createTagData.ref);
  }

  return {
    createTag,
    getLastPreReleaseTag,
    getLatestTagFromReleaseVersion,
    getLastTagWithPrefix,
    calcPrereleaseTag,
  };
};
