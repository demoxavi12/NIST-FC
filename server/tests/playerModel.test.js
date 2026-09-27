import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import Player, { PLAYER_POSITIONS, PLAYER_STATUSES } from '../src/models/Player.js'

const VALID = {
  name: 'Rahul Das',
  slug: 'rahul-das',
  photo: { url: 'https://res.cloudinary.com/demo/image/upload/x.jpg', publicId: 'nist-fc/players/x' },
  position: 'Midfielder',
  batch: '2023-2027',
  branch: 'CSE',
}

async function errorsFor(fields) {
  try {
    await new Player(fields).validate()
  } catch (error) {
    return error.errors
  }
  return {}
}

describe('Player model', () => {
  it('uses the players collection and the documented fields', () => {
    assert.equal(Player.collection.collectionName, 'players')
    for (const path of ['name', 'slug', 'photo', 'position', 'batch', 'branch', 'bio', 'status', 'createdAt', 'updatedAt']) {
      assert.ok(Player.schema.path(path), path)
    }
    assert.equal(Player.schema.path('memories'), undefined, 'memories live on Memory.players')
    assert.equal(Player.schema.path('batch').instance, 'String')
  })

  it('accepts a valid player and defaults status to current', async () => {
    const player = new Player({ ...VALID, name: '  Rahul Das ' })
    await player.validate()
    assert.equal(player.status, 'current')
    assert.equal(player.name, 'Rahul Das')
  })

  it('requires the documented fields', async () => {
    const errors = await errorsFor({})
    assert.deepEqual(
      Object.keys(errors).sort(),
      ['batch', 'branch', 'name', 'photo', 'position', 'slug'],
    )
  })

  it('requires both photo url and publicId', async () => {
    const errors = await errorsFor({ ...VALID, photo: { url: 'https://x' } })
    assert.ok(errors['photo.publicId'])
  })

  it('validates batch as YYYY-YYYY with the second year after the first', async () => {
    for (const batch of ['2023-2027', '2024-2028', ' 2025-2029 ']) {
      assert.equal((await errorsFor({ ...VALID, batch })).batch, undefined, batch)
    }
    for (const batch of ['2023', '2023-27', '2027-2023', '2023-2023', '2023 - 2027', 'abcd-efgh']) {
      assert.ok((await errorsFor({ ...VALID, batch })).batch, batch)
    }
  })

  it('restricts position and status', async () => {
    assert.deepEqual(PLAYER_POSITIONS, ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'])
    assert.deepEqual(PLAYER_STATUSES, ['current', 'former'])
    assert.ok((await errorsFor({ ...VALID, position: 'Striker' })).position)
    assert.ok((await errorsFor({ ...VALID, status: 'retired' })).status)
  })

  it('declares the documented indexes', () => {
    const indexed = (path) => Boolean(Player.schema.path(path).options.index)
    assert.equal(Player.schema.path('slug').options.unique, true)
    for (const path of ['name', 'status', 'position', 'batch', 'branch']) {
      assert.ok(indexed(path), path)
    }
  })
})
