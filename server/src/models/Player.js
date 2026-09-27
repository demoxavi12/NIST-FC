import mongoose from 'mongoose'

// V1 positions (docs/FEATURES.md §6). Expanding the list is a product decision.
export const PLAYER_POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']

// A player who leaves the team becomes "former"; they are never deleted for
// leaving (docs/DATABASE.md §4.6).
export const PLAYER_STATUSES = ['current', 'former']

// Academic batch range, e.g. "2023-2027" (docs/DATABASE.md §4.4).
export const BATCH_PATTERN = /^(\d{4})-(\d{4})$/

function isValidBatch(value) {
  const match = BATCH_PATTERN.exec(value)
  return Boolean(match) && Number(match[2]) > Number(match[1])
}

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: [true, 'Photo URL is required'] },
    publicId: { type: String, required: [true, 'Photo public ID is required'] },
  },
  { _id: false },
)

/**
 * NIST FC player (docs/DATABASE.md §4). Memories reference players through
 * Memory.players[]; the player document itself holds no memory list.
 */
const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name must be at most 100 characters'],
      index: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    photo: {
      type: imageSchema,
      required: [true, 'Photo is required'],
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      enum: { values: PLAYER_POSITIONS, message: 'Position is not valid' },
      index: true,
    },
    batch: {
      type: String,
      required: [true, 'Batch is required'],
      trim: true,
      validate: {
        validator: isValidBatch,
        message: 'Batch must use the format YYYY-YYYY with the second year after the first',
      },
      index: true,
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
      maxlength: [50, 'Branch must be at most 50 characters'],
      index: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, 'Bio must be at most 1000 characters'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: { values: PLAYER_STATUSES, message: 'Status must be current or former' },
      default: 'current',
      index: true,
    },
  },
  { collection: 'players', timestamps: true },
)

const Player = mongoose.model('Player', playerSchema)

export default Player
