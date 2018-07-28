# Signaling

### API

```js
import signaling from 'signaling'
```

#### createGame

```js
signaling.runGame(options)
```

TODO: Add description here

**Arguments**

`options` (object):

Option | Type | Required | Default | Description
  -- | -- | -- | -- | --
**wsAddress** | String | [ ] | - | TODO
**receiverId** | String | [ ] | - | TODO
**onInitiatorJoin** | Function | [ ] | - | TODO
**onInitiatorLeave** | Function | [ ] | - | TODO

**Returns**

Nothing

---

```js
signaling.runController(options)
```

TODO: Add description

**Arguments**

`options` (object):

Option | Type | Required | Default | Description
  -- | -- | -- | -- | --
**wsAddress** | String | [ ] | - | TODO
**receiverId** | String | [ ] | - | TODO

**Returns**

(Promise): The promise is resolved with an object with these keys:

Property | Description
  -- | --
setOnData | TODO
setOnClose | TODO
send | TODO

---

### events

```js
import event from 'signaling/event'
```

Event | Description
  -- | --
ANSWER | TODO
INITIATOR_CANDIDATE | TODO
RECEIVER_CANDIDATE | TODO
RECEIVER_UPGRADE | TODO
OFFER | TODO
NOT_FOUND | TODO
