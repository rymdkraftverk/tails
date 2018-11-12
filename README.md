# novelty

## Index
* [z-index](#z-index)
* [eslint](#eslint)
* [VS Code](#vs-code)
   * [stylelint](#stylelint)
* [update protobuf schemas](#update-protobuf-schemas)
* [debugging](#debugging)

Env variable `REACT_APP_WS_ADDRESS` has to be set. 
Otherwise app will crash.

Start dev env:
$ REACT_APP_WS_ADDRESS=ws://localhost:3000 docker-compose up

Start prod env:
$ docker-compose -f docker-compose.yml up

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
```

The following extensions are strongly recommended:

#### stylelint

With settings:

```js
"stylelint.enable": true,
```

### update protobuf schemas
1. Add/modify .proto file in [controller/src/protobuf](controller/src/protobuf)
1. ` ./update_proto.sh`

### debugging
There are a few functions available to help with debugging from the game view.
They can be accessed from the console on the `debug` object.

The following functions are available:

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

`transitionToLobby` is currently a bit problematic due to race conditions in rendering the lobby.
If some other function tries to render the lobby again the game engine will crash.
