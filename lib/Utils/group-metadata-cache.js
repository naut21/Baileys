import NodeCache from '@cacheable/node-cache';
import { delay } from './generics.js';
/**
 * The server answers `<error code="429" text="rate-overlimit"/>` when a client sends too many
 * queries of one kind in a short window. `assertNodeErrorFree` surfaces that as a Boom whose
 * `data` is the numeric code and whose message is the text.
 */
export const isRateOverlimitError = (err) => {
    const boom = err;
    return boom?.data === 429 || boom?.message === 'rate-overlimit';
};
/**
 * Group metadata is needed on every group send (participant list, addressing mode, ephemeral
 * setting) and most bots also read it on every incoming group message to check admin status.
 * Issuing the w:g2 query each time trips WhatsApp's rate limit within minutes and adds a server
 * round trip to every message, so one cache sits in front of the query:
 *
 * - entries live for `ttlSeconds` and are dropped by the socket on group events, so a participant
 *   added between sends is never missed
 * - concurrent requests for one group share a single query
 * - when the server does rate-limit us, the last copy we ever fetched is served instead of failing,
 *   and only if there is none do we wait and retry
 */
export const makeGroupMetadataCache = ({ fetch, external, logger, ttlSeconds, retryDelaysMs = [1000, 2500] }) => {
    const cache = new NodeCache({ stdTTL: ttlSeconds, useClones: false });
    /** last successful fetch per group, never expires; only used when the server refuses a refresh */
    const lastKnown = new Map();
    const inflight = new Map();
    const remember = (metadata) => {
        cache.set(metadata.id, metadata);
        lastKnown.set(metadata.id, metadata);
    };
    const fetchHandlingRateLimit = async (jid) => {
        for (let attempt = 0;; attempt++) {
            try {
                return await fetch(jid);
            }
            catch (err) {
                if (!isRateOverlimitError(err)) {
                    throw err;
                }
                const fallback = lastKnown.get(jid);
                if (fallback) {
                    logger.warn({ jid }, 'group metadata query rate limited, serving last known copy');
                    return fallback;
                }
                const wait = retryDelaysMs[attempt];
                if (wait === undefined) {
                    throw err;
                }
                logger.warn({ jid, attempt, wait }, 'group metadata query rate limited, retrying');
                await delay(wait);
            }
        }
    };
    const get = async (jid, { fresh = false } = {}) => {
        if (!fresh) {
            const fromExternal = external ? await external(jid) : undefined;
            if (fromExternal && Array.isArray(fromExternal.participants)) {
                return fromExternal;
            }
            const cached = cache.get(jid);
            if (cached) {
                return cached;
            }
        }
        const pending = inflight.get(jid);
        if (pending) {
            return pending;
        }
        const promise = fetchHandlingRateLimit(jid)
            .then(metadata => {
            remember(metadata);
            return metadata;
        })
            .finally(() => {
            inflight.delete(jid);
        });
        inflight.set(jid, promise);
        return promise;
    };
    return {
        get,
        /** store a copy obtained elsewhere (e.g. a full groups.update) */
        remember,
        /** drop the cached copy so the next read asks the server; the last known copy is kept for rate-limit fallback */
        invalidate: (jid) => {
            cache.del(jid);
        },
        /** cached copy without touching the server, if any */
        peek: (jid) => cache.get(jid),
        close: () => {
            cache.close();
            lastKnown.clear();
            inflight.clear();
        }
    };
};
//# sourceMappingURL=group-metadata-cache.js.map