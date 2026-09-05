import { Boom } from '@hapi/boom'
import { jest } from '@jest/globals'
import P from 'pino'
import type { GroupMetadata } from '../../Types'
import { isRateOverlimitError, makeGroupMetadataCache } from '../../Utils/group-metadata-cache'

const logger = P({ level: 'silent' })

const GROUP = '120363000000000000@g.us'

const metadata = (subject: string, participants = ['1@lid']): GroupMetadata => ({
	id: GROUP,
	owner: undefined,
	subject,
	participants: participants.map(id => ({ id }))
})

/** the exact error assertNodeErrorFree produces for <error code="429" text="rate-overlimit"/> */
const rateOverlimit = () => new Boom('rate-overlimit', { data: 429 })

const tick = () => new Promise(resolve => setImmediate(resolve))

describe('isRateOverlimitError', () => {
	it('matches the server 429 in either form', () => {
		expect(isRateOverlimitError(rateOverlimit())).toBe(true)
		expect(isRateOverlimitError(new Error('rate-overlimit'))).toBe(true)
		expect(isRateOverlimitError(new Boom('forbidden', { data: 403 }))).toBe(false)
		expect(isRateOverlimitError(undefined)).toBe(false)
	})
})

describe('makeGroupMetadataCache', () => {
	it('queries once and serves repeats from the cache', async () => {
		const fetch = jest.fn(async () => metadata('a'))
		const cache = makeGroupMetadataCache({ fetch, logger, ttlSeconds: 60 })

		expect((await cache.get(GROUP)).subject).toBe('a')
		expect((await cache.get(GROUP)).subject).toBe('a')
		expect(fetch).toHaveBeenCalledTimes(1)
		cache.close()
	})

	it('coalesces concurrent requests for the same group into one query', async () => {
		let release: (() => void) | undefined
		const fetch = jest.fn(
			() =>
				new Promise<GroupMetadata>(resolve => {
					release = () => resolve(metadata('a'))
				})
		)
		const cache = makeGroupMetadataCache({ fetch, logger, ttlSeconds: 60 })

		const results = Promise.all([cache.get(GROUP), cache.get(GROUP), cache.get(GROUP, { fresh: true })])
		await tick()
		release!()
		expect((await results).map(m => m.subject)).toEqual(['a', 'a', 'a'])
		expect(fetch).toHaveBeenCalledTimes(1)
		cache.close()
	})

	it('re-queries after invalidate and when fresh is requested', async () => {
		let n = 0
		const fetch = jest.fn(async () => metadata(`v${++n}`))
		const cache = makeGroupMetadataCache({ fetch, logger, ttlSeconds: 60 })

		expect((await cache.get(GROUP)).subject).toBe('v1')
		cache.invalidate(GROUP)
		expect((await cache.get(GROUP)).subject).toBe('v2')
		expect((await cache.get(GROUP, { fresh: true })).subject).toBe('v3')
		expect((await cache.get(GROUP)).subject).toBe('v3')
		expect(fetch).toHaveBeenCalledTimes(3)
		cache.close()
	})

	it('consults the external cache before the built-in one and before querying', async () => {
		const fetch = jest.fn(async () => metadata('server'))
		const external = jest.fn<() => Promise<GroupMetadata | undefined>>(async () => metadata('external'))
		const cache = makeGroupMetadataCache({ fetch, external, logger, ttlSeconds: 60 })

		expect((await cache.get(GROUP)).subject).toBe('external')
		expect(fetch).not.toHaveBeenCalled()

		external.mockImplementation(async () => undefined)
		expect((await cache.get(GROUP)).subject).toBe('server')
		expect(fetch).toHaveBeenCalledTimes(1)
		cache.close()
	})

	it('serves the last known copy when the server rate-limits a refresh', async () => {
		const fetch = jest
			.fn<() => Promise<GroupMetadata>>()
			.mockResolvedValueOnce(metadata('a'))
			.mockRejectedValue(rateOverlimit())
		const cache = makeGroupMetadataCache({ fetch, logger, ttlSeconds: 60, retryDelaysMs: [] })

		expect((await cache.get(GROUP)).subject).toBe('a')
		cache.invalidate(GROUP)
		expect((await cache.get(GROUP)).subject).toBe('a')
		expect(fetch).toHaveBeenCalledTimes(2)
		// the fallback is cached again, so the rate-limited server is left alone for a while
		expect((await cache.get(GROUP)).subject).toBe('a')
		expect(fetch).toHaveBeenCalledTimes(2)
		cache.close()
	})

	it('retries a rate-limited query when there is nothing to fall back on, then gives up', async () => {
		const fetch = jest
			.fn<() => Promise<GroupMetadata>>()
			.mockRejectedValueOnce(rateOverlimit())
			.mockResolvedValueOnce(metadata('late'))
			.mockRejectedValue(rateOverlimit())
		const cache = makeGroupMetadataCache({ fetch, logger, ttlSeconds: 60, retryDelaysMs: [1, 1] })

		expect((await cache.get(GROUP)).subject).toBe('late')
		expect(fetch).toHaveBeenCalledTimes(2)

		const other = '120363000000000001@g.us'
		await expect(cache.get(other)).rejects.toThrow('rate-overlimit')
		// first attempt plus one per configured delay
		expect(fetch).toHaveBeenCalledTimes(2 + 3)
		cache.close()
	})

	it('does not retry or mask other errors', async () => {
		const fetch = jest.fn<() => Promise<GroupMetadata>>().mockRejectedValue(new Boom('forbidden', { data: 403 }))
		const cache = makeGroupMetadataCache({ fetch, logger, ttlSeconds: 60 })

		await expect(cache.get(GROUP)).rejects.toThrow('forbidden')
		expect(fetch).toHaveBeenCalledTimes(1)
		cache.close()
	})

	it('remember() seeds the cache from a full snapshot', async () => {
		const fetch = jest.fn(async () => metadata('server'))
		const cache = makeGroupMetadataCache({ fetch, logger, ttlSeconds: 60 })

		cache.remember(metadata('snapshot'))
		expect((await cache.get(GROUP)).subject).toBe('snapshot')
		expect(cache.peek(GROUP)?.subject).toBe('snapshot')
		expect(fetch).not.toHaveBeenCalled()
		cache.close()
	})
})
