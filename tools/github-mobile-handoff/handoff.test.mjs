import assert from 'node:assert/strict'
import test from 'node:test'
import { extractDeviceCode, verificationUrl } from './handoff.mjs'

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
