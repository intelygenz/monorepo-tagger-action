const core = require('@actions/core');
const github = require('@actions/github');

const { run } = require('./run');

// Input variables
const dryRun = core.getInput('dry-run') === 'true';
const componentPrefix = core.getInput('component-prefix');
const releaseBranchPrefix = core.getInput('release-branch-prefix');
const preReleaseName = core.getInput('pre-release-name');
const type = core.getInput('type');
const mode = core.getInput('mode');
const tagBranch = core.getInput('tag-branch');
const currentComponentTag = core.getInput('current-tag');
const currentMajor = core.getInput('current-major');
const updateVersionsIn = core.getInput('update-versions-in');
const commitMessage = core.getInput('commit-message');
const commitAuthor = core.getInput('commit-author');
const commitAuthorEmail = core.getInput('commit-author-email');

// Initialize Octokit
const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

try {
  run(octokit, owner, repo, {
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
    commitMessage,
    commitAuthor,
    commitAuthorEmail,
  });
} catch (e) {
  core.setFailed(`RUN ERROR: \n\t${e}`);
}
