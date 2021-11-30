const core = require('@actions/core');
const newTagger = require('./tags');
const newBranches = require('./branches');
const newComponents = require('./components');
const newVersionFileUpdater = require('./version-file-updater');
const newProduct = require('./product');
const { MODE_COMPONENT, MODE_PRODUCT, TYPE_FIX, TYPE_NEW_RELEASE_BRANCH } = require('./types');
const github = require('@actions/github');

/**
 * Runs an action based on the mode and the type.
 **/
async function run(
  octokit,
  owner,
  repo,
  {
    componentPrefix,
    releaseBranchPrefix,
    mode,
    type,
    dryRun,
    tagBranch,
    currentComponentTag,
    currentMajor,
    preReleaseName,
    updateVersionsIn,
    stripComponentPrefixFromTag,
    commitMessage,
    commitAuthor,
    commitAuthorEmail,
  }
) {
  const tags = newTagger(octokit, owner, repo);
  const branches = newBranches(octokit, owner, repo);
  const components = newComponents(tags);
  const product = newProduct(tags, branches);
  const versionFileUpdater = newVersionFileUpdater();

  console.log(`Run action with params: mode ${mode} and type ${type}`);

  const options = {
    componentPrefix,
    releaseBranchPrefix,
    mode,
    type,
    dryRun,
    tagBranch,
    currentComponentTag,
    currentMajor,
    preReleaseName,
    updateVersionsIn,
    stripComponentPrefixFromTag,
    commitMessage,
    commitAuthor,
    commitAuthorEmail,
  };

  console.log('Options for the action', options);

  if (type === TYPE_NEW_RELEASE_BRANCH) {
    const lastPreReleaseTag = await tags.getLastPreReleaseTag();
    const branch = await branches.createNewReleaseBranch(lastPreReleaseTag, releaseBranchPrefix, dryRun);
    core.setOutput('tag', branch);
    return branch;
  }

  let tag;
  let branchToTag = tagBranch;

  if (type === TYPE_FIX) {
    branchToTag = github.context.ref.replace('refs/heads/', '');
    if (github.context.payload && github.context.payload.workflow_run) {
      // if executed from a workflow
      branchToTag = github.context.payload.workflow_run.head_branch;
    }
  }

  switch (mode) {
    case MODE_COMPONENT:
      tag = await components.getComponentTag({
        prefix: componentPrefix,
        type,
        currentTag: currentComponentTag,
      });
      break;
    case MODE_PRODUCT:
      tag = await product.processProduct({
        releaseBranchPrefix,
        type,
        preReleaseName,
        currentMajor,
      });
      break;
    default:
      return core.setFailed(`Unknown mode "${mode}"`);
  }

  if (!tag) {
    return core.setFailed('Tag creation failed');
  }

  let effectiveTag = tag;
  if (stripComponentPrefixFromTag) {
    effectiveTag = tag.replace(componentPrefix, '');
  }

  if (!dryRun) {
    // update version filess before the tag is made
    if (updateVersionsIn != false) {
      await versionFileUpdater.updateVersionInFileAndCommit(
        updateVersionsIn,
        effectiveTag,
        branchToTag,
        commitMessage,
        commitAuthor,
        commitAuthorEmail
      );
      console.log(`Version updated in file(s)`);
    }

    await tags.createTag(tag, branchToTag);
    console.log(`🚀 New tag '${tag}' created in ${branchToTag}`);
  }

  core.setOutput('tag', effectiveTag);
}

module.exports = {
  run,
};
