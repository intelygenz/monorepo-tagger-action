const componentsMod = require('./components');
const { TYPE_FIX, TYPE_FINAL } = require('./types');
const github = require('@actions/github');

describe('components module', () => {
  const tags = {
    createTag: jest.fn(),
    getLastTagWithPrefix: jest.fn(),
  };

  test('createComponentTag FIX', async () => {
    const components = componentsMod(tags);

    // GIVEN an execution for a fix component with current tag 'test-component-v1.0.0'
    const prefix = 'test-component-';
    const type = TYPE_FIX;
    const currentTag = 'test-component-v1.0.0';
    // AND the execution branch is a release/v0.1
    github.context.payload = {
      ref: 'refs/heads/release/v0.1',
    };
    // AND the tag creation returns the exepected tag
    const expectedTag = 'test-component-v1.0.1'
    tags.createTag.mockReturnValue(expectedTag);

    // WHEN the component action is processed
    const tag = await components.processComponent({ prefix, type, currentTag, branch: null, dryRun: false });

    // THEN the created tag is expectedTag
    expect(tag).toBe(expectedTag);
    expect(tags.createTag).toHaveBeenCalledTimes(1);
    expect(tags.createTag).toHaveBeenCalledWith(expectedTag, 'release/v0.1');
  });

  test('createComponentTag FINAL', async () => {
    const components = componentsMod(tags);

    // GIVEN an execution for a final component tag
    const prefix = 'test-component-';
    const type = TYPE_FINAL;
    const branch = 'main';
    // AND the last tag for the component is test-component-v1.0.0
    tags.getLastTagWithPrefix.mockReturnValue('test-component-v1.0.0');

    // AND the tag creation returns the exepected tag
    const expectedTag = 'test-component-v1.1.0'
    tags.createTag.mockReturnValue(expectedTag);

    // WHEN the component action is processed
    const tag = await components.processComponent({ prefix, type, branch, dryRun: false });

    // THEN the tag is as expected
    expect(tag).toBe(expectedTag);
    expect(tags.getLastTagWithPrefix).toHaveBeenCalledTimes(1);
    expect(tags.getLastTagWithPrefix).toHaveBeenCalledWith(prefix);
    expect(tags.createTag).toHaveBeenCalledTimes(1);
    expect(tags.createTag).toHaveBeenCalledWith(expectedTag, branch);
  });
});
