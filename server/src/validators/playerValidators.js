import Joi from 'joi'
import { BATCH_PATTERN, PLAYER_POSITIONS, PLAYER_STATUSES } from '../models/Player.js'

export const PLAYER_SORTS = ['name', '-name', 'batch', '-batch']
export const DEFAULT_PAGE_SIZE = 12
export const MAX_PAGE_SIZE = 48

const BATCH_FORMAT_MESSAGE = 'Batch must use the format YYYY-YYYY (e.g. 2023-2027)'

// "2023-2027": the format, and the second year after the first.
const batchField = Joi.string()
  .trim()
  .pattern(BATCH_PATTERN)
  .custom((value, helpers) => {
    const match = BATCH_PATTERN.exec(value)
    if (match && Number(match[2]) <= Number(match[1])) {
      return helpers.error('batch.order')
    }
    return value
  })
  .messages({
    'string.base': 'Batch must be text',
    'string.empty': 'Batch is required',
    'string.pattern.base': BATCH_FORMAT_MESSAGE,
    'batch.order': 'The second batch year must be after the first',
  })

const playerFields = {
  name: Joi.string().trim().min(1).max(100).messages({
    'string.base': 'Name must be text',
    'string.empty': 'Name is required',
    'string.max': 'Name must be at most 100 characters',
  }),
  position: Joi.string()
    .valid(...PLAYER_POSITIONS)
    .messages({
      'string.empty': 'Position is required',
      'any.only': `Position must be one of: ${PLAYER_POSITIONS.join(', ')}`,
    }),
  batch: batchField,
  branch: Joi.string().trim().min(1).max(50).messages({
    'string.base': 'Branch must be text',
    'string.empty': 'Branch is required',
    'string.max': 'Branch must be at most 50 characters',
  }),
  bio: Joi.string().trim().allow('').max(1000).messages({
    'string.base': 'Bio must be text',
    'string.max': 'Bio must be at most 1000 characters',
  }),
  status: Joi.string()
    .valid(...PLAYER_STATUSES)
    .messages({
      'string.empty': 'Status is required',
      'any.only': 'Status must be current or former',
    }),
}

const REQUIRED_MESSAGES = {
  name: 'Name is required',
  position: 'Position is required',
  batch: 'Batch is required',
  branch: 'Branch is required',
}

/** POST /api/players fields (the photo file is checked by requirePhoto). */
export const createPlayerSchema = Joi.object({
  ...playerFields,
  name: playerFields.name.required().messages({ 'any.required': REQUIRED_MESSAGES.name }),
  position: playerFields.position
    .required()
    .messages({ 'any.required': REQUIRED_MESSAGES.position }),
  batch: playerFields.batch.required().messages({ 'any.required': REQUIRED_MESSAGES.batch }),
  branch: playerFields.branch
    .required()
    .messages({ 'any.required': REQUIRED_MESSAGES.branch }),
  status: playerFields.status.default('current'),
}).messages({ 'object.base': 'Request body must be an object' })

/** PATCH /api/players/:id — only supplied fields change (docs/API.md §11). */
export const updatePlayerSchema = Joi.object(playerFields).messages({
  'object.base': 'Request body must be an object',
})

/** GET /api/players query parameters (docs/API.md §10, §33–§36). */
export const listPlayersQuerySchema = Joi.object({
  search: Joi.string().trim().max(100).allow('').messages({
    'string.base': 'Search must be text',
    'string.max': 'Search must be at most 100 characters',
  }),
  status: playerFields.status,
  position: playerFields.position,
  batch: batchField,
  branch: Joi.string().trim().max(50).allow('').messages({
    'string.base': 'Branch must be text',
  }),
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a whole number of at least 1',
    'number.integer': 'Page must be a whole number of at least 1',
    'number.min': 'Page must be a whole number of at least 1',
  }),
  limit: Joi.number().integer().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE).messages({
    'number.base': `Limit must be a whole number from 1 to ${MAX_PAGE_SIZE}`,
    'number.integer': `Limit must be a whole number from 1 to ${MAX_PAGE_SIZE}`,
    'number.min': `Limit must be a whole number from 1 to ${MAX_PAGE_SIZE}`,
    'number.max': `Limit must be a whole number from 1 to ${MAX_PAGE_SIZE}`,
  }),
  sort: Joi.string()
    .valid(...PLAYER_SORTS)
    .default('name')
    .messages({ 'any.only': `Sort must be one of: ${PLAYER_SORTS.join(', ')}` }),
})

/** :id route parameter. */
export const playerIdParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid player id',
    'string.length': 'Invalid player id',
    'any.required': 'Invalid player id',
  }),
})
