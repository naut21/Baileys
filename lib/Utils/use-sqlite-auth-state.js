import { createRequire } from 'module';
import { proto } from '../../WAProto/index.js';
import { initAuthCreds } from './auth-utils.js';
import { BufferJSON } from './generics.js';
const CREDS_ID = 'creds';
export const useSQLiteAuthState = (path) => {
    const require = createRequire(import.meta.url);
    const Database = require('better-sqlite3');
    const db = new Database(path);
    db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; CREATE TABLE IF NOT EXISTS auth (id TEXT PRIMARY KEY, data BLOB NOT NULL) WITHOUT ROWID');
    const selectStmt = db.prepare('SELECT data FROM auth WHERE id = ?').pluck();
    const upsertStmt = db.prepare('INSERT INTO auth (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data');
    const deleteStmt = db.prepare('DELETE FROM auth WHERE id = ?');
    const read = (id) => {
        const data = selectStmt.get(id);
        return typeof data === 'string' ? JSON.parse(data, BufferJSON.reviver) : data;
    };
    const write = (id, value) => {
        upsertStmt.run(id, value instanceof Uint8Array ? value : JSON.stringify(value, BufferJSON.replacer));
    };
    const commit = db.transaction((data) => {
        for (const type in data) {
            const category = data[type];
            for (const id in category) {
                const value = category[id];
                if (value) {
                    write(`${type}-${id}`, value);
                }
                else {
                    deleteStmt.run(`${type}-${id}`);
                }
            }
        }
    });
    const creds = read(CREDS_ID) || initAuthCreds();
    return {
        state: {
            creds,
            keys: {
                get: (type, ids) => {
                    const data = {};
                    for (const id of ids) {
                        const value = read(`${type}-${id}`);
                        if (value === undefined) {
                            continue;
                        }
                        data[id] =
                            type === 'app-state-sync-key'
                                ? proto.Message.AppStateSyncKeyData.fromObject(value)
                                : value;
                    }
                    return data;
                },
                set: data => commit(data)
            }
        },
        saveCreds: () => write(CREDS_ID, creds),
        close: () => db.close()
    };
};
//# sourceMappingURL=use-sqlite-auth-state.js.map