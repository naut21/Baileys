import { deflateSync } from 'zlib'
import { DOUBLE_BYTE_TOKENS, SINGLE_BYTE_TOKENS, TAGS } from '../../WABinary/constants'
import { decodeBinaryNode, decodeDecompressedBinaryNode } from '../../WABinary/decode'
import { encodeBinaryNode } from '../../WABinary/encode'
import type { BinaryNode } from '../../WABinary/types'

const roundTrip = async (node: BinaryNode) => {
	const encoded = encodeBinaryNode(node)
	// every encoded frame starts with the "not compressed" marker
	expect(encoded[0]).toBe(0)
	return decodeBinaryNode(encoded)
}

/** what the decoder is expected to return for a node the encoder was given */
const normalize = (node: BinaryNode): BinaryNode => {
	const attrs: BinaryNode['attrs'] = {}
	for (const [k, v] of Object.entries(node.attrs || {})) {
		if (v !== undefined && v !== null) {
			attrs[k] = v
		}
	}

	let content = node.content
	if (Array.isArray(content)) {
		content = content.map(normalize)
	} else if (content instanceof Uint8Array && !Buffer.isBuffer(content)) {
		content = Buffer.from(content)
	}

	return content === undefined ? { tag: node.tag, attrs } : { tag: node.tag, attrs, content }
}

