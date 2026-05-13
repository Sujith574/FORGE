import mongoose from 'mongoose';

// Each row = one field in one section. Unique per user+section+field.
const DocumentSchema = new mongoose.Schema(
  {
    user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    section_id: { type: String, enum: ['market', 'product', 'business', 'technology'], required: true },
    field_id:   { type: String, required: true },
    value:      { type: String, default: '' },
  },
  { timestamps: { createdAt: false, updatedAt: 'updated_at' } }
);

// Compound unique index: one row per user + section + field
DocumentSchema.index({ user_id: 1, section_id: 1, field_id: 1 }, { unique: true });

export const Document = mongoose.models.Document || mongoose.model('Document', DocumentSchema);
