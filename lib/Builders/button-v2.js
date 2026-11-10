import { Boom } from '@hapi/boom';
import { randomUUID } from 'crypto';
import { proto } from '../../WAProto/index.js';
import { generateMessageIDV2 } from '../Utils/generics.js';
import { generateWAMessageFromContent } from '../Utils/messages.js';
import { BaseBuilder, createNativeFlowNode } from './base-builder.js';
import { Toolkit } from './toolkit.js';
import { assertPlainObject } from './validation.js';
const THUMBNAIL_SIZE = 300;
/** Fields owned by the builder itself; anything else in a loaded message is kept as media. */
const RESERVED_KEYS = [
    'contentText',
    'footerText',
    'contextInfo',
    'buttons',
    'headerType',
    'locationMessage',
    'viewOnce'
];
/**
 * The older `buttonsMessage` flavour, rendered as a location card with plain reply buttons
 * when no media header is supplied.
 */
export class ButtonV2 extends BaseBuilder {
    constructor() {
        super(...arguments);
        this.buttons = [];
        this.rawThumbnail = false;
    }
    /** Rehydrates the builder from an already built buttons message. */
    loadFrom(message) {
        if (!message) {
            throw new Boom('buttonsMessage needed', { statusCode: 400 });
        }
        const { buttonsMessage, ...extraPayload } = message;
        if (!buttonsMessage) {
            throw new Boom('buttonsMessage not found', { statusCode: 400 });
        }
        const location = buttonsMessage.locationMessage || {};
        this.title = location.name || '';
        this.subtitle = location.address || '';
        this.body = buttonsMessage.contentText || '';
        this.footer = buttonsMessage.footerText || '';
        this.contextInfo = buttonsMessage.contextInfo || {};
        this.extraPayload = extraPayload;
        this.buttons = buttonsMessage.buttons || [];
        this.thumbnail = location.jpegThumbnail ? Buffer.from(location.jpegThumbnail) : undefined;
        this.rawThumbnail = !!this.thumbnail;
        const media = Object.fromEntries(Object.entries(buttonsMessage).filter(([key, value]) => !RESERVED_KEYS.includes(key) && value !== null));
        this.media = Object.keys(media).length ? media : undefined;
        return this;
    }
    addButton(displayText = '', buttonId = randomUUID()) {
        this.buttons.push({
            buttonId,
            buttonText: { displayText },
            type: proto.Message.ButtonsMessage.Button.Type.RESPONSE
        });
        return this;
    }
    addRawButton(button) {
        assertPlainObject(button, 'Buttons');
        this.buttons.push(button);
        return this;
    }
    /** Uses the given bytes as the thumbnail verbatim, skipping the fetch and resize. */
    setRawThumbnail(thumbnail) {
        if (!thumbnail) {
            throw new Boom('Thumbnail needed', { statusCode: 400 });
        }
        this.thumbnail = thumbnail;
        this.rawThumbnail = true;
        return this;
    }
    setThumbnail(path) {
        if (!path) {
            throw new Boom('Url or buffer needed', { statusCode: 400 });
        }
        this.thumbnail = path;
        this.rawThumbnail = false;
        return this;
    }
    setMedia(media) {
        assertPlainObject(media, 'Media');
        this.media = media;
        return this;
    }
    async build(jid, options = {}) {
        const buttonsMessage = {
            contentText: this.body,
            footerText: this.footer,
            contextInfo: this.contextInfo,
            buttons: this.buttons
        };
        if (this.media) {
            Object.assign(buttonsMessage, this.media);
        }
        else {
            buttonsMessage.headerType = proto.Message.ButtonsMessage.HeaderType.LOCATION;
            buttonsMessage.locationMessage = {
                degreesLatitude: 0,
                degreesLongitude: 0,
                name: this.title,
                address: this.subtitle,
                jpegThumbnail: await this.resolveThumbnail()
            };
        }
        return generateWAMessageFromContent(jid, { ...this.extraPayload, buttonsMessage }, this.generationOptions(options));
    }
    async send(jid, { additionalNodes = [], ...options } = {}) {
        if (!this.buttons.length) {
            throw new Boom('ButtonV2 requires at least one button', { statusCode: 400 });
        }
        const messageId = options.messageId || generateMessageIDV2();
        const message = await this.build(jid, { ...options, messageId });
        await this.client.relayMessage(jid, message.message ?? {}, {
            ...options,
            messageId,
            additionalNodes: [createNativeFlowNode(), ...additionalNodes]
        });
        return message;
    }
    async resolveThumbnail() {
        if (!this.thumbnail) {
            return undefined;
        }
        if (this.rawThumbnail) {
            return Buffer.isBuffer(this.thumbnail) ? this.thumbnail : Buffer.from(this.thumbnail, 'base64');
        }
        const source = Buffer.isBuffer(this.thumbnail) ? this.thumbnail : await Toolkit.fetchBuffer(this.thumbnail);
        return Toolkit.resize(source, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
    }
}
//# sourceMappingURL=button-v2.js.map