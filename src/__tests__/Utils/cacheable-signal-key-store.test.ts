import { jest } from '@jest/globals'
import P from 'pino'
import type { SignalKeyStore } from '../../Types'
import { makeCacheableSignalKeyStore } from '../../Utils/auth-utils'

const logger = P({ level: 'silent' })

const makeStore = () => {
	const backing: Record<string, Record<string, unknown>> = {
		session: { a: Buffer.from('session-a'), b: Buffer.from('session-b') }
	}
	const get = jest.fn(async (type: string, ids: string[]) => {
		const out: Record<string, unknown> = {}
		for (const id of ids) {
			if (backing[type]?.[id]) out[id] = backing[type]![id]
		}

		return out
	})
	const set = jest.fn(async () => {})
	return { store: { get, set } as unknown as SignalKeyStore, get, set }
}

describe('makeCacheableSignalKeyStore', () => {
	it('reads through to the store once and serves repeats from the cache', async () => {
		const { store, get } = makeStore()
		const cached = makeCacheableSignalKeyStore(store, logger)

		expect(await cached.get('session', ['a'])).toEqual({ a: Buffer.from('session-a') })
		expect(await cached.get('session', ['a'])).toEqual({ a: Buffer.from('session-a') })
		expect(get).toHaveBeenCalledTimes(1)
	})

	it('only fetches the ids that missed the cache', async () => {
		const { store, get } = makeStore()
		const cached = makeCacheableSignalKeyStore(store, logger)

		await cached.get('session', ['a'])
		await cached.get('session', ['a', 'b'])
		expect(get).toHaveBeenCalledTimes(2)
		expect(get).toHaveBeenLastCalledWith('session', ['b'])
	})

	it('does not cache ids the store does not have', async () => {
		const { store, get } = makeStore()
		const cached = makeCacheableSignalKeyStore(store, logger)

		expect(await cached.get('session', ['missing'])).toEqual({})
		expect(await cached.get('session', ['missing'])).toEqual({})
		expect(get).toHaveBeenCalledTimes(2)
	})

	it('answers cache hits while another caller is blocked on a slow store read', async () => {
		const { store, get } = makeStore()
		let releaseSlowRead: (() => void) | undefined
		get.mockImplementationOnce(async () => ({ a: Buffer.from('session-a') }))
		get.mockImplementationOnce(
			() =>
				new Promise(resolve => {
					releaseSlowRead = () => resolve({ b: Buffer.from('session-b') })
				})
		)
		const cached = makeCacheableSignalKeyStore(store, logger)

		await cached.get('session', ['a'])
		const slow = cached.get('session', ['b'])

		const fast = await Promise.race([
			cached.get('session', ['a']),
			new Promise<'blocked'>(resolve => setTimeout(() => resolve('blocked'), 200))
		])
		expect(fast).toEqual({ a: Buffer.from('session-a') })

		releaseSlowRead!()
		expect(await slow).toEqual({ b: Buffer.from('session-b') })
	})

	it('writes update the cache and the store', async () => {
		const { store, get, set } = makeStore()
		const cached = makeCacheableSignalKeyStore(store, logger)

		await cached.set({ session: { c: Buffer.from('session-c') } })
		expect(set).toHaveBeenCalledTimes(1)
		expect(await cached.get('session', ['c'])).toEqual({ c: Buffer.from('session-c') })
		expect(get).not.toHaveBeenCalled()
	})
})
