import * as constants from './constants'
import { type FullJid, jidDecode } from './jid-utils'
import type { BinaryNode, BinaryNodeCodingOptions } from './types'

type EncodeOptions = Pick<BinaryNodeCodingOptions, 'TAGS' | 'TOKEN_MAP'>

const ZERO_CHAR = '0'.charCodeAt(0)
const UPPER_A_CHAR = 'A'.charCodeAt(0)
const LOWER_A_CHAR = 'a'.charCodeAt(0)

/**
 * Serializes a node tree straight into a growable Buffer.
 *
 * The encoder used to push every byte into a `number[]`, copy the array into a Buffer at the end,
 * and rebuild ~20 closures for each node it visited. For a group fan-out (hundreds of <to> nodes
 * carrying ciphertext) or a media message with an inline thumbnail that meant hundreds of
 * thousands of array pushes on the send path. One writer per frame turns the byte copies into
 * memcpy calls and keeps the node walk allocation-free apart from the output itself.
 */
class BinaryNodeWriter {
	private buf: Buffer
	private length = 0

	constructor(
		private readonly opts: EncodeOptions,
		initialSize: number
	) {
		this.buf = Buffer.allocUnsafe(initialSize)
	}

	private ensure(extra: number) {
		const needed = this.length + extra
		if (needed <= this.buf.length) {
			return
		}

		let size = this.buf.length * 2
		while (size < needed) {
			size *= 2
		}

		const next = Buffer.allocUnsafe(size)
		this.buf.copy(next, 0, 0, this.length)
		this.buf = next
	}

	pushByte(value: number) {
		this.ensure(1)
		this.buf[this.length++] = value & 0xff
	}

	pushBytes(bytes: Uint8Array | number[]) {
		const n = bytes.length
		this.ensure(n)
		if (Array.isArray(bytes)) {
			for (let i = 0; i < n; i++) {
				this.buf[this.length + i] = bytes[i]! & 0xff
			}
		} else {
			this.buf.set(bytes, this.length)
		}

		this.length += n
	}

	private pushInt(value: number, n: number, littleEndian = false) {
		this.ensure(n)
		for (let i = 0; i < n; i++) {
			const curShift = littleEndian ? i : n - 1 - i
			this.buf[this.length++] = (value >> (curShift * 8)) & 0xff
		}
	}

	private pushInt16(value: number) {
		this.ensure(2)
		this.buf[this.length++] = (value >> 8) & 0xff
		this.buf[this.length++] = value & 0xff
	}

	private pushInt20(value: number) {
		this.ensure(3)
		this.buf[this.length++] = (value >> 16) & 0x0f
		this.buf[this.length++] = (value >> 8) & 0xff
		this.buf[this.length++] = value & 0xff
	}

	private writeByteLength(length: number) {
		const { TAGS } = this.opts
		if (length >= 4294967296) {
			throw new Error('string too large to encode: ' + length)
		}

		if (length >= 1 << 20) {
			this.pushByte(TAGS.BINARY_32)
			this.pushInt(length, 4) // 32 bit integer
		} else if (length >= 256) {
			this.pushByte(TAGS.BINARY_20)
			this.pushInt20(length)
		} else {
			this.pushByte(TAGS.BINARY_8)
			this.pushByte(length)
		}
	}

	private writeStringRaw(str: string) {
		const byteLength = Buffer.byteLength(str, 'utf8')
		this.writeByteLength(byteLength)
		this.ensure(byteLength)
		this.buf.write(str, this.length, byteLength, 'utf8')
		this.length += byteLength
	}

	private writeJid({ domainType, device, user, server }: FullJid) {
		const { TAGS } = this.opts
		if (typeof device !== 'undefined') {
			this.pushByte(TAGS.AD_JID)
			this.pushByte(domainType || 0)
			this.pushByte(device || 0)
			this.writeString(user)
		} else {
			this.pushByte(TAGS.JID_PAIR)
			if (user.length) {
				this.writeString(user)
			} else {
				this.pushByte(TAGS.LIST_EMPTY)
			}

			this.writeString(server)
		}
	}

	private static packNibble(char: string): number {
		switch (char) {
			case '-':
				return 10
			case '.':
				return 11
			case '\0':
				return 15
			default:
				if (char >= '0' && char <= '9') {
					return char.charCodeAt(0) - ZERO_CHAR
				}

				throw new Error(`invalid byte for nibble "${char}"`)
		}
	}

	private static packHex(char: string): number {
		if (char >= '0' && char <= '9') {
			return char.charCodeAt(0) - ZERO_CHAR
		}

		if (char >= 'A' && char <= 'F') {
			return 10 + char.charCodeAt(0) - UPPER_A_CHAR
		}

		if (char >= 'a' && char <= 'f') {
			return 10 + char.charCodeAt(0) - LOWER_A_CHAR
		}

		if (char === '\0') {
			return 15
		}

		throw new Error(`Invalid hex char "${char}"`)
	}

