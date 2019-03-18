# tails

## CI status
[![CircleCI](https://circleci.com/gh/sajmoni/tails/tree/master.svg?style=svg&circle-token=730c3b9ac413e0d54208d17994f02b2cec5d7a72)](https://circleci.com/gh/sajmoni/tails/tree/master)

## Index
* [z-index](#z-index)
* [eslint](#eslint)
* [VS Code](#vs-code)
* [update protobuf schemas](#update-protobuf-schemas)
* [debugging](#debugging)

Env variable `REACT_APP_WS_ADDRESS` has to be set. 
Otherwise app will crash.

Start dev env:
$ REACT_APP_WS_ADDRESS=ws://localhost:3000 docker-compose up

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
