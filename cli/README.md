# How to build the mre cli

### Prerequisite

- Node.js installed

Install the `pkg` tool globaly to create executables which can run on linux, mac and windows.

```shell
npm install -g pkg
```

Install the packages

```shell
yarn workspaces focus  @microrealestate/cli
```

Run the `pkg` tool to create the mre executables

```shell
pkg cli/package.json --compress Brotli --output mre
```

Rename the linux and windows executables

```shell
mv mre-linux mre
mv mre-win.exe mre.exe
```

The mre cli is ready to use!
