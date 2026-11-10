import { Boom } from '@hapi/boom';
import { generateMessageIDV2 } from '../Utils/generics.js';
import { generateWAMessageFromContent } from '../Utils/messages.js';
import { BaseBuilder, createNativeFlowNode } from './base-builder.js';
import { toParamsJson } from './button.js';
const normalizeCard = (card) => ({
    ...card,
    body: { text: card.body?.text || '' },
    footer: { text: card.footer?.text || '' },
    header: { ...card.header, hasMediaAttachment: !!card.header?.hasMediaAttachment },
    nativeFlowMessage: {
        ...card.nativeFlowMessage,
        messageParamsJson: toParamsJson(card.nativeFlowMessage?.messageParamsJson),
        buttons: (card.nativeFlowMessage?.buttons || []).map(button => ({
            ...button,
            buttonParamsJson: toParamsJson(button.buttonParamsJson)
        }))
    }
});
/** A horizontally scrollable strip of `Button` cards, each one needing its own media header. */
export class Carousel extends BaseBuilder {
    constructor() {
        super(...arguments);
        this.cards = [];
    }
    /** Rehydrates the builder from an already built carousel message. */
    loadFrom(message) {
        if (!message) {
            throw new Boom('interactiveMessage needed', { statusCode: 400 });
        }
        const { interactiveMessage, ...extraPayload } = message;
        if (!interactiveMessage) {
            throw new Boom('interactiveMessage not found', { statusCode: 400 });
        }
        this.body = interactiveMessage.body?.text || '';
        this.footer = interactiveMessage.footer?.text || '';
        this.contextInfo = interactiveMessage.contextInfo || {};
        this.extraPayload = extraPayload;
        this.cards = (interactiveMessage.carouselMessage?.cards || []).map(normalizeCard);
        return this;
    }
    /** Takes one card or a list of them, as produced by `Button.toCard()`. */
    addCard(card) {
        const cards = Array.isArray(card) ? card : [card];
        const baseIndex = this.cards.length;
        for (const [index, entry] of cards.entries()) {
            if (!entry?.header?.hasMediaAttachment) {
                throw new Boom(`Card [${baseIndex + index}] must include an image or video in header`, { statusCode: 400 });
            }
        }
        this.cards.push(...cards);
        return this;
    }
    async build(jid, options = {}) {
        return generateWAMessageFromContent(jid, {
            ...this.extraPayload,
            interactiveMessage: {
                header: { hasMediaAttachment: false },
                body: { text: this.body },
                footer: { text: this.footer },
                contextInfo: this.contextInfo,
                carouselMessage: { cards: this.cards }
            }
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
}
//# sourceMappingURL=carousel.js.map