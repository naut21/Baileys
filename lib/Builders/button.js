import { Boom } from '@hapi/boom';
import { generateMessageIDV2 } from '../Utils/generics.js';
import { generateWAMessageFromContent, prepareWAMessageMedia } from '../Utils/messages.js';
import { BaseBuilder, createNativeFlowNode } from './base-builder.js';
import { assertPlainObject } from './validation.js';
export const toParamsJson = (value) => typeof value === 'string' ? value : JSON.stringify(value ?? {});
/**
 * Native flow buttons: quick replies, url/copy/call actions and single-select lists,
 * on top of an optional media header.
 */
export class Button extends BaseBuilder {
    constructor() {
        super(...arguments);
        this.buttons = [];
        this.params = {};
        this.selectionIndex = -1;
        this.sectionIndex = -1;
    }
    /** Rehydrates the builder from an already built interactive message. */
    loadFrom(message) {
        if (!message) {
            throw new Boom('interactiveMessage needed', { statusCode: 400 });
        }
        const { interactiveMessage, ...extraPayload } = message;
        if (!interactiveMessage) {
            throw new Boom('interactiveMessage not found', { statusCode: 400 });
        }
        const header = interactiveMessage.header || {};
        const nativeFlow = interactiveMessage.nativeFlowMessage || {};
        this.title = header.title || '';
        this.subtitle = header.subtitle || '';
        this.body = interactiveMessage.body?.text || '';
        this.footer = interactiveMessage.footer?.text || '';
        this.contextInfo = interactiveMessage.contextInfo || {};
        this.extraPayload = extraPayload;
        this.buttons = (nativeFlow.buttons || []).map(button => ({
            ...button,
            buttonParamsJson: toParamsJson(button.buttonParamsJson)
        }));
        this.media = header.imageMessage
            ? { imageMessage: header.imageMessage }
            : header.videoMessage
                ? { videoMessage: header.videoMessage }
                : header.documentMessage
                    ? { documentMessage: header.documentMessage }
                    : header.productMessage
                        ? { productMessage: header.productMessage }
                        : undefined;
        this.params = {};
        if (nativeFlow.messageParamsJson) {
            try {
                this.params = JSON.parse(toParamsJson(nativeFlow.messageParamsJson));
            }
            catch {
                this.params = {};
            }
        }
        this.selectionIndex = this.buttons.reduce((last, button, index) => (button.name === 'single_select' ? index : last), -1);
        this.sectionIndex = -1;
        if (this.selectionIndex !== -1) {
            const sections = this.readSelection(this.selectionIndex).sections;
            this.sectionIndex = sections.length ? sections.length - 1 : -1;
        }
        return this;
    }
    setImage(path, options = {}) {
        if (!path) {
            throw new Boom('Url or buffer needed', { statusCode: 400 });
        }
        this.media = { image: Buffer.isBuffer(path) ? path : { url: path }, ...options };
        return this;
    }
    setDocument(path, options = {}) {
        if (!path) {
            throw new Boom('Url or buffer needed', { statusCode: 400 });
        }
        this.media = { document: Buffer.isBuffer(path) ? path : { url: path }, ...options };
        return this;
    }
    setMedia(media) {
        assertPlainObject(media, 'Media');
        this.media = media;
        return this;
    }
    clearButtons() {
        this.buttons = [];
        return this;
    }
    setParams(params) {
        assertPlainObject(params, 'Params');
        this.params = params;
        return this;
    }
    addButton(name, params) {
        this.buttons.push({ name, buttonParamsJson: toParamsJson(params) });
        return this;
    }
    addSelection(title, options = {}) {
        this.buttons.push({
            name: 'single_select',
            buttonParamsJson: JSON.stringify({ title, sections: [], ...options })
        });
        this.selectionIndex = this.buttons.length - 1;
        this.sectionIndex = -1;
        return this;
    }
    makeSection(title = '', highlight_label = '') {
        if (this.selectionIndex === -1) {
            throw new Boom('You need to create a selection first', { statusCode: 400 });
        }
        const params = this.readSelection(this.selectionIndex);
        params.sections.push({ title, highlight_label, rows: [] });
        this.sectionIndex = params.sections.length - 1;
        this.writeSelection(this.selectionIndex, params);
        return this;
    }
    makeRow(header = '', title = '', description = '', id = '') {
        if (this.selectionIndex === -1 || this.sectionIndex === -1) {
            throw new Boom('You need to create a selection and a section first', { statusCode: 400 });
        }
        const params = this.readSelection(this.selectionIndex);
        const section = params.sections[this.sectionIndex];
        if (!section) {
            throw new Boom('The selected section no longer exists', { statusCode: 400 });
        }
        section.rows.push({ header, title, description, id });
        this.writeSelection(this.selectionIndex, params);
        return this;
    }
    addReply(display_text = '', id = '', options = {}) {
        return this.addButton('quick_reply', { display_text, id, ...options });
    }
    addCall(display_text = '', id = '', options = {}) {
        return this.addButton('cta_call', { display_text, id, ...options });
    }
    addReminder(display_text = '', id = '', options = {}) {
        return this.addButton('cta_reminder', { display_text, id, ...options });
    }
    addCancelReminder(display_text = '', id = '', options = {}) {
        return this.addButton('cta_cancel_reminder', { display_text, id, ...options });
    }
    addAddress(display_text = '', id = '', options = {}) {
        return this.addButton('address_message', { display_text, id, ...options });
    }
    addLocation(options = {}) {
        return this.addButton('send_location', options);
    }
    addUrl(display_text = '', url = '', webview_interaction = false, options = {}) {
        return this.addButton('cta_url', { display_text, url, webview_interaction, ...options });
    }
    addCopy(display_text = '', copy_code = '', options = {}) {
        return this.addButton('cta_copy', { display_text, copy_code, ...options });
    }
    /** The interactive body on its own, ready to be dropped into a `Carousel` card. */
    async toCard() {
        const header = {
            title: this.title,
            subtitle: this.subtitle,
            hasMediaAttachment: !!this.media
        };
        if (this.media) {
            const prepared = await prepareWAMessageMedia(this.media, {
                upload: this.client.waUploadToServer
            }).catch((error) => {
                if (String(error).includes('Invalid media type')) {
                    return this.media;
                }
                throw error;
            });
            Object.assign(header, prepared);
        }
        return {
            body: { text: this.body },
            footer: { text: this.footer },
            header,
            nativeFlowMessage: {
                messageParamsJson: JSON.stringify(this.params),
                buttons: this.buttons
            }
        };
    }
    async build(jid, options = {}) {
        const card = await this.toCard();
        return generateWAMessageFromContent(jid, {
            ...this.extraPayload,
            interactiveMessage: { ...card, contextInfo: this.contextInfo }
        }, this.generationOptions(options));
    }
    async send(jid, { additionalNodes = [], ...options } = {}) {
        const messageId = options.messageId || generateMessageIDV2();
        const message = await this.build(jid, { ...options, messageId });
        await this.client.relayMessage(jid, message.message ?? {}, {
            ...options,
            messageId,
            additionalNodes: [createNativeFlowNode(), ...additionalNodes]
        });
        return message;
    }
    readSelection(index) {
        const button = this.buttons[index];
        let params;
        try {
            params = JSON.parse(button?.buttonParamsJson || '{}');
        }
        catch {
            params = { sections: [] };
        }
        return { ...params, sections: Array.isArray(params.sections) ? params.sections : [] };
    }
    writeSelection(index, params) {
        const button = this.buttons[index];
        if (button) {
            button.buttonParamsJson = JSON.stringify(params);
        }
    }
}
/** Shapes accepted by `setParams`, keyed by the entry name WhatsApp reads. */
Button.paramsList = {
    limited_time_offer: {
        text: 'string',
        url: 'string',
        copy_code: 'string',
        expiration_time: 'number'
    },
    bottom_sheet: {
        in_thread_buttons_limit: 'number',
        divider_indices: ['number'],
        list_title: 'string',
        button_title: 'string'
    },
    tap_target_configuration: {
        title: 'string',
        description: 'string',
        canonical_url: 'string',
        domain: 'string',
        buttonIndex: 'number'
    }
};
//# sourceMappingURL=button.js.map