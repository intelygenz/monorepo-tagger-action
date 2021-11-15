const fs = require('fs');
const path = require('path');
const core = require('@actions/core');
const actions = require('@actions/exec');
const yaml = require('yaml');

module.exports = function () {
  /**
   * Updates file contents and commit the changes.
   *
   * @param files Array with files and properties to be updated [{file: 'filename.yml', property: 'myProp.path'}]
   * @param version The new version for the property
   * @param branch The branch to make the changes
   * @returns sha The commit SHA that was made with the version update
   */
  async function updateVersionInFileAndCommit(files, version, branch, commitMessage, author, authorEmail) {
    const versionFiles = JSON.parse(files);
    console.log('parsed files are ', versionFiles);

    let filesUpdated = 0;

    versionFiles.forEach((file) => {
      console.log('file ', file);
      // only yml files
      if (!file.file.endsWith('.yml') && !file.file.endsWith('.yaml')) {
        core.warning(`Only yml files are valid to update the version.`);
        return;
      }

      const filePath = path.join(process.cwd(), file.file);
      if (!fs.existsSync(filePath)) {
        core.warning(`YML file ${filePath} does not exists`);
        return;
      }

      const fileContents = fs.readFileSync(filePath, 'utf8');
      const ymlObj = yaml.parseDocument(fileContents);

      // update the object property with the version
      ymlObj.setIn(file.property.split('.'), version);
      console.log(`Updated ${file.property} to new value ${version}`);

      // write to actual file
      writeToFile(ymlObj.toString(), file.file);
      console.log(`Updated contents ${ymlObj.toString()}`);
      filesUpdated++;
    });

    // commit the files
    if (filesUpdated > 0) {
      return await commitChanges(branch, commitMessage, author, authorEmail);
    }
  }

  /**
   * Commit all changes in a given branch with a given author and commit message.
   *
   * @param branch The branch to commit the changes.
   * @param commitMessage The commit message.
   * @param authorName The author name.
   * @param authorEmail The author email.
   */
  async function commitChanges(branch, commitMessage, authorName, authorEmail) {
    await actions.exec('git', ['checkout', branch]);
    await actions.exec('git', ['add', '-A']);
    await actions.exec('git', ['config', '--local', 'user.name', authorName]);
    await actions.exec('git', ['config', '--local', 'user.email', authorEmail]);
    await actions.exec('git', ['commit', '--no-verify', '-m', commitMessage]);
    await actions.exec('git', ['push']);
  }

  function writeToFile(yamlString, filePath) {
    fs.writeFile(filePath, yamlString, (err) => {
      if (err) {
        console.log(err.message);
        throw err;
      }
    });
  }

  return {
    updateVersionInFileAndCommit,
  };
};
