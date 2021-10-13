const github = require('@actions/github');
const { parseVersion } = require('./strings');

const { TYPE_FIX, TYPE_FINAL } = require('./types');

module.exports = function (tags) {

  /**
   * Creates a fix tag for the component.
   *
   * The tag is calculated based on actual compoment version.
   *
   * @param prefix The componet prefix.
   * @param version The component actual version (eg 3.4).
   * @param branch Then brach in which to create the tag.
   * @param dryRun If the execution should be real.
   * @returns {String} The created tag name.
   */
  async function createFixTag(prefix, version, branch, dryRun) {
    const { major, minor, patch } = parseVersion(version);
    const releaseTag = `${prefix}v${major}.${minor}.${patch + 1}`;

    if (!dryRun) {
      await tags.createTag(releaseTag, branch);
    }

    return releaseTag;
  }

  /**
   * Creates a final tag for the component.
   *
   * @param prefix The componet prefix.
   * @param version The component actual version (eg 3.4).
   * @param branch Then brach in which to create the tag.
   * @param dryRun If the execution should be real.
   * @returns {String} The created tag name.
   */
  async function createFinalTag(prefix, version, branch , dryRun) {
    const { major, minor } = parseVersion(version);
    if (major === null || minor === null) {
      throw Error("can't parse version");
    }
    const releaseTag = `${prefix}v${major}.${minor + 1}.0`;

    if (!dryRun) {
      console.log(`Creating tag ${releaseTag} on branch: ${branch}`);

      await tags.createTag(releaseTag, branch);
    }

    return releaseTag;
  }

  /**
   * Process a component action.
   *
   * @param prefix The componet prefix (eg. comp1-).
   * @param type The type of execution (TYPE_FIX, TYPE_FINAL)
   * @param currentTag The component actual version (eg comp-v3.4).
   * @param branch Then brach in which to create the tag.
   * @param dryRun If the execution should be real.
   * @returns {String} The tag name created for the component.
   */
  async function processComponent({ prefix, type, currentTag, branch, dryRun }) {
    if (type === TYPE_FIX) {
      const version = currentTag.replace(`${prefix}`, '');
      const releaseBranch = github.context.payload.ref.replace('refs/heads/', '');
      console.log(
        `Creating fix for version ${version} on branch ${releaseBranch} (ref: ${github.context.payload.ref})`
      );
      return createFixTag(prefix, version, releaseBranch, dryRun);
    }

    if (type === TYPE_FINAL) {
      const lastTag = await tags.getLastTagWithPrefix(prefix);
      const version = lastTag.replace(prefix, '');
      console.log(`Create final tag with prefix ${prefix} for version ${version} on branch ${branch}`);
      return createFinalTag(prefix, version, branch, dryRun);
    }
  }

  return {
    processComponent,
  };
};
