import { Boom } from '@hapi/boom';
import { exec } from 'child_process';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { prepareWAMessageMedia } from '../Utils/messages.js';
import { parseMoovBox } from '../Utils/video-metadata.js';
import { extractInlineEntities } from './inline-entities.js';
/** Uploading against a newsletter jid keeps the media unencrypted, which is what yields a plain URL. */
const NEWSLETTER_UPLOAD_JID = '@newsletter';
const BOX_HEADER_SIZE = 8;
/** Same fallback `prepareWAMessageMedia` applies when a document carries no mimetype. */
const DOCUMENT_MIMETYPE = 'application/pdf';
const URL_PATTERN = /^https?:\/\/.+/i;
const WA_URL_PATTERN = /^https?:\/\/[^/]*\.whatsapp\.net\//i;
let cachedSharp;
let sharpLoaded = false;
const loadSharp = async () => {
    if (sharpLoaded) {
        return cachedSharp;
    }
    sharpLoaded = true;
    try {
        const specifier = 'sharp';
        const loaded = await import(specifier);
        const factory = loaded?.default ?? loaded;
        cachedSharp = typeof factory === 'function' ? factory : undefined;
    }
    catch {
        cachedSharp = undefined;
    }
    return cachedSharp;
};
const runFfmpeg = (args) => new Promise((resolve, reject) => {
    exec(`ffmpeg ${args}`, err => (err ? reject(err) : resolve()));
});
const isPromiseLike = (value) => !!value && typeof value.then === 'function';
const deepResolve = async (value) => {
    if (isPromiseLike(value)) {
        return deepResolve(await value);
    }
    if (Buffer.isBuffer(value)) {
        return value;
    }
    if (Array.isArray(value)) {
        return Promise.all(value.map(deepResolve));
    }
    if (value && typeof value === 'object') {
        const entries = await Promise.all(Object.entries(value).map(async ([key, entry]) => [key, await deepResolve(entry)]));
        return Object.fromEntries(entries);
    }
    return value;
};
/**
 * Media, text and container helpers shared by the builders.
 *
 * Everything here is static — `Toolkit` is a namespace, not something to instantiate.
 */
