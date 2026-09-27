import JoiBase from 'joi'
import { MAX_GALLERY_PHOTOS, MAX_TAGS } from '../models/Memory.js'

/**
 * Joi with arrays that also accept a JSON-encoded string, because multipart
 * forms can only send text: players='["id1","id2"]' (docs/API.md §13).
 */
const Joi = JoiBase.extend({
  type: 'array',
  base: JoiBase.array(),
  messages: { 'array.json': '{{#label}} must be a JSON array' },
  coerce: {
    from: 'string',
    method(value, helpers) {
      try {
        return { value: JSON.parse(value) }
      } catch {
        return { errors: [helpers.error('array.json')] }
      }
    },
  },
})

export const DEFAULT_PUBLIC_PAGE_SIZE = 12
export const DEFAULT_ADMIN_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 48
const MAX_PLAYERS = 100
const OBJECT_ID = /^[a-f0-9]{24}$/i
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

const dedupe = (values) => [...new Set(values)]

/**
 * A calendar day "YYYY-MM-DD" → that day at 00:00 UTC. Impossible dates such
 * as 2025-02-30 are rejected.
 */
const dateField = JoiBase.string()
  .trim()
  .custom((value, helpers) => {
    const match = DATE_PATTERN.exec(value)
    if (!match) return helpers.error('date.format')
    const [, year, month, day] = match.map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return helpers.error('date.format')
    }
    return date
  })
  .messages({
    'string.base': 'Date must be text in the format YYYY-MM-DD',
    'string.empty': 'Date is required',
    'date.format': 'Date must be a valid date in the format YYYY-MM-DD',
  })

const memoryFields = {
  title: JoiBase.string().trim().min(1).max(150).messages({
    'string.base': 'Title must be text',
    'string.empty': 'Title is required',
    'string.max': 'Title must be at most 150 characters',
  }),
  description: JoiBase.string().trim().allow('').max(5000).messages({
    'string.base': 'Description must be text',
    'string.max': 'Description must be at most 5000 characters',
  }),
  date: dateField,
  location: JoiBase.string().trim().allow('').max(150).messages({
    'string.base': 'Location must be text',
    'string.max': 'Location must be at most 150 characters',
  }),
  players: Joi.array()
    .items(JoiBase.string().pattern(OBJECT_ID).messages({ 'string.pattern.base': 'Invalid player id' }))
    .max(MAX_PLAYERS)
    .custom(dedupe)
    .messages({
      'array.base': 'Players must be a list of player ids',
      'array.max': `A memory can link at most ${MAX_PLAYERS} players`,
    }),
  tags: Joi.array()
    .items(
      JoiBase.string().trim().lowercase().min(1).max(30).messages({
        'string.empty': 'Tags cannot be empty',
        'string.max': 'Each tag must be at most 30 characters',
      }),
    )
    .custom(dedupe)
    .max(MAX_TAGS)
    .messages({
      'array.base': 'Tags must be a list',
      'array.max': `A memory can have at most ${MAX_TAGS} tags`,
    }),
  published: JoiBase.boolean().messages({ 'boolean.base': 'Published must be true or false' }),
}

const bodyMessages = { 'object.base': 'Request body must be an object' }

/** POST /api/memories fields (the cover file is checked by requireCoverImage). */
export const createMemorySchema = JoiBase.object({
  ...memoryFields,
  title: memoryFields.title.required().messages({ 'any.required': 'Title is required' }),
  date: memoryFields.date.required().messages({ 'any.required': 'Date is required' }),
  players: memoryFields.players.default([]),
  tags: memoryFields.tags.default([]),
  // New memories are drafts until published.
  published: memoryFields.published.default(false),
}).messages(bodyMessages)

/**
 * PATCH /api/memories/:id — only supplied fields change. `removePhotos` lists
 * gallery photo publicIds to remove; `expectedUpdatedAt` is the `updatedAt`
 * the admin's form was loaded with, so stale edits are rejected with 409.
 */
export const updateMemorySchema = JoiBase.object({
  ...memoryFields,
  removePhotos: Joi.array()
    .items(JoiBase.string().min(1))
    .max(MAX_GALLERY_PHOTOS)
    .custom(dedupe)
    .messages({ 'array.base': 'removePhotos must be a list of photo ids' }),
  expectedUpdatedAt: JoiBase.date().iso().messages({
    'date.base': 'expectedUpdatedAt must be an ISO date',
    'date.format': 'expectedUpdatedAt must be an ISO date',
  }),
}).messages(bodyMessages)

const pageField = JoiBase.number().integer().min(1).default(1).messages({
  'number.base': 'Page must be a whole number of at least 1',
  'number.integer': 'Page must be a whole number of at least 1',
  'number.min': 'Page must be a whole number of at least 1',
})
const limitField = (defaultValue) =>
  JoiBase.number()
    .integer()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(defaultValue)
    .messages({
      'number.base': `Limit must be a whole number from 1 to ${MAX_PAGE_SIZE}`,
      'number.integer': `Limit must be a whole number from 1 to ${MAX_PAGE_SIZE}`,
      'number.min': `Limit must be a whole number from 1 to ${MAX_PAGE_SIZE}`,
      'number.max': `Limit must be a whole number from 1 to ${MAX_PAGE_SIZE}`,
    })

/** GET /api/memories (docs/API.md §12). */
export const listMemoriesQuerySchema = JoiBase.object({
  page: pageField,
  limit: limitField(DEFAULT_PUBLIC_PAGE_SIZE),
  tag: JoiBase.string().trim().lowercase().max(30).allow('').messages({
    'string.base': 'Tag must be text',
    'string.max': 'Tag must be at most 30 characters',
  }),
  player: JoiBase.string().pattern(OBJECT_ID).allow('').messages({
    'string.pattern.base': 'Invalid player id',
  }),
})

/** GET /api/admin/memories: drafts included. */
export const adminListMemoriesQuerySchema = JoiBase.object({
  page: pageField,
  limit: limitField(DEFAULT_ADMIN_PAGE_SIZE),
  search: JoiBase.string().trim().max(100).allow('').messages({
    'string.max': 'Search must be at most 100 characters',
  }),
  published: JoiBase.boolean().messages({ 'boolean.base': 'Published must be true or false' }),
})

/** :id route parameter. */
export const memoryIdParamSchema = JoiBase.object({
  id: JoiBase.string().pattern(OBJECT_ID).required().messages({
    'string.pattern.base': 'Invalid memory id',
    'any.required': 'Invalid memory id',
  }),
})
