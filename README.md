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
