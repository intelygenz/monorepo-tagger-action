const updaterMod = require('./version-file-updater');
const fs = require('fs');
const actions = require('@actions/exec');

describe('update file with version', () => {
  fs.writeFile = jest.fn();
  actions.exec = jest.fn();
  const updater = updaterMod();

  let version = 'v3.4';
  let branch = 'main';
  let commitMessage = 'test commit message';
  let author = 'author';
  let authorEmail = 'author@email.com';

  test('error on no yml file', async () => {
    // GIVEN a file that is not yml
    const files = [{ file: 'metaapp/values.js', property: 'app.tag' }];

    // WHEN the updater is executed
    await updater.updateVersionInFileAndCommit(
      JSON.stringify(files),
      version,
      branch,
      commitMessage,
      author,
      authorEmail
    );

    // THEN no writes and no commits are made
    expect(fs.writeFile).toHaveBeenCalledTimes(0);
    expect(actions.exec).toHaveBeenCalledTimes(0);
  });

  test('two writes for an array of two files', async () => {
    // GIVEN an array with two files to update
    const files = [
      { file: 'test/file.yaml', property: 'app.tag' },
      { file: 'test/file.yaml', property: 'appVersion' },
    ];

    // WHEN the updater is executed
    await updater.updateVersionInFileAndCommit(
      JSON.stringify(files),
      version,
      branch,
      commitMessage,
      author,
      authorEmail
    );

    // THEN two file writes occurs
    expect(fs.writeFile).toHaveBeenCalledTimes(2);
  });

  test('writes a file with updated version', async () => {
    // GIVEN a file to be updated
    const files = [{ file: 'test/file.yaml', property: 'app.tag' }];

    // WHEN the updater is executed
    await updater.updateVersionInFileAndCommit(
      JSON.stringify(files),
      version,
      branch,
      commitMessage,
      author,
      authorEmail
    );

    // THEN one file is written
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    // AND the content that was written has the exepected updated version
    const updatedContent = fs.writeFile.mock.calls[0][1];
    expect(updatedContent).toContain(version);
  });

  test('preserve comments', async () => {
    // GIVEN a file to be updated with comments
    const files = [{ file: 'test/file.yaml', property: 'app.tag' }];

    // WHEN the updater is executed
    await updater.updateVersionInFileAndCommit(
      JSON.stringify(files),
      version,
      branch,
      commitMessage,
      author,
      authorEmail
    );

    // THEN one file is written
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    // AND the content that was written has preserved the comments
    const updatedContent = fs.writeFile.mock.calls[0][1];
    expect(updatedContent).toContain('# comments');
    expect(updatedContent).toContain('# inline comment');
  });

  test('changes are commited', async () => {
    // GIVEN a file to be updated
    const files = [{ file: 'test/file.yaml', property: 'app.tag' }];

    // WHEN the updater is executed
    await updater.updateVersionInFileAndCommit(
      JSON.stringify(files),
      version,
      branch,
      commitMessage,
      author,
      authorEmail
    );

    // THEN file was commited
    expect(actions.exec).toHaveBeenCalledTimes(6);

    // AND the commit is correct
    const checkoutParams = actions.exec.mock.calls[0][1];
    const addParams = actions.exec.mock.calls[1][1];
    const configNameParams = actions.exec.mock.calls[2][1];
    const configEmailParams = actions.exec.mock.calls[3][1];
    const commitParams = actions.exec.mock.calls[4][1];
    const pushParams = actions.exec.mock.calls[5][1];

    expect(checkoutParams[1]).toBe(branch); // checkout branch
    expect(addParams[1]).toBe('-A'); // add -A
    expect(configNameParams[3]).toBe(author); // config --local user.name author
    expect(configEmailParams[3]).toBe(authorEmail); // config --local user.name authorEmail
    expect(commitParams[3]).toBe(commitMessage); // config --local user.name authorEmail
    expect(pushParams[0]).toBe('push'); // push
  });
});
