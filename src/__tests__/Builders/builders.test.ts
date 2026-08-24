import { proto } from '../../../WAProto/index.js'
import { AIRich } from '../../Builders/ai-rich'
import { Button } from '../../Builders/button'
import { ButtonV2 } from '../../Builders/button-v2'
import { Carousel } from '../../Builders/carousel'
import { extractInlineEntities } from '../../Builders/inline-entities'
import { Toolkit } from '../../Builders/toolkit'
import type { BuilderSocket } from '../../Builders/types'
import type { MessageRelayOptions } from '../../Types'

const JID = '15557654321@s.whatsapp.net'

type Relayed = { jid: string; message: proto.IMessage; options: MessageRelayOptions }

const makeSocket = () => {
	const relayed: Relayed[] = []

	const socket: BuilderSocket = {
		user: { id: '15551234567@s.whatsapp.net' },
		waUploadToServer: async () => ({ mediaUrl: 'https://mmg.whatsapp.net/fake', directPath: '/fake' }),
		relayMessage: async (jid, message, options) => {
			relayed.push({ jid, message, options })

			return options.messageId!
		}
	}

	return { socket, relayed }
}

const readUnifiedResponse = (message: proto.IMessage) => {
	const data = message.botForwardedMessage?.message?.richResponseMessage?.unifiedResponse?.data

	return JSON.parse(Buffer.from(data!).toString('utf8')) as {
		response_id: string
		sections: { view_model: { primitive?: Record<string, any>; primitives?: Record<string, any>[] } }[]
	}
}

const makeMp4 = (timescale: number, duration: number) => {
	const mvhd = Buffer.alloc(28)
	mvhd.writeUInt32BE(mvhd.length, 0)
	mvhd.write('mvhd', 4)
	mvhd.writeUInt32BE(timescale, 20)
	mvhd.writeUInt32BE(duration, 24)

	const moov = Buffer.concat([Buffer.alloc(8), mvhd])
	moov.writeUInt32BE(moov.length, 0)
	moov.write('moov', 4)

	const ftyp = Buffer.alloc(16)
	ftyp.writeUInt32BE(ftyp.length, 0)
	ftyp.write('ftyp', 4)

	return Buffer.concat([ftyp, moov])
}

describe('Button', () => {
	it('builds native flow buttons and single select rows', async () => {
		const { socket } = makeSocket()

		const message = await new Button(socket)
			.setTitle('Header')
			.setBody('Body text')
			.addReply('Hello', 'id_hello')
			.addUrl('Open', 'https://example.com')
			.addSelection('Pick one')
			.makeSection('Group A')
			.makeRow('', 'Row 1', 'first', 'row_1')
			.build(JID)

		const nativeFlow = message.message?.interactiveMessage?.nativeFlowMessage

		expect(message.message?.interactiveMessage?.body?.text).toBe('Body text')
		expect(nativeFlow?.buttons?.map(button => button.name)).toEqual(['quick_reply', 'cta_url', 'single_select'])

		const selection = JSON.parse(nativeFlow!.buttons![2]!.buttonParamsJson!)

		expect(selection.sections[0].rows).toEqual([{ header: '', title: 'Row 1', description: 'first', id: 'row_1' }])
	})

	it('round trips through loadFrom', async () => {
		const { socket } = makeSocket()

		const original = await new Button(socket).setBody('Body text').addReply('Hello', 'id_hello').build(JID)
		const card = await new Button(socket).loadFrom(original.message!).toCard()

		expect(card.body?.text).toBe('Body text')
		expect(card.nativeFlowMessage?.buttons).toHaveLength(1)
	})

	it('attaches the native flow node when sending', async () => {
		const { socket, relayed } = makeSocket()

		await new Button(socket).setBody('Body').addReply('Hi', 'hi').send(JID)

		expect(relayed).toHaveLength(1)
		expect(relayed[0]!.options.additionalNodes?.[0]?.tag).toBe('biz')
	})
})

describe('ButtonV2', () => {
	it('falls back to a location header when no media is set', async () => {
		const { socket } = makeSocket()

		const message = await new ButtonV2(socket)
			.setTitle('Location title')
			.setSubtitle('Location address')
			.addButton('Yes', 'yes_id')
			.build(JID)

		const buttonsMessage = message.message?.buttonsMessage

		expect(buttonsMessage?.headerType).toBe(proto.Message.ButtonsMessage.HeaderType.LOCATION)
		expect(buttonsMessage?.locationMessage?.name).toBe('Location title')
		expect(buttonsMessage?.buttons?.[0]?.type).toBe(proto.Message.ButtonsMessage.Button.Type.RESPONSE)
	})

	it('refuses to send without buttons', async () => {
		const { socket } = makeSocket()

		await expect(new ButtonV2(socket).setBody('Body').send(JID)).rejects.toThrow('at least one button')
	})
})