describe('binary node codec', () => {
	it('round-trips a typical iq with token strings', async () => {
		const node: BinaryNode = {
			tag: 'iq',
			attrs: { to: '@s.whatsapp.net', type: 'get', xmlns: 'w:p', id: '12345.67890-1' },
			content: [{ tag: 'ping', attrs: {} }]
		}
		expect(await roundTrip(node)).toEqual(normalize(node))
	})

	it('produces the exact wire bytes for a keep-alive ping', () => {
		const node: BinaryNode = {
			attrs: { id: '1', to: '@s.whatsapp.net', type: 'get', xmlns: 'w:p' },
			content: [{ tag: 'ping', attrs: {} }],
			tag: 'iq'
		}
		const encoded = encodeBinaryNode(node)
		const token = (t: string) => SINGLE_BYTE_TOKENS.indexOf(t)
		// '1' is itself a single-byte token, so it is not nibble-packed
		const expected: number[] = [
			0,
			TAGS.LIST_8,
			10,
			token('iq'),
			token('id'),
			token('1'),
			token('to'),
			TAGS.JID_PAIR,
			TAGS.LIST_EMPTY,
			token('s.whatsapp.net'),
			token('type'),
			token('get'),
			token('xmlns'),
			token('w:p'),
			TAGS.LIST_8,
			1,
			TAGS.LIST_8,
			1,
			token('ping')
		]
		expect([...encoded]).toEqual(expected)
	})

	it('nibble-packs numeric strings that are not tokens', () => {
		const encoded = encodeBinaryNode({ tag: 'iq', attrs: { id: '123-4.5' } })
		// 7 chars -> 4 packed bytes, high bit marks the odd trailing nibble
		expect([...encoded.subarray(5)]).toEqual([TAGS.NIBBLE_8, 0x84, 0x12, 0x3a, 0x4b, 0x5f])
	})

	it('round-trips nibble, hex and raw strings', async () => {
		const node: BinaryNode = {
			tag: 'message',
			attrs: {
				phone: '5511999999999',
				dotted: '12.34-56',
				hex: '3EB0ABCDEF0123456789',
				lowerhex: '3eb0abcdef',
				text: 'hello world with spaces & ünïcödé ✓',
				empty: ''
			}
		}
		expect(await roundTrip(node)).toEqual(normalize(node))
	})

	it('round-trips strings longer than 255 and 2^20 bytes', async () => {
		const medium = 'x'.repeat(300)
		const multiByte = 'ñ'.repeat(200) // 400 bytes utf-8, 200 chars
		const large = 'y'.repeat((1 << 20) + 10)
		const decoded = await roundTrip({ tag: 'message', attrs: { medium, multiByte }, content: large })
		expect(decoded.attrs).toEqual({ medium, multiByte })
		// raw string content comes back as bytes, only attribute strings are decoded as strings
		expect(Buffer.compare(decoded.content as Buffer, Buffer.from(large))).toBe(0)
	})

	it('round-trips jids in all addressing forms', async () => {
		const node: BinaryNode = {
			tag: 'message',
			attrs: {
				pn: '5511999999999@s.whatsapp.net',
				pnDevice: '5511999999999:3@s.whatsapp.net',
				lid: '123456789012345@lid',
				lidDevice: '123456789012345:7@lid',
				hosted: '5511999999999:99@hosted',
				hostedLid: '123456789012345:99@hosted.lid',
				group: '120363012345678901@g.us',
				status: 'status@broadcast',
				newsletter: '120363012345678901@newsletter',
				cus: '5511999999999@c.us'
			}
		}
		expect(await roundTrip(node)).toEqual(normalize(node))
	})

	it('normalizes an explicit device 0 to the bare user jid', async () => {
		const decoded = await roundTrip({ tag: 'message', attrs: { to: '5511999999999:0@s.whatsapp.net' } })
		expect(decoded.attrs.to).toBe('5511999999999@s.whatsapp.net')
	})

	it('round-trips binary content of every length class', async () => {
		const small = Buffer.from([1, 2, 3, 4, 5])
		const medium = Buffer.alloc(300, 7)
		const large = Buffer.alloc((1 << 20) + 5, 9)
		for (const content of [small, medium, large]) {
			const decoded = await roundTrip({ tag: 'enc', attrs: { v: '2', type: 'msg' }, content })
			expect(Buffer.isBuffer(decoded.content)).toBe(true)
			expect(Buffer.compare(decoded.content as Buffer, content)).toBe(0)
		}
	})

	it('accepts a Uint8Array as content', async () => {
		const content = new Uint8Array([9, 8, 7])
		const decoded = await roundTrip({ tag: 'enc', attrs: {}, content })
		expect(Buffer.compare(decoded.content as Buffer, Buffer.from(content))).toBe(0)
	})

	it('round-trips nested lists and lists with more than 255 children', async () => {
		const children: BinaryNode[] = []
		for (let i = 0; i < 300; i++) {
			children.push({
				tag: 'to',
				attrs: { jid: `${100000 + i}@s.whatsapp.net` },
				content: [{ tag: 'enc', attrs: { type: 'pkmsg' }, content: Buffer.from([i & 0xff]) }]
			})
		}

		const node: BinaryNode = {
			tag: 'message',
			attrs: { id: 'ABC', to: '120363012345678901@g.us' },
			content: [{ tag: 'participants', attrs: {}, content: children }]
		}
		expect(await roundTrip(node)).toEqual(normalize(node))
	})

	it('drops undefined attributes and children without a tag', async () => {
		const node = {
			tag: 'presence',
			attrs: { type: 'available', name: undefined as unknown as string },
			content: [{ tag: 'a', attrs: {} }, null as unknown as BinaryNode, undefined as unknown as BinaryNode]
		} as BinaryNode
		const decoded = await roundTrip(node)
		expect(decoded).toEqual({ tag: 'presence', attrs: { type: 'available' }, content: [{ tag: 'a', attrs: {} }] })
	})

	it('round-trips double-byte dictionary tokens', async () => {
		const token = DOUBLE_BYTE_TOKENS[1]![5]!
		const decoded = await roundTrip({ tag: 'x', attrs: { a: token } })
		expect(decoded.attrs.a).toBe(token)
	})

	it('encodes a node without content as an odd-length list', () => {
		const encoded = encodeBinaryNode({ tag: 'ping', attrs: {} })
		expect([...encoded]).toEqual([0, TAGS.LIST_8, 1, SINGLE_BYTE_TOKENS.indexOf('ping')])
	})

	it('decodes zlib-compressed frames', async () => {
		const node: BinaryNode = {
			tag: 'iq',
			attrs: { type: 'result', id: '9', text: 'z'.repeat(2000) },
			content: [{ tag: 'a', attrs: {} }]
		}
		const raw = encodeBinaryNode(node).subarray(1)
		const compressed = Buffer.concat([Buffer.from([2]), deflateSync(raw)])
		expect(await decodeBinaryNode(compressed)).toEqual(normalize(node))
	})

	it('advances the shared index ref across sequential nodes', () => {
		const a = encodeBinaryNode({ tag: 'ping', attrs: {} }).subarray(1)
		const b = encodeBinaryNode({ tag: 'iq', attrs: { id: '2' } }).subarray(1)
		const buffer = Buffer.concat([a, b])
		const ref = { index: 0 }
		const opts = { DOUBLE_BYTE_TOKENS, SINGLE_BYTE_TOKENS, TAGS }
		expect(decodeDecompressedBinaryNode(buffer, opts, ref)).toEqual({ tag: 'ping', attrs: {} })
		expect(ref.index).toBe(a.length)
		expect(decodeDecompressedBinaryNode(buffer, opts, ref)).toEqual({ tag: 'iq', attrs: { id: '2' } })
		expect(ref.index).toBe(buffer.length)
	})

	it('throws on truncated input', () => {
		const encoded = encodeBinaryNode({ tag: 'message', attrs: { text: 'hello there' } }).subarray(1)
		const opts = { DOUBLE_BYTE_TOKENS, SINGLE_BYTE_TOKENS, TAGS }
		expect(() => decodeDecompressedBinaryNode(encoded.subarray(0, encoded.length - 3), opts)).toThrow()
	})

	it('rejects a node without a tag', () => {
		expect(() => encodeBinaryNode({ tag: '', attrs: {} })).toThrow(/tag/)
	})
})
