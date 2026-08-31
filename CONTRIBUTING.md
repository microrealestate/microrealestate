# Contributing to This Project

Thanks for your interest in contributing! Please follow these simple guidelines.

## 1. Target Branches

All contributions go to **`main`** branch.  

## 2. Sign the Contributor License Agreement (CLA)

The full text is in [CLA.md](./CLA.md). In short: you assign copyright in your contribution to the maintainer, who may re-license the project, including commercially.

Before we can accept your PR, you must sign the Contributor License Agreement (CLA) via **[CLA Assistant](https://cla-assistant.io/)**:

1. Open a PR to `main`.  
2. The CLA Assistant bot will comment with a signing link.  
3. Sign with your GitHub account (OAuth).  
4. PR status will update automatically once signed.

> PRs without a signed CLA **cannot be merged**.

## 3. How to Contribute

1. **Fork** the repository.  
2. **Create a branch** for your feature or bugfix:
```bash
git checkout -b feature/my-feature
```
3. Make your changes, then run `yarn lint` and `npx tsc --noEmit` from each workspace you touched.
4. Commit changes with clear messages:
```bash
git commit -m "Add description of feature"
```
5. Push your branch to your fork and open a pull request against `main`.

## 4. Reporting Issues

- Open issues on GitHub with a clear title and description.
- Include steps to reproduce bugs.
- Issues must concern `main`. Anything reported against `master` will be closed.
- For a security vulnerability, do not open a public issue — follow [SECURITY.md](./SECURITY.md).

## 5. License Notice

- Contributions to `main` are made under the Sustainable Use License (SUL), the source-available license of this project.
- The `master` branch is frozen. No contributions are accepted on it.

Thank you for helping improve this project!
