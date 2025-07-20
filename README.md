# whoof

## Makefile Commands

This project uses a `Makefile` to automate common development tasks. Below is a list of available commands and their descriptions.

### Installation

To install project dependencies:

```bash
bun install
```

### Running the Project

To run the main application:

```bash
bun run index.ts
```

### Development Workflow

#### Upgrading Whop Packages

To upgrade all `@whop/cli` and `@whop/sdk` packages in all workspaces:

```bash
make upgrade-whop
```

#### Versioning

To bump the version of all packages, you can use one of the following commands:

- **Patch:** `make version-patch`
- **Minor:** `make version-minor`
- **Major:** `make version-major`

#### Publishing

To publish a specific package to npm:

```bash
make publish
```

You will be prompted to enter the name of the package you want to publish.

To publish all packages:

```bash
make publish-all
```

#### Changelog

To generate a changelog for all packages based on conventional commit messages:

```bash
make changelog
```

This command uses `conventional-changelog-cli` to generate a single `CHANGELOG.md` file at the root of the project. If the tool is not installed, it will be installed globally via `bun`.

---

This project was created using `bun init` in bun v1.2.18. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
