import { jest } from '@jest/globals'
import P from 'pino'
import { makeLibSignalRepository } from '../../Signal/libsignal'
import type { SignalDataTypeMap, SignalKeyStoreWithTransaction } from '../../Types'
import { initAuthCreds } from '../../Utils/auth-utils'

const logger = P({ level: 'silent' })

const makeKeys = (deviceLists: Record<string, string[]>) => {
	const get = jest.fn(async (type: keyof SignalDataTypeMap, ids: string[]) => {
		const out: Record<string, unknown> = {}
		if (type === 'device-list') {
			for (const id of ids) {
				if (deviceLists[id]) out[id] = deviceLists[id]
			}
		}

		return out
	})
	const keys = {
		get,
		set: jest.fn(async () => {}),
		transaction: jest.fn(async (work: () => unknown) => work()),
		isInTransaction: jest.fn(() => false)
	} as unknown as SignalKeyStoreWithTransaction
	return { keys, get }
}

const readsOf = (get: { mock: { calls: unknown[][] } }, type: string) =>
	get.mock.calls.filter(([t]) => t === type).length

describe('migrateSession memo', () => {
	it('reads the device list and sessions only once per user', async () => {
		const { keys, get } = makeKeys({ '5511999999999': ['0', '3'] })
		const repo = makeLibSignalRepository({ creds: initAuthCreds(), keys }, logger)

		await repo.migrateSession('5511999999999@s.whatsapp.net', '123456789012345@lid')
		expect(readsOf(get, 'device-list')).toBe(1)
		expect(readsOf(get, 'session')).toBe(1)

		for (let i = 0; i < 5; i++) {
			await repo.migrateSession('5511999999999:3@s.whatsapp.net', '123456789012345@lid')
		}

		expect(readsOf(get, 'device-list')).toBe(1)
		expect(readsOf(get, 'session')).toBe(1)
	})

	it('remembers a user without a stored device list too', async () => {
		const { keys, get } = makeKeys({})
		const repo = makeLibSignalRepository({ creds: initAuthCreds(), keys }, logger)

		await repo.migrateSession('5511888888888@s.whatsapp.net', '223456789012345@lid')
		await repo.migrateSession('5511888888888@s.whatsapp.net', '223456789012345@lid')
		expect(readsOf(get, 'device-list')).toBe(1)
	})

	it('keeps users independent', async () => {
		const { keys, get } = makeKeys({ a1: ['0'], a2: ['0'] })
		const repo = makeLibSignalRepository({ creds: initAuthCreds(), keys }, logger)

		await repo.migrateSession('a1@s.whatsapp.net', '1@lid')
		await repo.migrateSession('a2@s.whatsapp.net', '2@lid')
		expect(readsOf(get, 'device-list')).toBe(2)
	})

	it('forgets everything on close', async () => {
		const { keys, get } = makeKeys({ a1: ['0'] })
		const repo = makeLibSignalRepository({ creds: initAuthCreds(), keys }, logger)

		await repo.migrateSession('a1@s.whatsapp.net', '1@lid')
		repo.close?.()
		await repo.migrateSession('a1@s.whatsapp.net', '1@lid')
		expect(readsOf(get, 'device-list')).toBe(2)
	})
})
