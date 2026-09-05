import { promisify } from 'util'
import { inflate, inflateSync } from 'zlib'
import * as constants from './constants'
import { jidEncode, type JidServer, WAJIDDomains } from './jid-utils'
import type { BinaryNode, BinaryNodeCodingOptions } from './types'

const inflatePromise = promisify(inflate)

type DecodeOptions = Pick<BinaryNodeCodingOptions, 'DOUBLE_BYTE_TOKENS' | 'SINGLE_BYTE_TOKENS' | 'TAGS'>

/**
 * Strips the compression marker byte and inflates the payload when it is flagged as compressed.
 *
 * Runs synchronously on purpose: the async zlib variant hops through the libuv threadpool, so two
 * frames arriving back to back could finish decoding out of order (an uncompressed ack overtaking
 * the compressed message it belongs to) and each one paid a threadpool round trip before the socket
 * could react to it. Incoming frames are small enough that inflating inline is cheaper than the hop.
 */
export const decompressIfRequiredSync = (buffer: Buffer): Buffer => {
	if (!buffer.length) {
		throw new Error('cannot decode an empty frame')
	}

	if (2 & buffer[0]!) {
		return inflateSync(buffer.subarray(1))
	}

	// nodes with no compression have a 0x00 prefix, we remove that
	return buffer.subarray(1)
}

/** @deprecated use decompressIfRequiredSync; kept for API compatibility */
export const decompressingIfRequired = async (buffer: Buffer) => {
	if (2 & buffer.readUInt8()) {
		buffer = await inflatePromise(buffer.subarray(1))
	} else {
		buffer = buffer.subarray(1)
	}

	return buffer
}

/**
 * Cursor over a decompressed frame. The decoder used to rebuild ~25 closures for every node it
 * visited, recursively, so a stanza carrying a few thousand children (group metadata, usync
 * results, offline batches) allocated tens of thousands of short-lived functions per frame. A single
 * reader instance per frame keeps the same logic with no per-node allocation beyond the node itself.
 */
class BinaryNodeReader {
	index: number

	constructor(
		private readonly buffer: Buffer,
		private readonly opts: DecodeOptions,
		index: number
	) {
		this.index = index
	}

	private checkEOS(length: number) {
		if (this.index + length > this.buffer.length) {
			throw new Error('end of stream')
		}
	}

	private readByte(): number {
		this.checkEOS(1)
		return this.buffer[this.index++]!
	}

	private readBytes(n: number): Buffer {
		this.checkEOS(n)
		const value = this.buffer.subarray(this.index, this.index + n)
		this.index += n
		return value
	}

	private readStringFromChars(length: number): string {
		this.checkEOS(length)
		const value = this.buffer.toString('utf-8', this.index, this.index + length)
		this.index += length
		return value
	}

	private readInt(n: number, littleEndian = false): number {
		this.checkEOS(n)
		let val = 0
		for (let i = 0; i < n; i++) {
			const shift = littleEndian ? i : n - 1 - i
			val |= this.buffer[this.index++]! << (shift * 8)
		}

		return val
	}

	private readInt20(): number {
		this.checkEOS(3)
		const b0 = this.buffer[this.index++]!
		const b1 = this.buffer[this.index++]!
		const b2 = this.buffer[this.index++]!
		return ((b0 & 15) << 16) + (b1 << 8) + b2
	}

	private unpackHex(value: number): number {
		if (value >= 0 && value < 16) {
			return value < 10 ? '0'.charCodeAt(0) + value : 'A'.charCodeAt(0) + value - 10
		}

		throw new Error('invalid hex: ' + value)
	}

	private unpackNibble(value: number): number {
		if (value >= 0 && value <= 9) {
			return '0'.charCodeAt(0) + value
		}

		switch (value) {
			case 10:
				return '-'.charCodeAt(0)
			case 11:
				return '.'.charCodeAt(0)
			case 15:
				return '\0'.charCodeAt(0)
			default:
				throw new Error('invalid nibble: ' + value)
		}
	}

	private unpackByte(tag: number, value: number): number {
		const { TAGS } = this.opts
		if (tag === TAGS.NIBBLE_8) {
			return this.unpackNibble(value)
		} else if (tag === TAGS.HEX_8) {
			return this.unpackHex(value)
		} else {
			throw new Error('unknown tag: ' + tag)
		}
	}

	private readPacked8(tag: number): string {
		const startByte = this.readByte()
		let value = ''

		for (let i = 0; i < (startByte & 127); i++) {
			const curByte = this.readByte()

			value += String.fromCharCode(this.unpackByte(tag, (curByte & 0xf0) >> 4))
			value += String.fromCharCode(this.unpackByte(tag, curByte & 0x0f))
		}

		if (startByte >> 7 !== 0) {
			value = value.slice(0, -1)
		}

		return value
	}

	private isListTag(tag: number): boolean {
		const { TAGS } = this.opts
		return tag === TAGS.LIST_EMPTY || tag === TAGS.LIST_8 || tag === TAGS.LIST_16
	}

	private readListSize(tag: number): number {
		const { TAGS } = this.opts
		switch (tag) {
			case TAGS.LIST_EMPTY:
				return 0
			case TAGS.LIST_8:
				return this.readByte()
			case TAGS.LIST_16:
				return this.readInt(2)
			default:
				throw new Error('invalid tag for list size: ' + tag)
		}
	}

