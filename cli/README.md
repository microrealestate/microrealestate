# How to build the mre cli

### Prerequisite

- Node.js installed

Install the `pkg` tool globaly to create executables which can run on linux, mac and windows.

```shell
npm install -g pkg
```

Install the npm package from the cli directory

```shell
cd cli
npm i
```

Go back at the root of the repository and run the `pkg` tool to create the mre executables

```shell
cd ..
pkg cli/package.json --output mre
```

Rename the linux and windows executables

```shell
mv mre-linux mre
mv mre-win.exe mre.exe
```

The mre cli is ready to use!
