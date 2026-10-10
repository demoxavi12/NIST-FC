import mongoose from 'mongoose'

// V1 categories (docs/DATABASE.md §6.3). Expanding the list is a product decision.
export const TIMELINE_CATEGORIES = [
  'founding',
  'tournament',
  'achievement',
  'milestone',
  'team',
  'event',
  'other',
]
export const MIN_YEAR = 1900
export const MAX_YEAR = 2100

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: [true, 'Image URL is required'] },
    publicId: { type: String, required: [true, 'Image public ID is required'] },
  },
  { _id: false },
)

/**
 * An event in NIST FC history (docs/DATABASE.md §6). Events are shown in the
 * admin-defined `order`; the server places a new event chronologically and
 * admins can reorder afterwards.
 *
 * `date` is optional (many historical events have only a year). When set it
 * is a calendar day stored as 00:00 UTC, and its year must equal `year`.
 * `memory` optionally links one memory; several events may link the same one.
 */
const timelineEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title must be at most 150 characters'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [MIN_YEAR, `Year must be from ${MIN_YEAR} to ${MAX_YEAR}`],
      max: [MAX_YEAR, `Year must be from ${MIN_YEAR} to ${MAX_YEAR}`],
      validate: { validator: Number.isInteger, message: 'Year must be a whole number' },
      index: true,
    },
    date: {
      type: Date,
      default: null,
      validate: {
        validator(value) {
          return value == null || value.getUTCFullYear() === this.year
        },
        message: 'Date must be in the selected year',
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description must be at most 2000 characters'],
    },
    image: { type: imageSchema, default: null },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: { values: TIMELINE_CATEGORIES, message: 'Category is not valid' },
    },
    memory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Memory',
      default: null,
      index: true,
    },
    order: {
      type: Number,
      required: [true, 'Order is required'],
      min: [1, 'Order must be a positive whole number'],
      validate: { validator: Number.isInteger, message: 'Order must be a positive whole number' },
      index: true,
    },
    published: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
  },
  {
    collection: 'timelineEvents',
    timestamps: true,
    // A save based on an outdated copy fails instead of overwriting another
    // admin's changes.
    optimisticConcurrency: true,
  },
)

// Public timeline: published events in display order (ties broken by _id).
timelineEventSchema.index({ published: 1, order: 1, _id: 1 })

const TimelineEvent = mongoose.model('TimelineEvent', timelineEventSchema)

export default TimelineEvent
