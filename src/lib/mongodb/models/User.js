import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    company_name: { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash:{ type: String, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

// Prevent model re-compilation on hot-reload
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
