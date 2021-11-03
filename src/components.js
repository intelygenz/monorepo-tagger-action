const { parseVersion } = require('./strings');

const { TYPE_FIX, TYPE_FINAL } = require('./types');

module.exports = function (tags) {
  /**
   * Computes a fix tag for the component.
   *
   * The tag is calculated based on actual compoment version.
   *
   * @param prefix The component prefix.
   * @param version The component actual version (eg 3.4).
   * @returns {String} The created tag name.
   */
  async function computeFixTag(prefix, version) {
    const { major, minor, patch } = parseVersion(version);
    return `${prefix}v${major}.${minor}.${patch + 1}`;
  }

  /**
   * Computes a final tag for the component.
   *
   * @param prefix The component prefix.
   * @param version The component actual version (eg 3.4).
   * @returns {String} The created tag name.
   */
  async function computeFinalTag(prefix, version) {
    const { major, minor } = parseVersion(version);
    if (major === null || minor === null) {
      throw Error("can't parse version");
    }
    return `${prefix}v${major}.${minor + 1}.0`;
  }

  /**
   * Process a component action.
   *
   * @param prefix The component prefix (eg. comp1-).
   * @param type The type of execution (TYPE_FIX, TYPE_FINAL)
   * @param currentTag The component actual version (eg comp-v3.4).
   * @returns {String} The tag name created for the component.
   */
  async function getComponentTag({ prefix, type, currentTag }) {
    if (type === TYPE_FIX) {
      const version = currentTag.replace(`${prefix}`, '');
      return computeFixTag(prefix, version);
    }

    if (type === TYPE_FINAL) {
      const lastTag = await tags.getLastTagWithPrefix(prefix);
      const version = lastTag.replace(prefix, '');
      return computeFinalTag(prefix, version);
    }
  }

  return {
    getComponentTag,
  };
};
