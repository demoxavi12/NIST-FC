import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { escapeRegExp, slugify } from '../src/utils/slugify.js'

describe('slugify', () => {
  it('creates URL-friendly slugs', () => {
    assert.equal(slugify('Rahul Das'), 'rahul-das')
    assert.equal(slugify('  Arjun   Kumar  '), 'arjun-kumar')
    assert.equal(slugify('José Álvarez'), 'jose-alvarez')
    assert.equal(slugify("D'Souza, Jr."), 'd-souza-jr')
    assert.equal(slugify('Player #10'), 'player-10')
  })

  it('falls back when nothing usable remains', () => {
    assert.equal(slugify('!!!', 'player'), 'player')
    assert.equal(slugify('日本語', 'player'), 'player')
  })

  it('limits length without a trailing dash', () => {
    const slug = slugify(`${'a'.repeat(79)} b`)
    assert.ok(slug.length <= 80)
    assert.ok(!slug.endsWith('-'))
  })
})

describe('escapeRegExp', () => {
  it('escapes every regular-expression special character', () => {
    const special = '.*+?^${}()|[]\\'
    assert.ok(new RegExp(escapeRegExp(special)).test(special))
    assert.equal(escapeRegExp('a.b'), 'a\\.b')
  })
})
