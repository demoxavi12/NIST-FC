import mongoose from 'mongoose'

// A memory holds one cover plus at most this many gallery photos in total.
// (MAX_MEMORY_IMAGES limits photos per upload request, not the total.)
export const MAX_GALLERY_PHOTOS = 100
export const MAX_TAGS = 20

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: [true, 'Image URL is required'] },
    publicId: { type: String, required: [true, 'Image public ID is required'] },
  },
  { _id: false },
)

/**
 * A memory: an event or moment in NIST FC history with its complete photo
 * gallery (docs/DATABASE.md §5). Players are referenced by id; the player
 * documents are never copied into the memory.
 *
 * `date` is a calendar day stored as 00:00 UTC and always read in UTC, so it
 * never shifts across time zones.
 */
const memorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title must be at most 150 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description must be at most 5000 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [150, 'Location must be at most 150 characters'],
    },
    coverImage: {
      type: imageSchema,
      required: [true, 'Cover image is required'],
    },
    photos: {
      type: [imageSchema],
      default: [],
      validate: {
        validator: (photos) => photos.length <= MAX_GALLERY_PHOTOS,
        message: `A memory can have at most ${MAX_GALLERY_PHOTOS} photos`,
      },
    },
    players: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
      default: [],
      index: true,
    },
    tags: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
      default: [],
      validate: {
        validator: (tags) => tags.length <= MAX_TAGS,
        message: `A memory can have at most ${MAX_TAGS} tags`,
      },
    },
    published: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
  },
  {
    collection: 'memories',
    timestamps: true,
    // A save based on an outdated copy fails instead of silently overwriting
    // another admin's changes (e.g. dropping their photos).
    optimisticConcurrency: true,
  },
)

// Public list and previous/next queries: published, newest first.
memorySchema.index({ published: 1, date: -1, _id: -1 })

const Memory = mongoose.model('Memory', memorySchema)

export default Memory