export class Toolkit {
    static extractIE(text, options = {}) {
        return extractInlineEntities(text, options);
    }
    static async resize(buffer, width, height, fit = 'cover') {
        const sharp = await loadSharp();
        if (!sharp) {
            throw new Boom('sharp is required to resize media, install it to use this builder', { statusCode: 501 });
        }
        return sharp(buffer)
            .resize(width, height, {
            fit,
            position: 'center',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
            .png()
            .toBuffer();
    }
    /** Deeply awaits every promise nested inside `input`, preserving its shape. */
    static async waitAllPromises(input) {
        return (await deepResolve(input));
    }
    static async fetchBuffer(url, options = {}, { silent = true } = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Boom(`Failed to fetch media: HTTP ${response.status}`, { statusCode: response.status });
            }
            return Buffer.from(await response.arrayBuffer());
        }
        catch (error) {
            if (silent) {
                return Buffer.alloc(0);
            }
            throw error;
        }
    }
    /** Uploads a buffer or url to WhatsApp and hands back the public media url. */
    static async toUrl(client, path, mediaType = 'document') {
        if (!path) {
            throw new Boom('Url or buffer needed', { statusCode: 400 });
        }
        const upload = Buffer.isBuffer(path) ? path : { url: path };
        const content = mediaType === 'image'
            ? { image: upload }
            : mediaType === 'video'
                ? { video: upload }
                : mediaType === 'ptv'
                    ? { video: upload, ptv: true }
                    : mediaType === 'audio'
                        ? { audio: upload }
                        : mediaType === 'sticker'
                            ? { sticker: upload }
                            : { document: upload, mimetype: DOCUMENT_MIMETYPE };
        const media = await prepareWAMessageMedia(content, {
            upload: client.waUploadToServer,
            jid: NEWSLETTER_UPLOAD_JID
        });
        const uploaded = Object.values(media)[0];
        return uploaded?.url ?? undefined;
    }
    static async resolveMedia(client, media, mediaType = 'image', { resolveUrl = false, resolveWAUrl = false, result = 'url', resize = false, width = 300, height = 300 } = {}) {
        if (Array.isArray(media)) {
            return Promise.all(media.map(item => Toolkit.resolveMedia(client, item, mediaType, {
                resolveUrl,
                resolveWAUrl,
                result,
                resize,
                width,
                height
            })));
        }
        let resolved = media;
        if (typeof resolved === 'string' && URL_PATTERN.test(resolved)) {
            const keepAsUrl = WA_URL_PATTERN.test(resolved) ? !resolveWAUrl && !resolveUrl : !resolveUrl;
            if (keepAsUrl && result === 'url') {
                return resolved;
            }
            resolved = await Toolkit.fetchBuffer(resolved);
        }
        if (typeof resolved === 'string') {
            resolved = Buffer.from(resolved, 'base64');
        }
        if (!Buffer.isBuffer(resolved) || !resolved.length) {
            return undefined;
        }
        if (resize) {
            resolved = await Toolkit.resize(resolved, width, height);
        }
        if (result === 'buffer') {
            return resolved;
        }
        if (result === 'base64') {
            return resolved.toString('base64');
        }
        return Toolkit.toUrl(client, resolved, mediaType);
    }
    /** Duration in seconds, read straight out of the MP4 container. */
    static getMp4Duration(buffer, { silent = true } = {}) {
        const fail = (message) => {
            if (silent) {
                return 0;
            }
            throw new Boom(message, { statusCode: 400 });
        };
        if (!Buffer.isBuffer(buffer) || buffer.length < BOX_HEADER_SIZE) {
            return fail('Invalid buffer');
        }
        let offset = 0;
        while (offset + BOX_HEADER_SIZE <= buffer.length) {
            let size = buffer.readUInt32BE(offset);
            const type = buffer.toString('latin1', offset + 4, offset + 8);
            let headerSize = BOX_HEADER_SIZE;
            if (size === 1) {
                if (offset + 16 > buffer.length) {
                    return fail('Invalid atom size');
                }
                const largeSize = buffer.readBigUInt64BE(offset + 8);
                if (largeSize > BigInt(Number.MAX_SAFE_INTEGER)) {
                    return fail('Invalid atom size');
                }
                size = Number(largeSize);
                headerSize = 16;
            }
            else if (size === 0) {
                size = buffer.length - offset;
            }
            if (size < headerSize || offset + size > buffer.length) {
                return fail('Invalid atom size');
            }
            if (type === 'moov') {
                const seconds = parseMoovBox(buffer.subarray(offset + headerSize, offset + size)).seconds;
                return seconds ?? fail('No mvhd found');
            }
            offset += size;
        }
        return fail('No moov found');
    }
    static async getMp4Preview(videoBuffer, { time, result = 'buffer', resize = true, width = 300, height = 300, silent = true } = {}) {
        const empty = () => (result === 'base64' ? '' : Buffer.alloc(0));
        const fail = (error) => {
            if (silent) {
                return empty();
            }
            throw error;
        };
        if (!Buffer.isBuffer(videoBuffer) || !videoBuffer.length) {
            return fail(new Boom('videoBuffer is empty or not a buffer', { statusCode: 400 }));
        }
        const id = randomUUID();
        const inputPath = join(tmpdir(), `${id}.mp4`);
        const outputPath = join(tmpdir(), `${id}.png`);
        try {
            await fs.writeFile(inputPath, videoBuffer);
            const at = time ?? Math.min(Toolkit.getMp4Duration(videoBuffer) * 0.2, 10);
            await runFfmpeg(`-ss ${at} -i "${inputPath}" -y -vframes 1 -vcodec png -f image2 "${outputPath}"`);
            let output = await fs.readFile(outputPath);
            if (!output.length) {
                return fail(new Boom('ffmpeg produced no frame, check the format or the timestamp', { statusCode: 400 }));
            }
            if (resize) {
                output = await Toolkit.resize(output, width, height);
            }
            return result === 'base64' ? output.toString('base64') : output;
        }
        catch (error) {
            return fail(error);
        }
        finally {
            await fs.unlink(inputPath).catch(() => { });
            await fs.unlink(outputPath).catch(() => { });
        }
    }
    /** JSON with every non-ASCII character escaped, the way the rich renderer expects its payload. */
    static stringifyEscaped(obj) {
        return JSON.stringify(obj).replace(/[\u007f-\uffff]/g, character => '\\u' + character.charCodeAt(0).toString(16).padStart(4, '0'));
    }
}
//# sourceMappingURL=toolkit.js.map