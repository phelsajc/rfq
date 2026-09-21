/**
 * Generates simple solid PNGs for PWA icons (no extra deps).
 */
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(size, rgb) {
  const [r, g, b] = rgb
  const row = Buffer.alloc(1 + size * 3)
  const raw = Buffer.alloc((1 + size * 3) * size)
  for (let y = 0; y < size; y++) {
    row[0] = 0
    for (let x = 0; x < size; x++) {
      const i = 1 + x * 3
      row[i] = r
      row[i + 1] = g
      row[i + 2] = b
    }
    row.copy(raw, y * row.length)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const color = [15, 61, 46]
writeFileSync(join(publicDir, 'pwa-192.png'), png(192, color))
writeFileSync(join(publicDir, 'pwa-512.png'), png(512, color))
writeFileSync(join(publicDir, 'apple-touch-icon.png'), png(180, color))
console.log('PWA icons written to public/')
