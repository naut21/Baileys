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
 * - when the server does rate-limit us, a recent copy (at most `lastKnownMaxAgeMs` old) is served
 *   instead of failing, and only if there is none do we wait and retry
 * - change events drop the rate-limit fallback too, so stale snapshots (old admin lists, old
 *   participant sets) are never served after a real mutation
 */
export const makeGroupMetadataCache = ({ fetch, external, logger, ttlSeconds, retryDelaysMs = [1000, 2500], lastKnownMaxAgeMs = ttlSeconds * 2 * 1000 }) => {
    const cache = new NodeCache({ stdTTL: ttlSeconds, useClones: false });
    /**
     * Last successful fetch per group, kept only as a rate-limit fallback.
     * Each copy carries its fetch time so it is never served once it goes stale
     * (helpers on the send path, admin checks, or encryption targeting must not
     * run against group data older than this window).
     */
    const lastKnown = new Map();
    /** keep the rate-limit fallback map bounded so a large group count cannot grow memory without limit */
    const MAX_LAST_KNOWN = 1024;
    const inflight = new Map();
    const remember = (metadata) => {
        cache.set(metadata.id, metadata);
        lastKnown.set(metadata.id, { metadata, fetchedAt: Date.now() });
        if (lastKnown.size > MAX_LAST_KNOWN) {
            // evict the oldest entry (Map preserves insertion order)
            lastKnown.delete(lastKnown.keys().next().value);
        }
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
                const known = lastKnown.get(jid);
                if (known && Date.now() - known.fetchedAt <= lastKnownMaxAgeMs) {
                    logger.warn({ jid }, 'group metadata query rate limited, serving last known copy');
                    return known.metadata;
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
        /** drop the cached copy so the next read asks the server; on a change event the stored
         *  snapshot is known-stale, so the rate-limit fallback is dropped alongside it instead of
         *  risking messages encrypted/targeted against outdated participants or admin lists */
        invalidate: (jid) => {
            cache.del(jid);
            lastKnown.delete(jid);
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