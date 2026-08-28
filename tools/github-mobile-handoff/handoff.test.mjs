import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { extractDeviceCode, verificationUrl, writeQrPng, writeQrSvg } from './handoff.mjs'

test('extracts a GitHub CLI device code', () => {
  assert.equal(extractDeviceCode('First copy your one-time code: 9abc-7d2e'), '9ABC-7D2E')
  assert.equal(extractDeviceCode('One-time code (ABCD-1234) copied to clipboard'), 'ABCD-1234')
})

test('does not accept malformed codes', () => {
  assert.equal(extractDeviceCode('one-time code: secret-value'), undefined)
})

test('uses GitHub official verification URI', () => {
  assert.equal(verificationUrl, 'https://github.com/login/device')
})

test('renders the verification URI as a local SVG', async () => {
  const output = path.join(tmpdir(), `github-device-login-${process.pid}.svg`)
  try {
    const result = await writeQrSvg(output)
    const svg = await readFile(result, 'utf8')
    assert.match(svg, /^<svg/)
    assert.match(svg, /<rect/)
  } finally {
    await unlink(output).catch(() => {})
  }
})

test('renders the verification URI as a local PNG', async () => {
  const output = path.join(tmpdir(), `github-device-login-${process.pid}.png`)
  try {
    const result = await writeQrPng(output)
    const png = await readFile(result)
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
  } finally {
    await unlink(output).catch(() => {})
  }
})
