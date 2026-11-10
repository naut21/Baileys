import { Boom } from '@hapi/boom';
import { generateMessageIDV2 } from '../Utils/generics.js';
import { assertPlainObject, assertString } from './validation.js';
/** WhatsApp only renders native flow buttons when the stanza carries this hint. */
export const createNativeFlowNode = () => ({
    tag: 'biz',
    attrs: {},
    content: [
        {
            tag: 'interactive',
            attrs: { type: 'native_flow', v: '1' },
            content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
        }
    ]
});
/** Text slots, context info and raw payload extras every builder shares. */
export class BaseBuilder {
    constructor(client) {
        this.title = '';
        this.subtitle = '';
        this.body = '';
        this.footer = '';
        this.contextInfo = {};
        this.extraPayload = {};
        if (!client) {
            throw new Boom('Socket is required', { statusCode: 400 });
        }
        this.client = client;
    }
    setTitle(title) {
        assertString(title, 'Title');
        this.title = title;
        return this;
    }
    setSubtitle(subtitle) {
        assertString(subtitle, 'Subtitle');
        this.subtitle = subtitle;
        return this;
    }
    setBody(body) {
        assertString(body, 'Body');
        this.body = body;
        return this;
    }
    setFooter(footer) {
        assertString(footer, 'Footer');
        this.footer = footer;
        return this;
    }
    setContextInfo(contextInfo) {
        assertPlainObject(contextInfo, 'ContextInfo');
        this.contextInfo = contextInfo;
        return this;
    }
    /** Merges extra top-level message fields into whatever the builder produces. */
    addPayload(payload) {
        assertPlainObject(payload, 'Payload');
        Object.assign(this.extraPayload, payload);
        return this;
    }
    generationOptions({ messageId, userJid, ...rest }) {
        return {
            ...rest,
            messageId: messageId || generateMessageIDV2(),
            userJid: userJid ?? this.client.user?.id ?? ''
        };
    }
}
//# sourceMappingURL=base-builder.js.map