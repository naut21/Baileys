<h1 align='center'><img alt="Baileys logo" src="https://raw.githubusercontent.com/WhiskeySockets/Baileys/refs/heads/master/Media/logo.png" height="75"/></h1>

<div align='center'>Baileys is a WebSockets-based TypeScript library for interacting with the WhatsApp Web API.</div>


> [!CAUTION]
> NOTICE OF BREAKING CHANGE.
>
> As of 7.0.0, multiple breaking changes were introduced into the library.
>
> Please check out https://whiskey.so/migrate-latest for more information.

# Important Note
This is a temporary README.md, the new guide is in development and will this file will be replaced with .github/README.md (already a default on GitHub).

New guide link: https://baileys.wiki

# Get Support

If you'd like business to enterprise-level support from Rajeh, the current maintainer of Baileys, you can book a video chat. Book a 1 hour time slot by contacting him on Discord or pre-ordering [here](https://purpshell.dev/book). The earlier you pre-order the better, as his time slots usually fill up very quickly. He offers immense value per hour and will answer all your questions before the time runs out.

If you are a business, we encourage you to contribute back to the high development costs of the project and to feed the maintainers who dump tens of hours a week on this. You can do so by booking meetings or sponsoring below. All support, even in bona fide / contribution hours, is welcome by businesses of all sizes. This is not condoning or endorsing businesses to use the library. See the Disclaimer below.

# Sponsor
If you'd like to financially support this project, you can do so by supporting the current maintainer [here](https://purpshell.dev/sponsor).

# Disclaimer
This project is not affiliated, associated, authorized, endorsed by, or in any way officially connected with WhatsApp or any of its subsidiaries or its affiliates.
The official WhatsApp website can be found at whatsapp.com. "WhatsApp" as well as related names, marks, emblems and images are registered trademarks of their respective owners.

The maintainers of Baileys do not in any way condone the use of this application in practices that violate the Terms of Service of WhatsApp. The maintainers of this application call upon the personal responsibility of its users to use this application in a fair way, as it is intended to be used.
Use at your own discretion. Do not spam people with this. We discourage any stalkerware, bulk or automated messaging usage.

##

