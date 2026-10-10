import Joi from 'joi'
import { MAX_YEAR, MIN_YEAR, TIMELINE_CATEGORIES } from '../models/TimelineEvent.js'
import { dateField, OBJECT_ID } from './memoryValidators.js'

const YEAR_MESSAGE = `Year must be a whole number from ${MIN_YEAR} to ${MAX_YEAR}`

/**
 * Timeline event fields (docs/API.md §16). Multipart forms send text, so
 * numbers and booleans are converted. An empty `date` or `memory` clears it.
 * Whether `date` falls in `year` is checked by the service, which also knows
 * the stored values during a partial update.
 */
const timelineFields = {
  title: Joi.string().trim().min(1).max(150).messages({
    'string.base': 'Title must be text',
    'string.empty': 'Title is required',
    'string.max': 'Title must be at most 150 characters',
  }),
  year: Joi.number().integer().min(MIN_YEAR).max(MAX_YEAR).messages({
    'number.base': YEAR_MESSAGE,
    'number.integer': YEAR_MESSAGE,
    'number.min': YEAR_MESSAGE,
    'number.max': YEAR_MESSAGE,
    'number.unsafe': YEAR_MESSAGE,
  }),
  date: dateField.allow('', null),
  description: Joi.string().trim().allow('').max(2000).messages({
    'string.base': 'Description must be text',
    'string.max': 'Description must be at most 2000 characters',
  }),
  category: Joi.string()
    .valid(...TIMELINE_CATEGORIES)
    .messages({
      'any.only': `Category must be one of: ${TIMELINE_CATEGORIES.join(', ')}`,
      'string.base': 'Category must be text',
      'string.empty': 'Category is required',
    }),
  memory: Joi.string().pattern(OBJECT_ID).allow('', null).messages({
    'string.base': 'Invalid memory id',
    'string.pattern.base': 'Invalid memory id',
  }),
  published: Joi.boolean().messages({ 'boolean.base': 'Published must be true or false' }),
}

const bodyMessages = { 'object.base': 'Request body must be an object' }

/** POST /api/timeline — the order is assigned by the server. */
export const createTimelineEventSchema = Joi.object({
  ...timelineFields,
  title: timelineFields.title.required().messages({ 'any.required': 'Title is required' }),
  year: timelineFields.year.required().messages({ 'any.required': 'Year is required' }),
  category: timelineFields.category.required().messages({ 'any.required': 'Category is required' }),
  // New events are drafts until published.
  published: timelineFields.published.default(false),
}).messages(bodyMessages)

/**
 * PATCH /api/timeline/:id — only supplied fields change. `removeImage: true`
 * removes the image; `expectedUpdatedAt` rejects stale edits with 409.
 */
export const updateTimelineEventSchema = Joi.object({
  ...timelineFields,
  removeImage: Joi.boolean().messages({ 'boolean.base': 'removeImage must be true or false' }),
  expectedUpdatedAt: Joi.date().iso().messages({
    'date.base': 'expectedUpdatedAt must be an ISO date',
    'date.format': 'expectedUpdatedAt must be an ISO date',
  }),
}).messages(bodyMessages)

const ORDER_MESSAGE = 'Order must be a positive whole number'

/**
 * PATCH /api/timeline/reorder — every event exactly once with orders 1..N.
 * Duplicates are rejected here; completeness and contiguity are checked by
 * the service against the stored events.
 */
export const reorderTimelineSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().pattern(OBJECT_ID).required().messages({
          'string.base': 'Invalid timeline event id',
          'string.pattern.base': 'Invalid timeline event id',
          'any.required': 'Each item needs an id',
        }),
        order: Joi.number().integer().min(1).required().messages({
          'number.base': ORDER_MESSAGE,
          'number.integer': ORDER_MESSAGE,
          'number.min': ORDER_MESSAGE,
          'any.required': 'Each item needs an order',
        }),
      }),
    )
    .min(1)
    .unique('id')
    .unique('order')
    .required()
    .messages({
      'array.base': 'items must be a list',
      'array.min': 'items must contain every timeline event',
      'array.unique': 'Each event and each order may appear only once',
      'any.required': 'items is required',
    }),
}).messages(bodyMessages)

/** GET /api/admin/timeline — drafts included; optional visibility filter. */
export const adminListTimelineQuerySchema = Joi.object({
  published: Joi.boolean().messages({ 'boolean.base': 'Published must be true or false' }),
})

/** :id route parameter. */
export const timelineIdParamSchema = Joi.object({
  id: Joi.string().pattern(OBJECT_ID).required().messages({
    'string.pattern.base': 'Invalid timeline event id',
    'any.required': 'Invalid timeline event id',
  }),
})
