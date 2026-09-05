import {
	areJidsSameUser,
	jidDecode,
	jidEncode,
	jidNormalizedUser,
	transferDevice,
	WAJIDDomains
} from '../../WABinary/jid-utils'

describe('jidDecode', () => {
	it('decodes a plain phone-number jid', () => {
		expect(jidDecode('5511999999999@s.whatsapp.net')).toEqual({
			server: 's.whatsapp.net',
			user: '5511999999999',
			domainType: WAJIDDomains.WHATSAPP,
			device: undefined
		})
	})

	it('decodes device suffixes', () => {
		expect(jidDecode('5511999999999:12@s.whatsapp.net')).toEqual({
			server: 's.whatsapp.net',
			user: '5511999999999',
			domainType: WAJIDDomains.WHATSAPP,
			device: 12
		})
		expect(jidDecode('5511999999999:0@s.whatsapp.net')?.device).toBe(0)
	})

	it('maps lid and hosted servers to their domain types', () => {
		expect(jidDecode('123@lid')?.domainType).toBe(WAJIDDomains.LID)
		expect(jidDecode('123:4@lid')).toEqual({ server: 'lid', user: '123', domainType: WAJIDDomains.LID, device: 4 })
		expect(jidDecode('123:99@hosted')?.domainType).toBe(WAJIDDomains.HOSTED)
		expect(jidDecode('123:99@hosted.lid')?.domainType).toBe(WAJIDDomains.HOSTED_LID)
	})

	it('reads an agent segment as the domain type', () => {
		expect(jidDecode('123_1@s.whatsapp.net')).toEqual({
			server: 's.whatsapp.net',
			user: '123',
			domainType: 1,
			device: undefined
		})
		expect(jidDecode('123_128:5@s.whatsapp.net')).toEqual({
			server: 's.whatsapp.net',
			user: '123',
			domainType: 128,
			device: 5
		})
	})

	it('keeps only the first user, agent and device segments', () => {
		expect(jidDecode('a_1_2:3:4@x')).toEqual({ server: 'x', user: 'a', domainType: 1, device: 3 })
	})

	it('treats empty segments like missing ones', () => {
		expect(jidDecode('123:@s.whatsapp.net')).toEqual({
			server: 's.whatsapp.net',
			user: '123',
			domainType: WAJIDDomains.WHATSAPP,
			device: undefined
		})
		expect(jidDecode('123_@s.whatsapp.net')?.domainType).toBe(WAJIDDomains.WHATSAPP)
		expect(jidDecode('@s.whatsapp.net')).toEqual({
			server: 's.whatsapp.net',
			user: '',
			domainType: WAJIDDomains.WHATSAPP,
			device: undefined
		})
	})

	it('returns undefined for strings without a server', () => {
		expect(jidDecode('5511999999999')).toBeUndefined()
		expect(jidDecode(undefined)).toBeUndefined()
		expect(jidDecode('')).toBeUndefined()
	})

	it('yields NaN for a non-numeric device, like the split-based parser did', () => {
		expect(jidDecode('a:b_c@s')?.device).toBeNaN()
	})
})

describe('jid helpers', () => {
	it('areJidsSameUser compares only the user part', () => {
		expect(areJidsSameUser('123:4@s.whatsapp.net', '123@s.whatsapp.net')).toBe(true)
		expect(areJidsSameUser('123@lid', '123@s.whatsapp.net')).toBe(true)
		expect(areJidsSameUser('123@lid', '124@lid')).toBe(false)
		expect(areJidsSameUser(undefined, undefined)).toBe(true)
	})

	it('jidNormalizedUser strips device and maps c.us', () => {
		expect(jidNormalizedUser('123:4@s.whatsapp.net')).toBe('123@s.whatsapp.net')
		expect(jidNormalizedUser('123@c.us')).toBe('123@s.whatsapp.net')
		expect(jidNormalizedUser('123:2@lid')).toBe('123@lid')
		expect(jidNormalizedUser('nope')).toBe('')
	})

	it('jidEncode and transferDevice compose the expected forms', () => {
		expect(jidEncode('123', 's.whatsapp.net', 0)).toBe('123@s.whatsapp.net')
		expect(jidEncode('123', 'lid', 7)).toBe('123:7@lid')
		expect(jidEncode('123', 's.whatsapp.net', undefined, 2)).toBe('123_2@s.whatsapp.net')
		expect(transferDevice('123:5@s.whatsapp.net', '999@lid')).toBe('999:5@lid')
	})
})
