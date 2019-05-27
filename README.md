# tails

## CI status
[![CircleCI](https://circleci.com/gh/rymdkraftverk/tails/tree/master.svg?style=svg)](https://circleci.com/gh/rymdkraftverk/tails/tree/master)

## Index
* [run locally](#run-locally)
* [npm scripts](#npm-scripts)
* [z-index](#z-index)
* [eslint](#eslint)
* [VS Code](#vs-code)
* [update protobuf schemas](#update-protobuf-schemas)
* [debugging](#debugging)

### run locally
1. Copy `.env.example` to  `.env`
1. Change desired envs in `.env`
1. Execute `./run.sh`

### Npm scripts

`lint` - Run linter in root and subfolders

`clean` - Delete `node_modules` in root and subfolders

`install` - Install dependencies in root, backend and signaling

### z-index

When setting z-index, always use the constants defined in `layer.js`, and set the z-index relative to them.

Example:

```js
const myZIndex = Layer.BACKGROUND - 10
```

### eslint

Rules that apply to _all_ projects should be placed in the project root `.eslintrc.yml`

Rules applying to a subset of projects should be individually added to each projects `.eslintrc.yml`

### VS Code

It is strongly recommended to turn on the following settings:

```json
"eslint.autoFixOnSave": true,
"editor.formatOnSave": true,
```

The following extensions are strongly recommended:

- stylelint

With settings:

```js
"stylelint.enable": true,
```

- prettier

- vscode-styled-components

### update protobuf schemas
1. Add/modify .proto file in [controller/src/protobuf](controller/src/protobuf)
1. ` ./update_proto.sh`

### Game lobby heading
Add query params `subheading1` and `subheading2` to game url to display subheadings with dynamic content

### debugging
There are a few functions available to help with debugging from the game view.
They can be accessed from the console on the `debug` object.

The following functions and properties are available:

#### Functions

* `debug.addMockPlayers(count)`
* `debug.addSpiralMockPlayers(count)`
* `debug.roundStart()`
* `debug.roundStartMetrics()`
* `debug.transitionToLobby(gameCode)`
* `debug.transitionToMatchEnd()`
* `debug.transitionToRoundEnd()`
* `debug.printBehaviors()`
* `debug.start()`
* `debug.stop()`

#### Properties

* `debug.state`

`transitionToLobby` is currently a bit problematic due to race conditions in rendering the lobby.
If some other function tries to render the lobby again the game engine will crash.