describe('Carousel', () => {
	it('rejects cards without a media header', () => {
		const { socket } = makeSocket()

		expect(() => new Carousel(socket).addCard({ body: { text: 'no media' } })).toThrow('must include an image or video')
	})

	it('carries every card into the carousel message', async () => {
		const { socket } = makeSocket()

		const card = await new Button(socket)
			.setBody('Card body')
			.setMedia({ imageMessage: { url: 'https://mmg.whatsapp.net/card.enc', mimetype: 'image/jpeg' } })
			.toCard()

		const message = await new Carousel(socket).setBody('Carousel body').addCard([card, card]).build(JID)

		expect(message.message?.interactiveMessage?.carouselMessage?.cards).toHaveLength(2)
	})
})

describe('extractInlineEntities', () => {
	it('turns links, citations and latex into placeholders', () => {
		const { text, inline_entities } = extractInlineEntities(
			'see [Baileys](https://baileys.wiki), [](https://example.com/src) and [x^2]<https://img/x.png>'
		)

		expect(text).toContain('{{NIXEL_HYPERLINK_0}}')
		expect(text).toContain('{{NIXEL_CITATION_0}}')
		expect(text).toContain('{{NIXEL_LATEX_0}}')

		expect(inline_entities.map(entity => entity.metadata.__typename)).toEqual([
			'GenAIInlineLinkItem',
			'GenAISearchCitationItem',
			'GenAILatexItem'
		])
	})

	it('marks urls prefixed with ! as untrusted', () => {
		const { inline_entities } = extractInlineEntities('[risky](!https://example.com)')

		expect(inline_entities[0]?.metadata).toMatchObject({ is_trusted: false, url: 'https://example.com' })
	})

	it('leaves text alone when extraction is off', () => {
		const raw = '[Baileys](https://baileys.wiki)'

		expect(extractInlineEntities(raw, { extract: false })).toEqual({ text: raw, ie: [], inline_entities: [] })
	})
})

describe('Toolkit', () => {
	it('reads the duration out of an mp4 container', () => {
		expect(Toolkit.getMp4Duration(makeMp4(1000, 5000))).toBe(5)
	})

	it('returns zero for anything that is not an mp4', () => {
		expect(Toolkit.getMp4Duration(Buffer.from('not a video'))).toBe(0)
	})

	it('throws for anything that is not an mp4 when not silent', () => {
		expect(() => Toolkit.getMp4Duration(Buffer.from('not a video'), { silent: false })).toThrow()
	})

	it('escapes non ascii characters', () => {
		expect(Toolkit.stringifyEscaped({ a: 'ñ' })).toBe('{"a":"\\u00f1"}')
	})

	it('resolves nested promises in place', async () => {
		const resolved = await Toolkit.waitAllPromises({ a: Promise.resolve(1), b: [Promise.resolve('two')] })

		expect(resolved).toEqual({ a: 1, b: ['two'] })
	})
})

