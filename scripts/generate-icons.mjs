#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const targets = [
  { src: 'public/brand/favicon.svg', out: 'src/app/icon.png', size: 32 },
  { src: 'public/brand/app-icon.svg', out: 'src/app/apple-icon.png', size: 180 },
]

for (const t of targets) {
  const svg = await readFile(resolve(root, t.src))
  const outPath = resolve(root, t.out)
  await mkdir(dirname(outPath), { recursive: true })
  await sharp(svg, { density: 384 }).resize(t.size, t.size).png().toFile(outPath)
  console.log(`✓ ${t.out} (${t.size}×${t.size})`)
}
