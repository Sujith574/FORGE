import mongoose from 'mongoose';

const BrainNodeSchema = new mongoose.Schema(
  {
    user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label:       { type: String, required: true, trim: true },
    x:           { type: Number, default: 400 },
    y:           { type: Number, default: 300 },
    status:      { type: String, enum: ['unknown', 'in-progress', 'validated', 'at-risk'], default: 'unknown' },
    is_core:     { type: Boolean, default: false },
    connections: { type: [String], default: [] },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

export const BrainNode = mongoose.models.BrainNode || mongoose.model('BrainNode', BrainNodeSchema);