- Baileys does not require Selenium or any other browser to be interface with WhatsApp Web, it does so directly using a **WebSocket**.
- Not running Selenium or Chromium saves you like **half a gig** of ram :/
- Baileys supports interacting with the multi-device & web versions of WhatsApp.
- Thank you to [@pokearaujo](https://github.com/pokearaujo/multidevice) for writing his observations on the workings of WhatsApp Multi-Device. Also, thank you to [@Sigalor](https://github.com/sigalor/whatsapp-web-reveng) for writing his observations on the workings of WhatsApp Web and thanks to [@Rhymen](https://github.com/Rhymen/go-whatsapp/) for the __go__ implementation.

> [!IMPORTANT]
> The original repository had to be removed by the original author - we now continue development in this repository here.
This is the only official repository and is maintained by the community.
> **Join the Discord [here](https://discord.gg/WeJM5FP9GG)**

## Example

Do check out & run [example.ts](Example/example.ts) to see an example usage of the library.
The script covers most common use cases.
To run the example script, download or clone the repo and then type the following in a terminal:
1. ``` cd path/to/Baileys ```
2. ``` yarn ```
3. ``` yarn example ```

## Install

Use the stable version:
```
yarn add @whiskeysockets/baileys
```

Use the edge version (no guarantee of stability, but latest fixes + features)
```
yarn add github:WhiskeySockets/Baileys
```

Then import your code using:
```ts
import makeWASocket from '@whiskeysockets/baileys'
```

# Links

- [Discord](https://discord.gg/WeJM5FP9GG)
- [Docs](https://baileys.wiki/docs/intro/)

# Index

- [Connecting Account](#connecting-account)
    - [Connect with QR-CODE](#starting-socket-with-qr-code)
    - [Connect with Pairing Code](#starting-socket-with-pairing-code)
    - [Receive Full History](#receive-full-history)
- [Important Notes About Socket Config](#important-notes-about-socket-config)
    - [Caching Group Metadata (Recommended)](#caching-group-metadata-recommended)
    - [Improve Retry System & Decrypt Poll Votes](#improve-retry-system--decrypt-poll-votes)
    - [Receive Notifications in Whatsapp App](#receive-notifications-in-whatsapp-app)

- [Save Auth Info](#saving--restoring-sessions)
- [Handling Events](#handling-events)
    - [Example to Start](#example-to-start)
    - [Decrypt Poll Votes](#decrypt-poll-votes)
    - [Summary of Events on First Connection](#summary-of-events-on-first-connection)
- [Implementing a Data Store](#implementing-a-data-store)
- [Whatsapp IDs Explain](#whatsapp-ids-explain)
- [Utility Functions](#utility-functions)
- [Sending Messages](#sending-messages)
    - [Non-Media Messages](#non-media-messages)
        - [Text Message](#text-message)
        - [Quote Message](#quote-message-works-with-all-types)
        - [Mention User](#mention-user-works-with-most-types)
        - [Forward Messages](#forward-messages)
        - [Location Message](#location-message)
        - [Contact Message](#contact-message)
        - [Reaction Message](#reaction-message)
        - [Pin Message](#pin-message)
        - [Poll Message](#poll-message)
    - [Sending with Link Preview](#sending-messages-with-link-previews)
    - [Media Messages](#media-messages)
        - [Gif Message](#gif-message)
        - [Video Message](#video-message)
        - [Audio Message](#audio-message)
        - [Image Message](#image-message)
        - [ViewOnce Message](#view-once-message)
- [Message Builders](#message-builders)
    - [Shared Setters](#shared-setters)
    - [Button Builder](#button-builder)
        - [Single-select Lists](#single-select-lists)
        - [Every Button Type](#every-button-type)
        - [Media Headers](#media-headers)
        - [Message Params](#message-params)
        - [Building Without Sending](#building-without-sending)
    - [ButtonV2 Builder](#buttonv2-builder)
    - [Carousel Builder](#carousel-builder)
    - [AIRich Builder](#airich-builder)
        - [Markdown in addText](#markdown-in-addtext)
        - [Code and Tables](#code-and-tables)
        - [Images and Video](#images-and-video)
        - [Cards, Sources and Pills](#cards-sources-and-pills)
        - [Editing One Message as Content Arrives](#editing-one-message-as-content-arrives)
        - [Hand-built Sections and Fallbacks](#hand-built-sections-and-fallbacks)
        - [Managing Items](#managing-items)
        - [Options](#options)
    - [Builder Toolkit](#builder-toolkit)
- [Modify Messages](#modify-messages)
    - [Delete Messages (for everyone)](#deleting-messages-for-everyone)
    - [Edit Messages](#editing-messages)
- [Manipulating Media Messages](#manipulating-media-messages)
    - [Thumbnail in Media Messages](#thumbnail-in-media-messages)
    - [Downloading Media Messages](#downloading-media-messages)
    - [Re-upload Media Message to Whatsapp](#re-upload-media-message-to-whatsapp)
- [Reject Call](#reject-call)
- [Send States in Chat](#send-states-in-chat)
    - [Reading Messages](#reading-messages)
    - [Update Presence](#update-presence)
- [Modifying Chats](#modifying-chats)
    - [Archive a Chat](#archive-a-chat)
    - [Mute/Unmute a Chat](#muteunmute-a-chat)
    - [Mark a Chat Read/Unread](#mark-a-chat-readunread)
    - [Delete a Message for Me](#delete-a-message-for-me)
    - [Delete a Chat](#delete-a-chat)
    - [Star/Unstar a Message](#starunstar-a-message)
    - [Disappearing Messages](#disappearing-messages)
- [User Querys](#user-querys)
    - [Check If ID Exists in Whatsapp](#check-if-id-exists-in-whatsapp)
    - [Query Chat History (groups too)](#query-chat-history-groups-too)
    - [Fetch Status](#fetch-status)
    - [Fetch Profile Picture (groups too)](#fetch-profile-picture-groups-too)
    - [Fetch Bussines Profile (such as description or category)](#fetch-bussines-profile-such-as-description-or-category)
    - [Fetch Someone's Presence (if they're typing or online)](#fetch-someones-presence-if-theyre-typing-or-online)
- [Change Profile](#change-profile)
    - [Change Profile Status](#change-profile-status)
    - [Change Profile Name](#change-profile-name)
    - [Change Display Picture (groups too)](#change-display-picture-groups-too)
    - [Remove display picture (groups too)](#remove-display-picture-groups-too)
- [Groups](#groups)
    - [Create a Group](#create-a-group)
    - [Add/Remove or Demote/Promote](#addremove-or-demotepromote)
    - [Change Subject (name)](#change-subject-name)
    - [Change Description](#change-description)
    - [Change Settings](#change-settings)
    - [Leave a Group](#leave-a-group)
    - [Get Invite Code](#get-invite-code)
    - [Revoke Invite Code](#revoke-invite-code)
    - [Join Using Invitation Code](#join-using-invitation-code)
    - [Get Group Info by Invite Code](#get-group-info-by-invite-code)
    - [Query Metadata (participants, name, description...)](#query-metadata-participants-name-description)
    - [Join using groupInviteMessage](#join-using-groupinvitemessage)
    - [Get Request Join List](#get-request-join-list)
    - [Approve/Reject Request Join](#approvereject-request-join)
    - [Get All Participating Groups Metadata](#get-all-participating-groups-metadata)
    - [Toggle Ephemeral](#toggle-ephemeral)
    - [Change Add Mode](#change-add-mode)
- [Privacy](#privacy)
    - [Block/Unblock User](#blockunblock-user)
    - [Get Privacy Settings](#get-privacy-settings)
    - [Get BlockList](#get-blocklist)
    - [Update LastSeen Privacy](#update-lastseen-privacy)
    - [Update Online Privacy](#update-online-privacy)
    - [Update Profile Picture Privacy](#update-profile-picture-privacy)
    - [Update Status Privacy](#update-status-privacy)
    - [Update Read Receipts Privacy](#update-read-receipts-privacy)
    - [Update Groups Add Privacy](#update-groups-add-privacy)
    - [Update Default Disappearing Mode](#update-default-disappearing-mode)
- [Broadcast Lists & Stories](#broadcast-lists--stories)
    - [Send Broadcast & Stories](#send-broadcast--stories)
    - [Query a Broadcast List's Recipients & Name](#query-a-broadcast-lists-recipients--name)
- [Writing Custom Functionality](#writing-custom-functionality)
    - [Enabling Debug Level in Baileys Logs](#enabling-debug-level-in-baileys-logs)
    - [How Whatsapp Communicate With Us](#how-whatsapp-communicate-with-us)
    - [Register a Callback for Websocket Events](#register-a-callback-for-websocket-events)

## Connecting Account

WhatsApp provides a multi-device API that allows Baileys to be authenticated as a second WhatsApp client by scanning a **QR code** or **Pairing Code** with WhatsApp on your phone.

> [!NOTE]
> **[Here](#example-to-start) is a simple example of event handling**

> [!TIP]
> **You can see all supported socket configs in the [SocketConfig type alias](https://baileys.wiki/docs/api/type-aliases/SocketConfig/) (Recommended)**

### Starting socket with **QR-CODE**

> [!TIP]
> You can customize browser name if you connect with **QR-CODE**, with `Browser` constant, we have some browsers config, **see the [BrowsersMap type alias](https://baileys.wiki/docs/api/type-aliases/BrowsersMap/)**

```ts
import makeWASocket from '@whiskeysockets/baileys'

const sock = makeWASocket({
    // can provide additional config here
    browser: Browsers.ubuntu('My App'),
    printQRInTerminal: true
})
```

If the connection is successful, you will see a QR code printed on your terminal screen, scan it with WhatsApp on your phone and you'll be logged in!

### Starting socket with **Pairing Code**


> [!IMPORTANT]
> Pairing Code isn't Mobile API, it's a method to connect Whatsapp Web without QR-CODE, you can connect only with one device, see [here](https://faq.whatsapp.com/1324084875126592/?cms_platform=web)

The phone number can't have `+` or `()` or `-`, only numbers, you must provide country code

```ts
import makeWASocket from '@whiskeysockets/baileys'

const sock = makeWASocket({
    // can provide additional config here
    printQRInTerminal: false //need to be false
})

if (!sock.authState.creds.registered) {
    const number = 'XXXXXXXXXXX'
    const code = await sock.requestPairingCode(number)
    console.log(code)
}
```

### Receive Full History

1. Set `syncFullHistory` as `true`
2. Baileys, by default, use chrome browser config
    - If you'd like to emulate a desktop connection (and receive more message history), this browser setting to your Socket config:

```ts
const sock = makeWASocket({
    ...otherOpts,
    // can use Windows, Ubuntu here too
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: true
})
```

## Important Notes About Socket Config

### Caching Group Metadata (Recommended)
- If you use baileys for groups, we recommend you to set `cachedGroupMetadata` in socket config, you need to implement a cache like this:

    ```ts
    const groupCache = new NodeCache({stdTTL: 5 * 60, useClones: false})

    const sock = makeWASocket({
        cachedGroupMetadata: async (jid) => groupCache.get(jid)
    })

    sock.ev.on('groups.update', async ([event]) => {
        const metadata = await sock.groupMetadata(event.id)
        groupCache.set(event.id, metadata)
    })

    sock.ev.on('group-participants.update', async (event) => {
        const metadata = await sock.groupMetadata(event.id)
        groupCache.set(event.id, metadata)
    })
    ```

### Improve Retry System & Decrypt Poll Votes
- If you want to improve sending message, retrying when error occurs and decrypt poll votes, you need to have a store and set `getMessage` config in socket like this:
    ```ts
    const sock = makeWASocket({
        getMessage: async (key) => await getMessageFromStore(key)
    })
    ```

### Receive Notifications in Whatsapp App
- If you want to receive notifications in whatsapp app, set `markOnlineOnConnect` to `false`
    ```ts
    const sock = makeWASocket({
        markOnlineOnConnect: false
    })
    ```
## Saving & Restoring Sessions

You obviously don't want to keep scanning the QR code every time you want to connect.

So, you can load the credentials to log back in:
```ts
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'

const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

// will use the given state to connect
// so if valid credentials are available -- it'll connect without QR
const sock = makeWASocket({ auth: state })

// this will be called as soon as the credentials are updated
sock.ev.on('creds.update', saveCreds)
```

> [!IMPORTANT]
> `useMultiFileAuthState` is a utility function to help save the auth state in a single folder, this function serves as a good guide to help write auth & key states for SQL/no-SQL databases, which I would recommend in any production grade system.

> [!NOTE]
> When a message is received/sent, due to signal sessions needing updating, the auth keys (`authState.keys`) will update. Whenever that happens, you must save the updated keys (`authState.keys.set()` is called). Not doing so will prevent your messages from reaching the recipient & cause other unexpected consequences. The `useMultiFileAuthState` function automatically takes care of that, but for any other serious implementation -- you will need to be very careful with the key state management.

## Handling Events

- Baileys uses the EventEmitter syntax for events.
They're all nicely typed up, so you shouldn't have any issues with an Intellisense editor like VS Code.

> [!IMPORTANT]
> **The events are in the [BaileysEventMap type alias](https://baileys.wiki/docs/api/type-aliases/BaileysEventMap/)**, it's important you see all events

You can listen to these events like this:
```ts
const sock = makeWASocket()
sock.ev.on('messages.upsert', ({ messages }) => {
    console.log('got messages', messages)
})
```

### Example to Start

> [!NOTE]
> This example includes basic auth storage too

> [!NOTE]
> For reliable serialization of the authentication state, especially when storing as JSON, always use the BufferJSON utility.

```ts
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'

async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    const sock = makeWASocket({
        // can provide additional config here
        auth: state,
        printQRInTerminal: true
    })
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
            // reconnect if not logged out
            if(shouldReconnect) {
                connectToWhatsApp()
            }
        } else if(connection === 'open') {
            console.log('opened connection')
        }
    })
    sock.ev.on('messages.upsert', event => {
        for (const m of event.messages) {
            console.log(JSON.stringify(m, undefined, 2))

            console.log('replying to', m.key.remoteJid)
            await sock.sendMessage(m.key.remoteJid!, { text: 'Hello Word' })
        }
    })

    // to storage creds (session info) when it updates
    sock.ev.on('creds.update', saveCreds)
}
// run in main file
connectToWhatsApp()
```

> [!IMPORTANT]
> In `messages.upsert` it's recommended to use a loop like `for (const message of event.messages)` to handle all messages in array

### Decrypt Poll Votes

- By default poll votes are encrypted and handled in `messages.update`
- That's a simple example
```ts
sock.ev.on('messages.update', event => {
    for(const { key, update } of event) {
        if(update.pollUpdates) {
            const pollCreation = await getMessage(key)
            if(pollCreation) {
                console.log(
                    'got poll update, aggregation: ',
                    getAggregateVotesInPollMessage({
                        message: pollCreation,
                        pollUpdates: update.pollUpdates,
                    })
                )
            }
        }
    }
})
```

- `getMessage` is a [store](#implementing-a-data-store) implementation (in your end)

### Summary of Events on First Connection

1. When you connect first time, `connection.update` will be fired requesting you to restart sock
2. Then, history messages will be received in `messaging.history-set`

## Implementing a Data Store

- Baileys does not come with a defacto storage for chats, contacts, or messages. However, a simple in-memory implementation has been provided. The store listens for chat updates, new messages, message updates, etc., to always have an up-to-date version of the data.

> [!IMPORTANT]
> I highly recommend building your own data store, as storing someone's entire chat history in memory is a terrible waste of RAM.

It can be used as follows:

```ts
import makeWASocket, { makeInMemoryStore } from '@whiskeysockets/baileys'
// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = makeInMemoryStore({ })
// can be read from a file
store.readFromFile('./baileys_store.json')
// saves the state to a file every 10s
setInterval(() => {
    store.writeToFile('./baileys_store.json')
}, 10_000)

const sock = makeWASocket({ })
// will listen from this socket
// the store can listen from a new socket once the current socket outlives its lifetime
store.bind(sock.ev)

sock.ev.on('chats.upsert', () => {
    // can use 'store.chats' however you want, even after the socket dies out
    // 'chats' => a KeyedDB instance
    console.log('got chats', store.chats.all())
})

sock.ev.on('contacts.upsert', () => {
    console.log('got contacts', Object.values(store.contacts))
})

```

The store also provides some simple functions such as `loadMessages` that utilize the store to speed up data retrieval.

## Whatsapp IDs Explain

- `id` is the WhatsApp ID, called `jid` too, of the person or group you're sending the message to.
    - It must be in the format ```[country code][phone number]@s.whatsapp.net```
	    - Example for people: ```+19999999999@s.whatsapp.net```.
	    - For groups, it must be in the format ``` 123456789-123345@g.us ```.
    - For broadcast lists, it's `[timestamp of creation]@broadcast`.
    - For stories, the ID is `status@broadcast`.

## Utility Functions

- `getContentType`, returns the content type for any message
- `getDevice`, returns the device from message
- `makeCacheableSignalKeyStore`, make auth store more fast
- `downloadContentFromMessage`, download content from any message

## Sending Messages

- Send all types of messages with a single function
    - **In the [AnyMessageContent type alias](https://baileys.wiki/docs/api/type-aliases/AnyMessageContent/) you can see all message contents supported, like text message**
    - **In the [MiscMessageGenerationOptions type alias](https://baileys.wiki/docs/api/type-aliases/MiscMessageGenerationOptions/) you can see all options supported, like quote message**

    ```ts
    const jid: string
    const content: AnyMessageContent
    const options: MiscMessageGenerationOptions

    sock.sendMessage(jid, content, options)
    ```

### Non-Media Messages

#### Text Message
```ts
await sock.sendMessage(jid, { text: 'hello word' })
```

#### Quote Message (works with all types)
```ts
await sock.sendMessage(jid, { text: 'hello word' }, { quoted: message })
```

#### Mention User (works with most types)
- @number is to mention in text, it's optional
```ts
await sock.sendMessage(
    jid,
    {
        text: '@12345678901',
        mentions: ['12345678901@s.whatsapp.net']
    }
)
```

#### Forward Messages
- You need to have message object, can be retrieved from [store](#implementing-a-data-store) or use a [message](https://baileys.wiki/docs/api/type-aliases/WAMessage/) object
```ts
const msg = getMessageFromStore() // implement this on your end
await sock.sendMessage(jid, { forward: msg }) // WA forward the message!
```

#### Location Message
```ts
await sock.sendMessage(
    jid,
    {
        location: {
            degreesLatitude: 24.121231,
            degreesLongitude: 55.1121221
        }
    }
)
```
#### Contact Message
```ts
const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
            + 'VERSION:3.0\n'
            + 'FN:Jeff Singh\n' // full name
            + 'ORG:Ashoka Uni;\n' // the organization of the contact
            + 'TEL;type=CELL;type=VOICE;waid=911234567890:+91 12345 67890\n' // WhatsApp ID + phone number
            + 'END:VCARD'

await sock.sendMessage(
    id,
    {
        contacts: {
            displayName: 'Jeff',
            contacts: [{ vcard }]
        }
    }
)
```

#### Reaction Message
- You need to pass the key of message, you can retrieve from [store](#implementing-a-data-store) or use a [key](https://baileys.wiki/docs/api/type-aliases/WAMessageKey/) object
```ts
await sock.sendMessage(
    jid,
    {
        react: {
            text: '💖', // use an empty string to remove the reaction
            key: message.key
        }
    }
)
```

#### Pin Message
- You need to pass the key of message, you can retrieve from [store](#implementing-a-data-store) or use a [key](https://baileys.wiki/docs/api/type-aliases/WAMessageKey/) object

- Time can be:

| Time  | Seconds        |
|-------|----------------|
| 24h    | 86.400        |
| 7d     | 604.800       |
| 30d    | 2.592.000     |

```ts
await sock.sendMessage(
    jid,
    {
        pin: {
            type: 1, // 0 to remove
            time: 86400
            key: message.key
        }
    }
)
```

#### Poll Message
```ts
await sock.sendMessage(
    jid,
    {
        poll: {
            name: 'My Poll',
            values: ['Option 1', 'Option 2', ...],
            selectableCount: 1,
            toAnnouncementGroup: false // or true
        }
    }
)
```

### Sending Messages with Link Previews

1. By default, wa does not have link generation when sent from the web
2. Baileys has a function to generate the content for these link previews
3. To enable this function's usage, add `link-preview-js` as a dependency to your project with `yarn add link-preview-js`
4. Send a link:
```ts
await sock.sendMessage(
    jid,
    {
        text: 'Hi, this was sent using https://github.com/whiskeysockets/baileys'
    }
)
```

### Media Messages

Sending media (video, stickers, images) is easier & more efficient than ever.

> [!NOTE]
> In media messages, you can pass `{ stream: Stream }` or `{ url: Url }` or `Buffer` directly, you can see more in the [WAMediaUpload type alias](https://baileys.wiki/docs/api/type-aliases/WAMediaUpload/)

- When specifying a media url, Baileys never loads the entire buffer into memory; it even encrypts the media as a readable stream.

> [!TIP]
> It's recommended to use Stream or Url to save memory

#### Gif Message
- Whatsapp doesn't support `.gif` files, that's why we send gifs as common `.mp4` video with `gifPlayback` flag
```ts
await sock.sendMessage(
    jid,
    {
        video: fs.readFileSync('Media/ma_gif.mp4'),
        caption: 'hello word',
        gifPlayback: true
    }
)
```

#### Video Message
```ts
await sock.sendMessage(
    id,
    {
        video: {
            url: './Media/ma_gif.mp4'
        },
        caption: 'hello word',
	    ptv: false // if set to true, will send as a `video note`
    }
)
```

#### Audio Message
- To audio message work in all devices you need to convert with some tool like `ffmpeg` with this flags:
    ```bash
        codec: libopus //ogg file
        ac: 1 //one channel
        avoid_negative_ts
        make_zero
    ```
    - Example:
    ```bash
    ffmpeg -i input.mp4 -avoid_negative_ts make_zero -ac 1 output.ogg
    ```
```ts
await sock.sendMessage(
    jid,
    {
        audio: {
            url: './Media/audio.mp3'
        },
        mimetype: 'audio/mp4'
    }
)
```

#### Image Message
```ts
await sock.sendMessage(
    id,
    {
        image: {
            url: './Media/ma_img.png'
        },
        caption: 'hello word'
    }
)
```

#### View Once Message

- You can send all messages above as `viewOnce`, you only need to pass `viewOnce: true` in content object

```ts
await sock.sendMessage(
    id,
    {
        image: {
            url: './Media/ma_img.png'
        },
        viewOnce: true, //works with video, audio too
        caption: 'hello word'
    }
)
```

## Message Builders

Chainable builders for the interactive message types that `sendMessage` does not cover: native flow buttons, legacy buttons, carousels, and the AI rich response layout. Ported from **MessageBuilderV4.7 by Nixel ([ValdazGT](https://gist.github.com/ValdazGT))**.

| Builder | Renders |
|---|---|
| [`Button`](#button-builder) | Native flow buttons: quick replies, url/copy/call actions, single-select lists, optional media header |
| [`ButtonV2`](#buttonv2-builder) | The older `buttonsMessage`, shown as a location card with plain reply buttons |
| [`Carousel`](#carousel-builder) | A horizontally scrollable strip of `Button` cards |
| [`AIRich`](#airich-builder) | The AI rich response layout: markdown, code, tables, media, cards, suggestion pills |
| [`Toolkit`](#builder-toolkit) | Media and text helpers the builders use, exported for reuse |

```ts
import makeWASocket, { AIRich, Button, ButtonV2, Carousel, Toolkit } from 'baileys'
```

Every builder takes the socket, exposes `build(jid, options)` to get a `WAMessage` without sending it, and `send(jid, options)` to relay it. For `Button`, `ButtonV2` and `Carousel`, `send` also attaches the `native_flow` node WhatsApp needs to render the buttons, which is why these go out through the builder rather than through `sendMessage`.

**Requirements:** `sharp` (already a peer dependency) is used to resize thumbnails. `ffmpeg` on `PATH` is only needed for `addVideo({ autoFill: true })` preview frames; without it the video is still sent, just with no preview.

### Shared Setters

All four builders inherit the same text slots and two escape hatches. `setTitle`, `setSubtitle`, `setBody` and `setFooter` map to a different slot in each one (see each section); `setContextInfo` and `addPayload` behave the same everywhere.

```ts
import { randomBytes } from 'crypto'

new Button(sock)
    .setContextInfo({
        mentionedJid: ['15551234567@s.whatsapp.net'],
        forwardingScore: 128,
        isForwarded: true,
        externalAdReply: {
            title: 'Preview title',
            body: 'Preview body',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            sourceUrl: 'https://example.com',
            renderLargerThumbnail: true,
            showAdAttribution: false
        }
    })
    .addPayload({ messageContextInfo: { messageSecret: randomBytes(32) } })
```

`setContextInfo` replaces the whole `contextInfo` of the message being built. `addPayload` merges extra top-level fields into the `proto.IMessage`, next to the `interactiveMessage` or `buttonsMessage` the builder produces.

### Button Builder

```ts
await new Button(sock)
    .setTitle('Order #1042')
    .setSubtitle('Arriving today')
    .setBody('Everything looking good?')
    .setFooter('Support · 24/7')
    .setImage('https://example.com/order.jpg')
    .addReply('Confirm', 'order_confirm')
    .addUrl('Track', 'https://example.com/track/1042')
    .addCopy('Copy code', 'ORDER1042')
    .addCall('Call us', '+15551234567')
    .send(jid)
```

In `Button` the four text slots are the header title, the header subtitle, the message body and the footer.

#### Reading the tap

The reply id (`order_confirm`) comes back in `messages.upsert`:

```ts
sock.ev.on('messages.upsert', ({ messages }) => {
    for (const message of messages) {
        const response = message.message?.interactiveResponseMessage?.nativeFlowResponseMessage

        if (response) {
            const { id } = JSON.parse(response.paramsJson!)

            console.log('tapped', response.name, id)
        }
    }
})
```

List rows arrive the same way, with the row id under `id`. `ButtonV2` replies land in `message.buttonsResponseMessage.selectedButtonId` instead.

#### Single-select lists

`addSelection` opens a list, `makeSection` opens a group inside it, `makeRow` adds an entry. Rows go into the section opened last.

```ts
await new Button(sock)
    .setBody('Pick a plan')
    .setFooter('Cancel anytime')
    .addSelection('Plans')
    .makeSection('Monthly', 'popular')
    .makeRow('', 'Basic', '5 GB storage', 'plan_basic')
    .makeRow('', 'Pro', '100 GB storage', 'plan_pro')
    .makeSection('Yearly')
    .makeRow('', 'Pro Annual', '2 months free', 'plan_pro_year')
    .send(jid)
```

#### Every button type

```ts
const button = new Button(sock)
    .setBody('All button types')
    .addReply('Quick reply', 'reply_id')
    .addUrl('Open link', 'https://example.com')
    .addUrl('Open in webview', 'https://example.com', true)
    .addCopy('Copy', 'CODE123')
    .addCall('Call', '+15551234567')
    .addAddress('Send address', 'address_id')
    .addLocation()
    .addReminder('Remind me', 'reminder_id')
    .addCancelReminder('Cancel reminder', 'reminder_id')
    .addButton('cta_url', { display_text: 'Raw button', url: 'https://example.com' })
```

`addButton(name, params)` is the escape hatch: it writes the entry verbatim, so any button type WhatsApp adds later works without a library update.

#### Media headers

```ts
new Button(sock).setImage('https://example.com/banner.jpg')
new Button(sock).setImage(fs.readFileSync('./banner.jpg'))
new Button(sock).setDocument('./invoice.pdf', { fileName: 'invoice.pdf', mimetype: 'application/pdf' })
new Button(sock).setMedia({ video: { url: './clip.mp4' }, gifPlayback: true })
new Button(sock).setMedia({ imageMessage: alreadyUploaded })
```

`setMedia` accepts either media still to upload (`{ image }`, `{ video }`, `{ document }`) or a message that was already uploaded (`{ imageMessage }`), which is how you reuse media across messages without uploading twice.

#### Message params

```ts
await new Button(sock)
    .setBody('Limited offer')
    .addCopy('Copy code', 'SAVE20')
    .setParams({
        limited_time_offer: {
            text: 'Offer ends soon',
            url: 'https://example.com/offer',
            copy_code: 'SAVE20',
            expiration_time: Date.now() + 3600_000
        }
    })
    .send(jid)
```

`Button.paramsList` documents the accepted shapes:

```ts
console.log(Button.paramsList)
```

| Entry | Fields |
|---|---|
| `limited_time_offer` | `text`, `url`, `copy_code`, `expiration_time` |
| `bottom_sheet` | `in_thread_buttons_limit`, `divider_indices`, `list_title`, `button_title` |
| `tap_target_configuration` | `title`, `description`, `canonical_url`, `domain`, `buttonIndex` |

Collapsing extra buttons into a bottom sheet, so only the first two stay in the thread:

```ts
await new Button(sock)
    .setBody('Pick an action')
    .addReply('Accept', 'accept')
    .addReply('Decline', 'decline')
    .addReply('Ask later', 'later')
    .addUrl('Open the docs', 'https://baileys.wiki')
    .setParams({
        bottom_sheet: {
            in_thread_buttons_limit: 2,
            divider_indices: [2],
            list_title: 'More actions',
            button_title: 'See all'
        }
    })
    .send(jid)
```

#### Building without sending

`build` returns the `WAMessage` and touches nothing else, which is what you want for queues, delays, or sending the same message to many chats. It takes the usual generation options (`quoted`, `messageId`, `timestamp`, `ephemeralExpiration`, `userJid`).

```ts
const draft = await new Button(sock)
    .setBody('Reply to this')
    .addReply('Sure', 'sure')
    .build(jid, { quoted: message, ephemeralExpiration: 604800 })
```

Relaying it yourself later needs the same `native_flow` node `send` adds, which is exported as `createNativeFlowNode`:

```ts
import { createNativeFlowNode } from 'baileys'

await sock.relayMessage(jid, draft.message!, {
    messageId: draft.key.id!,
    additionalNodes: [createNativeFlowNode()]
})
```

`send` accepts the same options plus `additionalNodes`, which are appended after the `native_flow` node:

```ts
await new Button(sock)
    .setBody('Tagged send')
    .addReply('Ok', 'ok')
    .send(jid, { quoted: message, additionalNodes: [{ tag: 'bot', attrs: { biz_bot: '1' } }] })
```

#### Reusing a message you already built

`loadFrom` reads an interactive message back into a builder — header, body, footer, buttons, list rows and media — so the next one can be a small change on top instead of a rebuild. The uploaded media is carried over as is, so it is not uploaded twice.

```ts
const sent = await new Button(sock).setImage('./poll.jpg').setBody('Voting open').addReply('Vote', 'vote').send(jid)

await new Button(sock)
    .loadFrom(sent.message)
    .setBody('Voting closed')
    .clearButtons()
    .addReply('See results', 'results')
    .send(jid)
```

### ButtonV2 Builder

The legacy `buttonsMessage`. With no media set it renders as a location card, where `setTitle` is the card name and `setSubtitle` the address line.

```ts
await new ButtonV2(sock)
    .setTitle('Session expired')
    .setSubtitle('Tap to continue')
    .setBody('Your session ended. Log in again?')
    .setFooter('Security')
    .setThumbnail('https://example.com/lock.png')
    .addButton('Log in', 'login_id')
    .addButton('Not now', 'later_id')
    .send(jid)
```

Here `setTitle` and `setSubtitle` are the location card's name and address, `setBody` is the text above the buttons, `setFooter` the line under them.

#### Thumbnails and media headers

```ts
new ButtonV2(sock).setThumbnail('https://example.com/lock.png')
new ButtonV2(sock).setThumbnail(fs.readFileSync('./lock.png'))
new ButtonV2(sock).setRawThumbnail(fs.readFileSync('./already-300x300.jpg'))
new ButtonV2(sock).setRawThumbnail(base64Thumbnail)
new ButtonV2(sock).setMedia({ imageMessage: alreadyUploaded })
new ButtonV2(sock).setMedia({ headerType: 2, text: 'Header text' })
```

`setThumbnail` fetches and resizes to 300x300. `setRawThumbnail` takes bytes or base64 that are already sized, skipping both steps. `setMedia` replaces the location card entirely with whatever header you pass.

#### Raw buttons

`addButton` writes a plain reply button. `addRawButton` writes the entry verbatim, which is how you get native flow actions into a legacy message:

```ts
await new ButtonV2(sock)
    .setTitle('Invoice #77')
    .setBody('Ready to pay?')
    .addButton('Pay later', 'pay_later')
    .addRawButton({
        buttonId: 'pay_now',
        buttonText: { displayText: 'Pay now' },
        type: 2,
        nativeFlowInfo: { name: 'cta_url', paramsJson: JSON.stringify({ display_text: 'Pay now', url: 'https://example.com/pay/77' }) }
    })
    .send(jid)
```

Leaving the id out of `addButton` generates a UUID for it. `send` throws if there are no buttons at all.

#### Reusing a buttons message

```ts
const sent = await new ButtonV2(sock).setTitle('Poll').setBody('Open').addButton('Vote', 'vote').send(jid)

await new ButtonV2(sock).loadFrom(sent.message).setBody('Closed').addButton('Results', 'results').send(jid)
```

### Carousel Builder

Cards are `Button` instances converted with `toCard()`. Each card needs a media header, otherwise `addCard` throws.

```ts
const card = (title: string, image: string, id: string) =>
    new Button(sock)
        .setTitle(title)
        .setBody(`${title} in stock`)
        .setImage(image)
        .addReply('Buy', `buy_${id}`)
        .addUrl('Details', `https://example.com/p/${id}`)
        .toCard()

await new Carousel(sock)
    .setBody('This week')
    .setFooter('Swipe for more')
    .addCard(await Promise.all([card('Headphones', 'https://example.com/1.jpg', '1'), card('Keyboard', 'https://example.com/2.jpg', '2')]))
    .send(jid)
```

Only `setBody`, `setFooter` and `setContextInfo` apply to the carousel itself — the title and subtitle live on each card. `addCard` takes one card or an array, and can be called repeatedly to keep appending.

#### Adding a card to a carousel you already sent

```ts
const sent = await new Carousel(sock).setBody('This week').addCard(await card('Headphones', 'https://example.com/1.jpg', '1')).send(jid)

await new Carousel(sock)
    .loadFrom(sent.message)
    .addCard(await card('Mouse', 'https://example.com/3.jpg', '3'))
    .send(jid)
```

### AIRich Builder

Renders the layout WhatsApp uses for AI answers. Items are added in order, and each one can be named with an `id` so it can be replaced, inserted next to, or deleted later — which is what makes streaming into a single message possible.

```ts
await new AIRich(sock)
    .setTitle('Answered by my bot')
    .addText('Here is what I found on [Baileys](https://baileys.wiki).')
    .addSuggest(['Show me an example', 'How do I install it?'])
    .setFooter('Powered by my bot')
    .send(jid)
```

`setTitle` is the small disclaimer line above the message and `setFooter` is appended as a muted line at the end. The body of the message is the items themselves, so `setBody` and `setSubtitle` do nothing here.

#### Markdown in addText

| Syntax | Renders as |
|---|---|
| `[Baileys](https://baileys.wiki)` | Tappable link labelled `Baileys` |
| `[Baileys](!https://baileys.wiki)` | Same link, marked untrusted (WhatsApp warns before opening) |
| `[](https://baileys.wiki)` | Numbered citation chip |
| `[x^2 + y^2]<https://example.com/latex.png>` | Rendered LaTeX image |
| `[x^2\|120\|60]<https://example.com/latex.png>` | Same, with an explicit width and height |

```ts
rich.addText('See [the docs](https://baileys.wiki) and this study [](https://example.com/paper).')
rich.addText('Careful with [this link](!http://sketchy.example), it is not verified.')
rich.addText('Plain text, no parsing', { hyperlink: false, citation: false, latex: false })
rich.addText('Links only', { citation: false, latex: false })
```

#### The four text styles

```ts
rich.addText('Body copy, the default')
rich.addFOAText('Follow-up answer styling, no markdown parsing')
rich.addMetadata('Small muted line, e.g. "Generated in 1.2s"')
rich.addTip('Muted line prefixed with an info glyph')
```

#### Code and tables

```ts
rich.addCode('javascript', `const sock = makeWASocket({ auth: state })\nsock.ev.on('messages.upsert', handle)`)

rich.addTable([
    ['Feature', 'Supported'],
    ['[Buttons](https://baileys.wiki)', 'Yes'],
    ['Carousel', 'Yes']
])

rich.addTable(rows, { hyperlink: false, citation: false, latex: false })
```

The first row is the header, short rows are padded to the widest one, and cells go through the same markdown extraction as `addText` unless you turn it off. Highlighting covers javascript, typescript, python, java, golang, c, cpp, php, rust, html, css and bash; anything else, including `txt`, renders as plain code.

#### Images and video

```ts
rich.addImage('https://example.com/photo.jpg')
rich.addImage(['https://example.com/1.jpg', 'https://example.com/2.jpg'])
rich.addImage(fs.readFileSync('./photo.jpg'), { width: 1024, height: 1024 })
rich.addImage(base64Photo)
rich.addImage('https://example.com/photo.jpg', { resolveUrl: true })

rich.addVideo('https://example.com/clip.mp4')
rich.addVideo({ url: './clip.mp4', duration: 12, thumbnail: './cover.jpg' })
rich.addVideo([{ url: './a.mp4' }, { url: './b.mp4', mime_type: 'video/mp4', file_length: 204800 }])
rich.addVideo('https://example.com/clip.mp4', { autoFill: false })
```

An array of images becomes one item per image; `resolveUrl` downloads and re-uploads a url instead of linking it as is.

With `autoFill` on (the default) the video is downloaded once to read its length, duration and a preview frame. Pass those fields yourself, or turn `autoFill` off, to skip the download.

Both accept a placeholder state, which is what a "generating…" bubble is:

```ts
rich.addImage('', { status: 'GENERATING', update_text: 'Drawing your image…', id: 'art' })
rich.addVideo('', { status: 'GENERATING', estimatedTime: 30_000, id: 'clip' })
```

#### Cards, sources and pills

```ts
rich.addProduct({
    title: 'Mechanical keyboard',
    brand: 'Example',
    price: '$89.00',
    sale_price: '$69.00',
    product_url: 'https://example.com/p/1',
    image_url: 'https://example.com/1.jpg'
})

rich.addPost({
    username: 'baileys',
    verified: true,
    caption: 'New release is out',
    thumbnail: 'https://example.com/post.jpg',
    url: 'https://example.com/post',
    source_app: 'INSTAGRAM'
})

rich.addReels({
    username: 'baileys',
    verified: true,
    profile: 'https://example.com/avatar.jpg',
    thumbnail: 'https://example.com/reel.jpg',
    url: 'https://example.com/reel.mp4',
    reels_title: 'Setting up a socket',
    like: 1200,
    share: 40,
    view: 98000,
    source: 'IG'
})

rich.addSource([
    { icon: 'https://example.com/favicon.ico', url: 'https://baileys.wiki', title: 'Baileys', subtitle: 'Documentation' }
])

rich.addSource([['https://example.com/favicon.ico', 'https://baileys.wiki', 'Baileys', 'Documentation']])

rich.addWidget({
    title: 'Quick actions',
    actions: [
        { label: 'Join channel', kind: 'OTHER', state: 'PENDING', id: 'join', toast: { label: 'Joined' } },
        { label: 'Remind me', kind: 'OTHER', state: 'PENDING', id: 'remind' }
    ]
})

rich.addFooterAction({ text: 'Open the docs', url: 'https://baileys.wiki' })
rich.addFooterAction([
    { text: 'Docs', url: 'https://baileys.wiki' },
    { text: 'Discord', url: 'https://discord.gg/WeJM5FP9GG' }
])

rich.addSuggest('Just one pill')
rich.addSuggest(['Tell me more', 'Show an example'])
rich.addSuggest(['Yes', 'No'], { scroll: false })
rich.addSuggest(['A', 'B'], { layout: 'ActionRow' })
```

Media fields take a url, a buffer or base64 — anything that is not already a WhatsApp url gets uploaded first.

Passing an array instead of a single object puts the cards in one horizontally scrollable row:

```ts
rich.addProduct([
    { title: 'Keyboard', price: '$69', product_url: 'https://example.com/p/1', image_url: 'https://example.com/1.jpg' },
    { title: 'Mouse', price: '$29', product_url: 'https://example.com/p/2', image_url: 'https://example.com/2.jpg' }
])

rich.addPost([
    { username: 'baileys', thumbnail: 'https://example.com/a.jpg', url: 'https://example.com/a', orientation: 'PORTRAIT' },
    { username: 'baileys', thumbnail: 'https://example.com/b.jpg', url: 'https://example.com/b', post_type: 'IMAGE' }
])

rich.addReels([
    { username: 'baileys', thumbnail: 'https://example.com/1.jpg', url: 'https://example.com/1.mp4' },
    { username: 'baileys', thumbnail: 'https://example.com/2.jpg', url: 'https://example.com/2.mp4' }
])

rich.addWidget([{ title: 'Today' }, { title: 'Tomorrow' }], { layout: 'HScroll' })
```

#### Editing one message as content arrives

Give items an `id`, then use `insertAt` (place after that item), `replace` (swap it, keeping its position and id) and `delete`. `sendEdit()` with no arguments re-sends the whole thing as an edit of the last message this builder sent.

```ts
import { delay } from 'baileys'

const rich = new AIRich(sock).setTitle('My bot').addText('Looking that up…', { id: 'status' })

await rich.send(jid)

rich.addImage('', { status: 'GENERATING', update_text: 'Drawing…', insertAt: 'status', id: 'art' })
await rich.sendEdit()

await delay(3000)

rich.addImage('https://example.com/done.jpg', { replace: 'art' })
rich.addText('Here it is.', { replace: 'status' })
rich.addSuggest(['Another one', 'Make it bigger'])

await rich.sendEdit()
```

`insertAt` also takes an offset, to target a neighbour of a named item: `['art', 2]` points at the item two positions after `art`. A zero or positive offset lands the new item after the one it points at, a negative offset lands it before. Helpers: `hasId(id)`, `getIds()`, `peek(id)`, `assignId(index, id)`.

#### Reusing items from another builder

`items` returns the raw primitives of a builder, which `addSection` can drop into a different message, mixing types inside one scrollable row.

```ts
const cards = new AIRich(sock)
    .addProduct({ title: 'Keyboard', price: '$69', image_url: 'https://example.com/1.jpg' })
    .addPost({ username: 'baileys', thumbnail: 'https://example.com/2.jpg' }).items

rich.addSection(AIRich.newLayout('HScroll', cards), { id: 'mixed' })
```

`loadFrom` goes the other way, rebuilding a builder from a message you sent or received. Loaded items have no ids yet, so name the ones you want to move with `assignId(index, id)`:

```ts
const again = new AIRich(sock).loadFrom(received)

again.assignId(0, 'first')
again.addText('Appended right under the first item', { insertAt: 'first' })

await again.sendEdit(jid, received.key.id)
```

#### Hand-built sections and fallbacks

`AIRich.newLayout(name, data, extra)` wraps any primitive in a layout, which is the escape hatch for primitives the helpers do not cover. `addSection` adds it as an item, `addSubmessage` adds only the plain-text fallback with no visible item of its own.

```ts
rich.addSection(
    AIRich.newLayout('Single', {
        text: 'Straight from a primitive',
        __typename: 'GenAIMarkdownTextUXPrimitive'
    }),
    { id: 'raw' }
)

rich.addSection([
    AIRich.newLayout('Single', { text: 'One', __typename: 'GenAIMetadataTextPrimitive' }),
    AIRich.newLayout('Single', { text: 'Two', __typename: 'GenAIMetadataTextPrimitive' })
])

rich.addSubmessage({ messageType: 2, messageText: 'Only visible where rich layouts are not' })
```

`'Single'` renders one primitive, `'HScroll'` a scrollable row, `'ActionRow'` a wrapped row of pills.

#### Managing items

```ts
rich.getIds()
rich.hasId('art')
rich.peek('art')
rich.sections
rich.items
rich.assignId(0, 'first')
rich.delete('art')
rich.delete(['art', 1])
```

| Member | Gives you |
|---|---|
| `getIds()` | Every id currently in use, in order |
| `hasId(id)` | Whether that id is taken |
| `peek(id)` | `{ id, section, submessage }` for that item, or `null` |
| `sections` | Every section object, in order |
| `items` | Every primitive, flattened out of its layout |
| `assignId(index, id)` | Names an item that has no id yet, by position |
| `delete(target)` | Removes the item and frees its id; takes an id or `[id, offset]` |

Ids are unique per builder: reusing one throws `DuplicateIdError`, and targeting one that does not exist throws `ItemNotFoundError` listing the ids that do.

#### Response ids

Each build carries a response id and a bot response id. With `dynamic: true` (the default) both are rolled on every build, which is what keeps consecutive edits of the same message from being collapsed. Pin them when you want the opposite:

```ts
const rich = new AIRich(sock, { dynamic: false })

rich.setResponseId('reply-42')
rich.setBotResponseId('bot-42')

rich.refreshResponseId()
rich.refreshBotResponseId()
```

#### Building an edit without sending it

```ts
const sent = await rich.send(jid)

rich.addText('One more line')

const edit = await rich.buildEdit(jid, sent.key.id!)

await sock.relayMessage(jid, edit.message!, { messageId: edit.key.id! })
```

`buildEdit` also accepts `msg` to edit in content you built elsewhere, instead of the builder's current items.

#### Statics

The pieces `AIRich` uses internally are exposed, so you can produce the same payloads without a builder instance:

```ts
AIRich.tokenizer('const x = 1', 'javascript')
AIRich.toTableMetadata([['A', 'B'], ['1', '2']])
AIRich.newLayout('HScroll', primitives)
AIRich.generateVerificationMetadata()
```

| Static | Returns |
|---|---|
| `tokenizer(code, lang)` | `{ codeBlock, unified_codeBlock }`, the highlight spans for a code block |
| `toTableMetadata(rows, options)` | `{ title, rows, unified_rows }`, a table in both representations |
| `newLayout(name, data, extra)` | One section wrapping the primitive, or primitives, you pass |
| `generateVerificationMetadata()` | The bot signature proofs stamped on every rich message |

#### Options

```ts
new AIRich(sock, { dynamic: true, unsupportedTypeAlert: true })

await rich.send(jid, {
    forwarded: true,
    notification: true,
    disclaimerText: 'Answers can be wrong',
    bypassDownload: true,
    includesSubmessages: true,
    includesUnifiedResponse: true,
    quoted: message,
    quotedParticipant: '15551234567@s.whatsapp.net',
    messageId: generateMessageIDV2(),
    additionalNodes: []
})
```

| Option | Default | Effect |
|---|---|---|
| `dynamic` | `true` | Rolls the response ids on every build, which is what lets one message keep being edited |
| `unsupportedTypeAlert` | `true` | Emits a plain-text placeholder for items that have no text fallback of their own |
| `forwarded` | `true` | Stamps the message as forwarded from the AI bot, which is what unlocks the rich layout |
| `notification` | `false` | Attaches the AI safety disclaimer banner; `disclaimerText` sets its wording |
| `bypassDownload` | `true` | Re-sends the message as an edit right away, so the layout renders without a download |
| `includesSubmessages` | `true` | Keeps the plain-text fallback blocks |
| `includesUnifiedResponse` | `true` | Keeps the rich layout itself |
| `disclaimerText` | built-in | Wording of that banner, only read when `notification` is on |
| `quotedParticipant` | from `quoted` | Overrides who the quoted message is attributed to |

`build(jid, options)` takes the same options and returns the `WAMessage` without relaying it.

### Builder Toolkit

```ts
await Toolkit.toUrl(sock, './photo.jpg', 'image')
await Toolkit.toUrl(sock, buffer, 'video')

await Toolkit.resolveMedia(sock, input, 'image')
await Toolkit.resolveMedia(sock, input, 'image', { result: 'buffer' })
await Toolkit.resolveMedia(sock, input, 'image', { result: 'base64', resize: true, width: 300, height: 300 })
await Toolkit.resolveMedia(sock, [first, second], 'image', { resolveUrl: true })

await Toolkit.fetchBuffer('https://example.com/a.jpg')
await Toolkit.fetchBuffer('https://example.com/a.jpg', { headers: { referer: 'https://example.com' } }, { silent: false })

await Toolkit.resize(buffer, 300, 300)
await Toolkit.resize(buffer, 300, 300, 'contain')

await Toolkit.getMp4Preview(buffer, { time: 2 })
await Toolkit.getMp4Preview(buffer, { result: 'base64', resize: false })

await Toolkit.waitAllPromises(anyNestedStructure)

Toolkit.getMp4Duration(buffer)
Toolkit.getMp4Duration(buffer, { silent: false })
Toolkit.extractIE('[Baileys](https://baileys.wiki)')
Toolkit.extractIE(text, { hyperlink: true, citation: false, latex: false })
Toolkit.stringifyEscaped({ note: 'año' })
```

| Helper | Returns |
|---|---|
| `toUrl` | Uploads a buffer, path or url and hands back a public WhatsApp url |
| `resolveMedia` | Normalises any input to a url, buffer or base64, resizing on the way if asked |
| `fetchBuffer` | Downloads a url; returns an empty buffer instead of throwing unless `silent: false` |
| `resize` | Resized PNG bytes, via `sharp` |
| `getMp4Duration` | Duration in seconds read from the container, `0` when it cannot be read |
| `getMp4Preview` | One frame as a buffer or base64; needs `ffmpeg`, empty otherwise |
| `extractIE` | The placeholder text plus the inline entity table for a markdown string |
| `waitAllPromises` | The same structure with every nested promise resolved |
| `stringifyEscaped` | JSON with every non-ASCII character escaped, the way the renderer wants its payload |

Errors thrown by the builders are `Boom` for anything a caller can act on, and `AIRichError` subclasses (`ItemNotFoundError`, `DuplicateIdError`, `InvalidTargetError`, `ContentValidationError`) for item bookkeeping, each carrying a `code`.

## Modify Messages

### Deleting Messages (for everyone)

```ts
const msg = await sock.sendMessage(jid, { text: 'hello word' })
await sock.sendMessage(jid, { delete: msg.key })
```

**Note:** deleting for oneself is supported via `chatModify`, see in [this section](#modifying-chats)

### Editing Messages

- You can pass all editable contents here
```ts
await sock.sendMessage(jid, {
      text: 'updated text goes here',
      edit: response.key,
    });
```

## Manipulating Media Messages

### Thumbnail in Media Messages
- For media messages, the thumbnail can be generated automatically for images & stickers provided you add `jimp` or `sharp` as a dependency in your project using `yarn add jimp` or `yarn add sharp`.
- Thumbnails for videos can also be generated automatically, though, you need to have `ffmpeg` installed on your system.

### Downloading Media Messages

If you want to save the media you received
```ts
import { createWriteStream } from 'fs'
import { downloadMediaMessage, getContentType } from '@whiskeysockets/baileys'

sock.ev.on('messages.upsert', async ({ [m] }) => {
    if (!m.message) return // if there is no text or media message
    const messageType = getContentType(m) // get what type of message it is (text, image, video...)

    // if the message is an image
    if (messageType === 'imageMessage') {
        // download the message
        const stream = await downloadMediaMessage(
            m,
            'stream', // can be 'buffer' too
            { },
            {
                logger,
                // pass this so that baileys can request a reupload of media
                // that has been deleted
                reuploadRequest: sock.updateMediaMessage
            }
        )
        // save to file
        const writeStream = createWriteStream('./my-download.jpeg')
        stream.pipe(writeStream)
    }
}
```

### Re-upload Media Message to Whatsapp

- WhatsApp automatically removes old media from their servers. For the device to access said media -- a re-upload is required by another device that has it. This can be accomplished using:
```ts
await sock.updateMediaMessage(msg)
```

## Reject Call

- You can obtain `callId` and `callFrom` from `call` event

```ts
await sock.rejectCall(callId, callFrom)
```

## Send States in Chat

### Reading Messages
- A set of message [keys](https://baileys.wiki/docs/api/type-aliases/WAMessageKey/) must be explicitly marked read now.
- You cannot mark an entire 'chat' read as it were with Baileys Web.
This means you have to keep track of unread messages.

```ts
const key: WAMessageKey
// can pass multiple keys to read multiple messages as well
await sock.readMessages([key])
```

The message ID is the unique identifier of the message that you are marking as read.
On a `WAMessage`, the `messageID` can be accessed using ```messageID = message.key.id```.

### Update Presence

- ``` presence ``` can be one of the values in the [WAPresence type alias](https://baileys.wiki/docs/api/type-aliases/WAPresence/)
- The presence expires after about 10 seconds.
- This lets the person/group with `jid` know whether you're online, offline, typing etc.

```ts
await sock.sendPresenceUpdate('available', jid)
```

> [!NOTE]
> If a desktop client is active, WA doesn't send push notifications to the device. If you would like to receive said notifications -- mark your Baileys client offline using `sock.sendPresenceUpdate('unavailable')`

## Modifying Chats

WA uses an encrypted form of communication to send chat/app updates. This has been implemented mostly and you can send the following updates:

> [!IMPORTANT]
> If you mess up one of your updates, WA can log you out of all your devices and you'll have to log in again.

### Archive a Chat
```ts
const lastMsgInChat = await getLastMessageInChat(jid) // implement this on your end
await sock.chatModify({ archive: true, lastMessages: [lastMsgInChat] }, jid)
```
### Mute/Unmute a Chat

- Supported times:

| Time  | Miliseconds     |
|-------|-----------------|
| Remove | null           |
| 8h     | 86.400.000     |
| 7d     | 604.800.000    |

```ts
// mute for 8 hours
await sock.chatModify({ mute: 8 * 60 * 60 * 1000 }, jid)
// unmute
await sock.chatModify({ mute: null }, jid)
```
### Mark a Chat Read/Unread
```ts
const lastMsgInChat = await getLastMessageInChat(jid) // implement this on your end
// mark it unread
await sock.chatModify({ markRead: false, lastMessages: [lastMsgInChat] }, jid)
```

### Delete a Message for Me
```ts
await sock.chatModify(
    {
        clear: {
            messages: [
                {
                    id: 'ATWYHDNNWU81732J',
                    fromMe: true,
                    timestamp: '1654823909'
                }
            ]
        }
    },
    jid
)

```
### Delete a Chat
```ts
const lastMsgInChat = await getLastMessageInChat(jid) // implement this on your end
await sock.chatModify({
        delete: true,
        lastMessages: [
            {
                key: lastMsgInChat.key,
                messageTimestamp: lastMsgInChat.messageTimestamp
            }
        ]
    },
    jid
)
```
### Pin/Unpin a Chat
```ts
await sock.chatModify({
        pin: true // or `false` to unpin
    },
    jid
)
```
### Star/Unstar a Message
```ts
await sock.chatModify({
        star: {
            messages: [
                {
                    id: 'messageID',
                    fromMe: true // or `false`
                }
            ],
            star: true // - true: Star Message; false: Unstar Message
        }
    },
    jid
)
```

### Disappearing Messages

- Ephemeral can be:

| Time  | Seconds        |
|-------|----------------|
| Remove | 0          |
| 24h    | 86.400     |
| 7d     | 604.800    |
| 90d    | 7.776.000  |

- You need to pass in **Seconds**, default is 7 days

```ts
// turn on disappearing messages
await sock.sendMessage(
    jid,
    // this is 1 week in seconds -- how long you want messages to appear for
    { disappearingMessagesInChat: WA_DEFAULT_EPHEMERAL }
)

// will send as a disappearing message
await sock.sendMessage(jid, { text: 'hello' }, { ephemeralExpiration: WA_DEFAULT_EPHEMERAL })

// turn off disappearing messages
await sock.sendMessage(
    jid,
    { disappearingMessagesInChat: false }
)
```

## User Querys

### Check If ID Exists in Whatsapp
```ts
const [result] = await sock.onWhatsApp(jid)
if (result.exists) console.log (`${jid} exists on WhatsApp, as jid: ${result.jid}`)
```

### Query Chat History (groups too)

- You need to have oldest message in chat
```ts
const msg = await getOldestMessageInChat(jid) // implement this on your end
await sock.fetchMessageHistory(
    50, //quantity (max: 50 per query)
    msg.key,
    msg.messageTimestamp
)
```
- Messages will be received in `messaging.history-set` event

### Fetch Status
```ts
const status = await sock.fetchStatus(jid)
console.log('status: ' + status)
```

### Fetch Profile Picture (groups too)
- To get the display picture of some person/group
```ts
// for low res picture
const ppUrl = await sock.profilePictureUrl(jid)
console.log(ppUrl)

// for high res picture
const ppUrl = await sock.profilePictureUrl(jid, 'image')
```

### Fetch Bussines Profile (such as description or category)
```ts
const profile = await sock.getBusinessProfile(jid)
console.log('business description: ' + profile.description + ', category: ' + profile.category)
```

### Fetch Someone's Presence (if they're typing or online)
```ts
// the presence update is fetched and called here
sock.ev.on('presence.update', console.log)

// request updates for a chat
await sock.presenceSubscribe(jid)
```

## Change Profile

### Change Profile Status
```ts
await sock.updateProfileStatus('Hello World!')
```
### Change Profile Name
```ts
await sock.updateProfileName('My name')
```
### Change Display Picture (groups too)
- To change your display picture or a group's

> [!NOTE]
> Like media messages, you can pass `{ stream: Stream }` or `{ url: Url }` or `Buffer` directly, you can see more in the [WAMediaUpload type alias](https://baileys.wiki/docs/api/type-aliases/WAMediaUpload/)

```ts
await sock.updateProfilePicture(jid, { url: './new-profile-picture.jpeg' })
```
### Remove display picture (groups too)
```ts
await sock.removeProfilePicture(jid)
```

## Groups

- To change group properties you need to be admin

### Create a Group
```ts
// title & participants
const group = await sock.groupCreate('My Fab Group', ['1234@s.whatsapp.net', '4564@s.whatsapp.net'])
console.log('created group with id: ' + group.gid)
await sock.sendMessage(group.id, { text: 'hello there' }) // say hello to everyone on the group
```
### Add/Remove or Demote/Promote
```ts
// id & people to add to the group (will throw error if it fails)
await sock.groupParticipantsUpdate(
    jid,
    ['abcd@s.whatsapp.net', 'efgh@s.whatsapp.net'],
    'add' // replace this parameter with 'remove' or 'demote' or 'promote'
)
```
### Change Subject (name)
```ts
await sock.groupUpdateSubject(jid, 'New Subject!')
```
### Change Description
```ts
await sock.groupUpdateDescription(jid, 'New Description!')
```
### Change Settings
```ts
// only allow admins to send messages
await sock.groupSettingUpdate(jid, 'announcement')
// allow everyone to send messages
await sock.groupSettingUpdate(jid, 'not_announcement')
// allow everyone to modify the group's settings -- like display picture etc.
await sock.groupSettingUpdate(jid, 'unlocked')
// only allow admins to modify the group's settings
await sock.groupSettingUpdate(jid, 'locked')
```
### Leave a Group
```ts
// will throw error if it fails
await sock.groupLeave(jid)
```
### Get Invite Code
- To create link with code use `'https://chat.whatsapp.com/' + code`
```ts
const code = await sock.groupInviteCode(jid)
console.log('group code: ' + code)
```
### Revoke Invite Code
```ts
const code = await sock.groupRevokeInvite(jid)
console.log('New group code: ' + code)
```
### Join Using Invitation Code
- Code can't have `https://chat.whatsapp.com/`, only code
```ts
const response = await sock.groupAcceptInvite(code)
console.log('joined to: ' + response)
```
### Get Group Info by Invite Code
```ts
const response = await sock.groupGetInviteInfo(code)
console.log('group information: ' + response)
```
### Query Metadata (participants, name, description...)
```ts
const metadata = await sock.groupMetadata(jid)
console.log(metadata.id + ', title: ' + metadata.subject + ', description: ' + metadata.desc)
```
### Join using `groupInviteMessage`
```ts
const response = await sock.groupAcceptInviteV4(jid, groupInviteMessage)
console.log('joined to: ' + response)
```
### Get Request Join List
```ts
const response = await sock.groupRequestParticipantsList(jid)
console.log(response)
```
### Approve/Reject Request Join
```ts
const response = await sock.groupRequestParticipantsUpdate(
    jid, // group id
    ['abcd@s.whatsapp.net', 'efgh@s.whatsapp.net'],
    'approve' // or 'reject'
)
console.log(response)
```
### Get All Participating Groups Metadata
```ts
const response = await sock.groupFetchAllParticipating()
console.log(response)
```
### Toggle Ephemeral

- Ephemeral can be:

| Time  | Seconds        |
|-------|----------------|
| Remove | 0          |
| 24h    | 86.400     |
| 7d     | 604.800    |
| 90d    | 7.776.000  |

```ts
await sock.groupToggleEphemeral(jid, 86400)
```

### Change Add Mode
```ts
await sock.groupMemberAddMode(
    jid,
    'all_member_add' // or 'admin_add'
)
```

## Privacy

### Block/Unblock User
```ts
await sock.updateBlockStatus(jid, 'block') // Block user
await sock.updateBlockStatus(jid, 'unblock') // Unblock user
```
### Get Privacy Settings
```ts
const privacySettings = await sock.fetchPrivacySettings(true)
console.log('privacy settings: ' + privacySettings)
```
### Get BlockList
```ts
const response = await sock.fetchBlocklist()
console.log(response)
```
### Update LastSeen Privacy
```ts
const value = 'all' // 'contacts' | 'contact_blacklist' | 'none'
await sock.updateLastSeenPrivacy(value)
```
### Update Online Privacy
```ts
const value = 'all' // 'match_last_seen'
await sock.updateOnlinePrivacy(value)
```
### Update Profile Picture Privacy
```ts
const value = 'all' // 'contacts' | 'contact_blacklist' | 'none'
await sock.updateProfilePicturePrivacy(value)
```
### Update Status Privacy
```ts
const value = 'all' // 'contacts' | 'contact_blacklist' | 'none'
await sock.updateStatusPrivacy(value)
```
### Update Read Receipts Privacy
```ts
const value = 'all' // 'none'
await sock.updateReadReceiptsPrivacy(value)
```
### Update Groups Add Privacy
```ts
const value = 'all' // 'contacts' | 'contact_blacklist'
await sock.updateGroupsAddPrivacy(value)
```
### Update Default Disappearing Mode

- Like [this](#disappearing-messages), ephemeral can be:

| Time  | Seconds        |
|-------|----------------|
| Remove | 0          |
| 24h    | 86.400     |
| 7d     | 604.800    |
| 90d    | 7.776.000  |

```ts
const ephemeral = 86400
await sock.updateDefaultDisappearingMode(ephemeral)
```

## Broadcast Lists & Stories

### Send Broadcast & Stories
- Messages can be sent to broadcasts & stories. You need to add the following message options in sendMessage, like this:
```ts
await sock.sendMessage(
    jid,
    {
        image: {
            url: url
        },
        caption: caption
    },
    {
        backgroundColor: backgroundColor,
        font: font,
        statusJidList: statusJidList,
        broadcast: true
    }
)
```
- Message body can be a `extendedTextMessage` or `imageMessage` or `videoMessage` or `voiceMessage`, see the [AnyRegularMessageContent type alias](https://baileys.wiki/docs/api/type-aliases/AnyRegularMessageContent/)
- You can add `backgroundColor` and other options in the message options, see the [MiscMessageGenerationOptions type alias](https://baileys.wiki/docs/api/type-aliases/MiscMessageGenerationOptions/)
- `broadcast: true` enables broadcast mode
- `statusJidList`: a list of people that you can get which you need to provide, which are the people who will get this status message.

- You can send messages to broadcast lists the same way you send messages to groups & individual chats.
- Right now, WA Web does not support creating broadcast lists, but you can still delete them.
- Broadcast IDs are in the format `12345678@broadcast`
### Query a Broadcast List's Recipients & Name
```ts
const bList = await sock.getBroadcastListInfo('1234@broadcast')
console.log (`list name: ${bList.name}, recps: ${bList.recipients}`)
```

## Writing Custom Functionality
Baileys is written with custom functionality in mind. Instead of forking the project & re-writing the internals, you can simply write your own extensions.

### Enabling Debug Level in Baileys Logs
First, enable the logging of unhandled messages from WhatsApp by setting:
```ts
const sock = makeWASocket({
    logger: P({ level: 'debug' }),
})
```
This will enable you to see all sorts of messages WhatsApp sends in the console.

### How Whatsapp Communicate With Us

> [!TIP]
> If you want to learn whatsapp protocol, we recommend to study about Libsignal Protocol and Noise Protocol

- **Example:** Functionality to track the battery percentage of your phone. You enable logging and you'll see a message about your battery pop up in the console:
    ```
    {
        "level": 10,
        "fromMe": false,
        "frame": {
            "tag": "ib",
            "attrs": {
                "from": "@s.whatsapp.net"
            },
            "content": [
                {
                    "tag": "edge_routing",
                    "attrs": {},
                    "content": [
                        {
                            "tag": "routing_info",
                            "attrs": {},
                            "content": {
                                "type": "Buffer",
                                "data": [8,2,8,5]
                            }
                        }
                    ]
                }
            ]
        },
        "msg":"communication"
    }
    ```

The `'frame'` is what the message received is, it has three components:
- `tag` -- what this frame is about (eg. message will have 'message')
- `attrs` -- a string key-value pair with some metadata (contains ID of the message usually)
- `content` -- the actual data (eg. a message node will have the actual message content in it)
- read more about this format [here](/src/WABinary/readme.md)

### Register a Callback for Websocket Events

> [!TIP]
> Recommended to see `onMessageReceived` function in `socket.ts` file to understand how websockets events are fired

```ts
// for any message with tag 'edge_routing'
sock.ws.on('CB:edge_routing', (node: BinaryNode) => { })

// for any message with tag 'edge_routing' and id attribute = abcd
sock.ws.on('CB:edge_routing,id:abcd', (node: BinaryNode) => { })

// for any message with tag 'edge_routing', id attribute = abcd & first content node routing_info
sock.ws.on('CB:edge_routing,id:abcd,routing_info', (node: BinaryNode) => { })
```

# License
Copyright (c) 2025 Rajeh Taher/WhiskeySockets

Licensed under the MIT License:
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Thus, the maintainers of the project can't be held liable for any potential misuse of this project.
