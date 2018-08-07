# novelty

Env variable `REACT_APP_WS_ADDRESS` has to be set. 
Otherwise app will crash.

Start dev env:
$ REACT_APP_WS_ADDRESS=ws://localhost:3000 docker-compose up

Start prod env:
$ docker-compose -f docker-compose.yml up

### electron

1. GAME_IP env variable needs to be set.

Start dev env for electron:
$ GAME_IP=192.168.0.1 REACT_APP_WS_ADDRESS=ws://localhost:3000 docker-compose up

2. Go to /game and run `npm run electron`

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