	private readJidPair(): string {
		const i = this.readString(this.readByte())
		const j = this.readString(this.readByte())
		if (j) {
			return (i || '') + '@' + j
		}

		throw new Error('invalid jid pair: ' + i + ', ' + j)
	}

	private readAdJid(): string {
		const domainType = this.readByte()
		const device = this.readByte()
		const user = this.readString(this.readByte())

		let server: JidServer = 's.whatsapp.net' // default whatsapp server
		if (domainType === WAJIDDomains.LID) {
			server = 'lid'
		} else if (domainType === WAJIDDomains.HOSTED) {
			server = 'hosted'
		} else if (domainType === WAJIDDomains.HOSTED_LID) {
			server = 'hosted.lid'
		}

		return jidEncode(user, server, device)
	}

	private readFbJid(): string {
		const user = this.readString(this.readByte())
		const device = this.readInt(2)
		const server = this.readString(this.readByte())
		return `${user}:${device}@${server}`
	}

	private readInteropJid(): string {
		const user = this.readString(this.readByte())
		const device = this.readInt(2)
		const integrator = this.readInt(2)

		let server = 'interop'
		const beforeServer = this.index
		try {
			server = this.readString(this.readByte())
		} catch (err) {
			this.index = beforeServer
		}

		return `${integrator}-${user}:${device}@${server}`
	}

	private getTokenDouble(index1: number, index2: number): string {
		const dict = this.opts.DOUBLE_BYTE_TOKENS[index1]
		if (!dict) {
			throw new Error(`Invalid double token dict (${index1})`)
		}

		const value = dict[index2]
		if (typeof value === 'undefined') {
			throw new Error(`Invalid double token (${index2})`)
		}

		return value
	}

	private readString(tag: number): string {
		const { SINGLE_BYTE_TOKENS, TAGS } = this.opts
		if (tag >= 1 && tag < SINGLE_BYTE_TOKENS.length) {
			return SINGLE_BYTE_TOKENS[tag] || ''
		}

		switch (tag) {
			case TAGS.DICTIONARY_0:
			case TAGS.DICTIONARY_1:
			case TAGS.DICTIONARY_2:
			case TAGS.DICTIONARY_3:
				return this.getTokenDouble(tag - TAGS.DICTIONARY_0, this.readByte())
			case TAGS.LIST_EMPTY:
				return ''
			case TAGS.BINARY_8:
				return this.readStringFromChars(this.readByte())
			case TAGS.BINARY_20:
				return this.readStringFromChars(this.readInt20())
			case TAGS.BINARY_32:
				return this.readStringFromChars(this.readInt(4))
			case TAGS.JID_PAIR:
				return this.readJidPair()
			case TAGS.FB_JID:
				return this.readFbJid()
			case TAGS.INTEROP_JID:
				return this.readInteropJid()
			case TAGS.AD_JID:
				return this.readAdJid()
			case TAGS.HEX_8:
			case TAGS.NIBBLE_8:
				return this.readPacked8(tag)
			default:
				throw new Error('invalid string with tag: ' + tag)
		}
	}

	private readList(tag: number): BinaryNode[] {
		const size = this.readListSize(tag)
		const items: BinaryNode[] = new Array(size)
		for (let i = 0; i < size; i++) {
			items[i] = this.readNode()
		}

		return items
	}

	readNode(): BinaryNode {
		const { TAGS } = this.opts

		const listSize = this.readListSize(this.readByte())
		const header = this.readString(this.readByte())
		if (!listSize || !header.length) {
			throw new Error('invalid node')
		}

		const attrs: BinaryNode['attrs'] = {}
		let data: BinaryNode['content']

		// read the attributes in
		const attributesLength = (listSize - 1) >> 1
		for (let i = 0; i < attributesLength; i++) {
			const key = this.readString(this.readByte())
			const value = this.readString(this.readByte())

			attrs[key] = value
		}

		if (listSize % 2 === 0) {
			const tag = this.readByte()
			if (this.isListTag(tag)) {
				data = this.readList(tag)
			} else {
				switch (tag) {
					case TAGS.BINARY_8:
						data = this.readBytes(this.readByte())
						break
					case TAGS.BINARY_20:
						data = this.readBytes(this.readInt20())
						break
					case TAGS.BINARY_32:
						data = this.readBytes(this.readInt(4))
						break
					default:
						data = this.readString(tag)
						break
				}
			}
		}

		return {
			tag: header,
			attrs,
			content: data
		}
	}
}

export const decodeDecompressedBinaryNode = (
	buffer: Buffer,
	opts: DecodeOptions,
	indexRef: { index: number } = { index: 0 }
): BinaryNode => {
	const reader = new BinaryNodeReader(buffer, opts, indexRef.index)
	const node = reader.readNode()
	indexRef.index = reader.index
	return node
}

export const decodeBinaryNodeSync = (buff: Buffer): BinaryNode => {
	return decodeDecompressedBinaryNode(decompressIfRequiredSync(buff), constants)
}

export const decodeBinaryNode = async (buff: Buffer): Promise<BinaryNode> => {
	return decodeBinaryNodeSync(buff)
}
