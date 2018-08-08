# Signaling

This package allows you to create applications and games where you can have communication between browsers with minimal lag.

It uses [WebRTC](https://webrtc.org/) and adds an abstraction on top of it which makes it easier to work with.

It can be used for games where one browser is the game screen while a mobile phone browser is the controller.

### Index

  - Getting started
  - API
  - Events

### Getting started

Usage of the `signaling` module is split into three parts:

  - Initiator

  - Receiver

  - Broker

### API

```js
import signaling from 'signaling'
```

---

```js
signaling.runReceiver(options)
```

TODO: Add description here

**Arguments**

`options` (object):

Option | Type | Required | Default | Description
  -- | -- | -- | -- | --
**wsAddress** | String | ✓ | - | TODO
**receiverId** | String | ✓ | - | TODO
**onInitiatorJoin** | Function | ✓ | - | Function that is run whenever an initiator joins
**onInitiatorLeave** | Function | ✓ | - | Function that is run whenever an initiator leaves

**onInitiatorJoin arguments**

The onInitiatorJoin function is always called with an object with these properties:

Property | Type | Description
  -- | -- | --
**id** | String | 
setOnData
send
close

**Returns**

Nothing

---

```js
signaling.runInitiator(options)
```

TODO: Add description

**Arguments**

`options` (object):

Option | Type | Required | Default | Description
  -- | -- | -- | -- | --
**wsAddress** | String | ✓ | - | The address of the broker
**receiverId** | String | ✓ | - | The id of the receiver to join

**Returns**

(Promise): The promise is resolved with an object with these keys:

Property | Description
  -- | --
setOnData | TODO
setOnClose | TODO
send | TODO

---

### Events

```js
import { Event } from 'signaling'
```

Event | Description
  -- | --
ANSWER | TODO
INITIATOR_CANDIDATE | TODO
RECEIVER_CANDIDATE | TODO
RECEIVER_UPGRADE | TODO
OFFER | TODO
NOT_FOUND | TODO

**Example**
```js
Event.ANSWER
```
