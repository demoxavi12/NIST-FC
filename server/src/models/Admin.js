import mongoose from 'mongoose'

// "superAdmin" is reserved for future use (docs/DATABASE.md §8.3).
export const ADMIN_ROLES = ['admin', 'superAdmin']

// passwordHash must never leave the server, even if a document is serialised.
function removeSensitiveFields(doc, ret) {
  delete ret.passwordHash
  delete ret.__v
  return ret
}

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, 'Email must be at most 254 characters'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: { values: ADMIN_ROLES, message: 'Role must be admin or superAdmin' },
      default: 'admin',
    },
  },
  {
    collection: 'admins',
    timestamps: true,
    toJSON: { transform: removeSensitiveFields },
    toObject: { transform: removeSensitiveFields },
  },
)

const Admin = mongoose.model('Admin', adminSchema)

export default Admin
