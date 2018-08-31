# novelty

Env variable `REACT_APP_WS_ADDRESS` has to be set. 
Otherwise app will crash.

Start dev env:
$ REACT_APP_WS_ADDRESS=ws://localhost:3000 docker-compose up

Start prod env:
$ docker-compose -f docker-compose.yml up

### z-index

When setting z-index, always use the constants defined in `layers.js`, and set the z-index relative to them.

Example:

```js
const myZIndex = layers.BACKGROUND - 10
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

### debugging
There are a few functions available to help with debugging from the game view.
They can be accessed from the console on the `window.debug` object.

The following functions are available:

* `window.debug.addMockPlayers(count)`
* `window.debug.roundStart()`
* `window.debug.transitionToLobby(gameCode)`
* `window.debug.transitionToMatchEnd()`
* `window.debug.transitionToRoundEnd()`

`transitionToLobby` is currently a bit problematic due to race conditions in rendering the lobby.
If some other function tries to render the lobby again the game engine will crash.