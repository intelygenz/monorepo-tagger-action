# Monorepo Tagger Action

[![Build Action](https://github.com/intelygenz/monorepo-tagger-action/actions/workflows/release.yml/badge.svg)](https://github.com/intelygenz/monorepo-tagger-action/actions/workflows/release.yml)

Opinionated action to manage releases tag life-cycle in a mono-repo with multiple components

This action helps to manage the release lifecycle and workflow in a monorepo. The action is able to tag individual 
components and the product itself.

The action was created to support a specific git workflow but might be used in other ways.

## Git Workflow

The workflow proposed is based on [Trunk Based Development](https://trunkbaseddevelopment.com/) with 
[release branches](https://trunkbaseddevelopment.com/branch-for-release/)

You can find a repository using this action here: https://github.com/intelygenz/monorepo-ci-cd-poc/

### Working with components

A component is part of a product but its lifecycle is managed independently. You can create component releases (major/minor)
by merging a component change in `main` or you can create a component fix by merging component changes in a `release` branch.

You can work in a component making direct commits to `main` or a `release` branch or by working in feature branches and
merging them back (to `main` or `release` branch)

### Working with the product

The product release lifecycle is tied to the components. Each time a new component version is created an automatic product
version is created. If you are merging a component into `main`, then a product pre-release is generated. When the product
is ready for the next release, then a new `release` branch is created and a new product version generated in that `release` branch.

The `release` branch can be deleted, or it can live for as long as you need to give support to that release. If you delete
the branch you can restore it from the release tag created.

## Action Modes

### Component Release

```yaml
- name: Generate a release tag for Component1
  uses: intelygenz/monorepo-tagger-action@v1.0
  with:
    mode: 'component'
    type: 'final'
    component-prefix: "comp1-"
```

### Component Fix

```yaml
- name: Generate a fix tag for Component1
  uses: intelygenz/monorepo-tagger-action@v1.0
  with:
    mode: 'component'
    type: 'fix'
    component-prefix: 'comp1-'
    current-tag: ${{ steps.component_version.outputs.TAG }}
```

### Product PreRelease  

```yaml
- name: Generate a pre-release product tag
  uses: intelygenz/monorepo-tagger-action@v1.0
  with:
    mode: 'product'
    type: 'pre-release'
    current-major: 0
    release-branch-prefix: 'release/v'
    pre-release-name: 'rc'
```

### Create New Product Release

```yaml
- name: Create a new release branch
  uses: intelygenz/monorepo-tagger-action@v1.0
  with:
    mode: 'product'
    type: 'new-release-branch'
    release-branch-prefix: 'release/v'
```

### Product Final Release

```yaml
- name: Generate a final product tag
  uses: intelygenz/monorepo-tagger-action@v1.0
  with:
    mode: 'product'
    type: 'final'
```

### Product Fix

```yaml
- name: Generate a fix product tag
  uses: intelygenz/monorepo-tagger-action@v1.0
  with:
    mode: 'product'
    type: 'fix'
    release-branch-prefix: "release/v"
```