	private writePackedBytes(str: string, type: 'nibble' | 'hex') {
		const { TAGS } = this.opts
		if (str.length > TAGS.PACKED_MAX) {
			throw new Error('Too many bytes to pack')
		}

		this.pushByte(type === 'nibble' ? TAGS.NIBBLE_8 : TAGS.HEX_8)

		let roundedLength = Math.ceil(str.length / 2.0)
		if (str.length % 2 !== 0) {
			roundedLength |= 128
		}

		this.pushByte(roundedLength)
		const pack = type === 'nibble' ? BinaryNodeWriter.packNibble : BinaryNodeWriter.packHex

		const strLengthHalf = Math.floor(str.length / 2)
		this.ensure(strLengthHalf + 1)
		for (let i = 0; i < strLengthHalf; i++) {
			this.buf[this.length++] = (pack(str[2 * i]!) << 4) | pack(str[2 * i + 1]!)
		}

		if (str.length % 2 !== 0) {
			this.buf[this.length++] = (pack(str[str.length - 1]!) << 4) | pack('\x00')
		}
	}

	private isNibble(str: string): boolean {
		if (!str || str.length > this.opts.TAGS.PACKED_MAX) {
			return false
		}

		for (let i = 0; i < str.length; i++) {
			const char = str[i]!
			const isInNibbleRange = char >= '0' && char <= '9'
			if (!isInNibbleRange && char !== '-' && char !== '.') {
				return false
			}
		}

		return true
	}

	private isHex(str: string): boolean {
		if (!str || str.length > this.opts.TAGS.PACKED_MAX) {
			return false
		}

		for (let i = 0; i < str.length; i++) {
			const char = str[i]!
			const isInNibbleRange = char >= '0' && char <= '9'
			if (!isInNibbleRange && !(char >= 'A' && char <= 'F')) {
				return false
			}
		}

		return true
	}

	private writeString(str?: string) {
		const { TAGS, TOKEN_MAP } = this.opts
		if (str === undefined || str === null) {
			this.pushByte(TAGS.LIST_EMPTY)
			return
		}

		if (str === '') {
			this.writeStringRaw(str)
			return
		}

		const tokenIndex = TOKEN_MAP[str]
		if (tokenIndex) {
			if (typeof tokenIndex.dict === 'number') {
				this.pushByte(TAGS.DICTIONARY_0 + tokenIndex.dict)
			}

			this.pushByte(tokenIndex.index)
		} else if (this.isNibble(str)) {
			this.writePackedBytes(str, 'nibble')
		} else if (this.isHex(str)) {
			this.writePackedBytes(str, 'hex')
		} else {
			const decodedJid = jidDecode(str)
			if (decodedJid) {
				this.writeJid(decodedJid)
			} else {
				this.writeStringRaw(str)
			}
		}
	}

	private writeListStart(listSize: number) {
		const { TAGS } = this.opts
		if (listSize === 0) {
			this.pushByte(TAGS.LIST_EMPTY)
		} else if (listSize < 256) {
			this.pushByte(TAGS.LIST_8)
			this.pushByte(listSize)
		} else {
			this.pushByte(TAGS.LIST_16)
			this.pushInt16(listSize)
		}
	}

	writeNode({ tag, attrs, content }: BinaryNode) {
		if (!tag) {
			throw new Error('Invalid node: tag cannot be undefined')
		}

		// attributes set to undefined/null are skipped, so count the survivors before writing the header
		let attributeCount = 0
		if (attrs) {
			for (const key in attrs) {
				const value = attrs[key]
				if (typeof value !== 'undefined' && value !== null) {
					attributeCount++
				}
			}
		}

		this.writeListStart(2 * attributeCount + 1 + (typeof content !== 'undefined' ? 1 : 0))
		this.writeString(tag)

		if (attrs) {
			for (const key in attrs) {
				const value = attrs[key]
				if (typeof value === 'string') {
					this.writeString(key)
					this.writeString(value)
				}
			}
		}

		if (typeof content === 'string') {
			this.writeString(content)
		} else if (Buffer.isBuffer(content) || content instanceof Uint8Array) {
			this.writeByteLength(content.length)
			this.pushBytes(content)
		} else if (Array.isArray(content)) {
			const validContent = content.filter(
				item => item && (item.tag || Buffer.isBuffer(item) || item instanceof Uint8Array || typeof item === 'string')
			)
			this.writeListStart(validContent.length)
			for (const item of validContent) {
				this.writeNode(item)
			}
		} else if (typeof content === 'undefined') {
			// do nothing
		} else {
			throw new Error(`invalid children for header "${tag}": ${content} (${typeof content})`)
		}
	}

	finish(): Buffer {
		return this.buf.subarray(0, this.length)
	}
}

/**
 * Encode a binary node to its wire form.
 * @param prefix bytes emitted before the node; defaults to the single 0x00 "not compressed" marker
 */
export const encodeBinaryNode = (
	node: BinaryNode,
	opts: EncodeOptions = constants,
	prefix: number[] | Uint8Array = [0]
): Buffer => {
	const writer = new BinaryNodeWriter(opts, 1024)
	writer.pushBytes(prefix)
	writer.writeNode(node)
	return writer.finish()
}