describe('AIRich', () => {
	it('lays sections out in the order they were added', async () => {
		const { socket } = makeSocket()

		const rich = new AIRich(socket, { dynamic: false })
			.setFooter('Footer line')
			.addText('First', { id: 'first' })
			.addText('Second')

		rich.addTip('Between', { insertAt: 'first' })

		const message = await rich.build(JID)
		const { sections } = readUnifiedResponse(message.message!)

		expect(sections.map(section => section.view_model.primitive?.text)).toEqual([
			'First',
			'ⓘ Between',
			'Second',
			'Footer line'
		])
	})

	it('keeps the position and the id when replacing an item', async () => {
		const { socket } = makeSocket()

		const rich = new AIRich(socket, { dynamic: false }).addText('First', { id: 'first' }).addText('Second')

		rich.addText('Replaced', { replace: 'first' })

		const { sections } = readUnifiedResponse((await rich.build(JID)).message!)

		expect(sections[0]?.view_model.primitive?.text).toBe('Replaced')
		expect(rich.hasId('first')).toBe(true)
	})

	it('drops the id along with the item', () => {
		const { socket } = makeSocket()

		const rich = new AIRich(socket).addText('First', { id: 'first' })

		rich.delete('first')

		expect(rich.getIds()).toEqual([])
	})

	it('refuses duplicate ids', () => {
		const { socket } = makeSocket()

		const rich = new AIRich(socket).addText('First', { id: 'first' })

		expect(() => rich.addText('Again', { id: 'first' })).toThrow('already exists')
	})

	it('refuses replace and insertAt together', () => {
		const { socket } = makeSocket()

		const rich = new AIRich(socket).addText('First', { id: 'first' })

		expect(() => rich.addText('Second', { replace: 'first', insertAt: 'first' })).toThrow('cannot be used together')
	})

	it('reports unknown targets with the ids that do exist', () => {
		const { socket } = makeSocket()

		const rich = new AIRich(socket).addText('First', { id: 'first' })

		expect(() => rich.delete('nope')).toThrow('available: first')
	})

	it('highlights code and keeps a plain text fallback', async () => {
		const { socket } = makeSocket()

		const rich = new AIRich(socket, { dynamic: false }).addCode('javascript', 'const greet = () => "hi"')
		const message = await rich.build(JID)
		const { sections } = readUnifiedResponse(message.message!)

		const blocks = sections[0]?.view_model.primitive?.code_blocks as { content: string; type: string }[]

		expect(blocks.some(block => block.type === 'KEYWORD' && block.content === 'const')).toBe(true)
		expect(blocks.some(block => block.type === 'STR')).toBe(true)

		const submessage = message.message?.botForwardedMessage?.message?.richResponseMessage?.submessages?.[0]

		expect(submessage?.messageType).toBe(proto.AIRichResponseSubMessageType.AI_RICH_RESPONSE_CODE)
		expect(submessage?.codeMetadata?.codeLanguage).toBe('javascript')
	})

	it('marks the first table row as the header', async () => {
		const { socket } = makeSocket()

		const rich = new AIRich(socket, { dynamic: false }).addTable([
			['Name', 'Role'],
			['[Nixel](https://nixel.dev/)', 'Developer']
		])

		const { sections } = readUnifiedResponse((await rich.build(JID)).message!)
		const rows = sections[0]?.view_model.primitive?.rows as {
			is_header: boolean
			cells: string[]
			markdown_cells?: { inline_entities?: unknown[] }[]
		}[]

		expect(rows[0]?.is_header).toBe(true)
		expect(rows[1]?.markdown_cells?.[0]?.inline_entities).toHaveLength(1)
	})

	it('stamps the message as forwarded from the ai bot', async () => {
		const { socket } = makeSocket()

		const message = await new AIRich(socket, { dynamic: false }).addText('Hi').build(JID)
		const contextInfo = message.message?.botForwardedMessage?.message?.richResponseMessage?.contextInfo

		expect(contextInfo?.forwardOrigin).toBe(proto.ContextInfo.ForwardOrigin.META_AI)
		expect(message.message?.messageContextInfo?.botMetadata?.verificationMetadata?.proofs?.[0]?.signature).toHaveLength(
			64
		)
	})

	it('follows the first relay with an edit of the same message', async () => {
		const { socket, relayed } = makeSocket()

		const sent = await new AIRich(socket).addText('Hi').send(JID)

		expect(relayed).toHaveLength(2)

		const edit = relayed[1]!.message.botForwardedMessage?.message?.protocolMessage

		expect(edit?.type).toBe(proto.Message.ProtocolMessage.Type.MESSAGE_EDIT)
		expect(edit?.key?.id).toBe(sent.key.id)
	})

	it('relays only once when the download bypass is off', async () => {
		const { socket, relayed } = makeSocket()

		await new AIRich(socket).addText('Hi').send(JID, { bypassDownload: false })

		expect(relayed).toHaveLength(1)
	})

	it('reloads its items from a built message', async () => {
		const { socket } = makeSocket()

		const built = await new AIRich(socket, { dynamic: false }).addText('First').addSuggest(['One', 'Two']).build(JID)

		const reloaded = new AIRich(socket).loadFrom(built)

		expect(reloaded.sections).toHaveLength(2)
		expect(reloaded.items).toHaveLength(3)
	})

	it('exposes its primitives so another builder can reuse them', () => {
		const { socket } = makeSocket()

		const items = new AIRich(socket).addText('Mixed').items

		expect(items).toHaveLength(1)
		expect(items[0]?.__typename).toBe('GenAIMarkdownTextUXPrimitive')
	})
})
