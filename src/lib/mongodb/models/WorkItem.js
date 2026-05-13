import mongoose from 'mongoose';

const WorkItemSchema = new mongoose.Schema(
  {
    node_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BrainNode', required: true, index: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type:    { type: String, enum: ['decision', 'insight', 'blocker', 'milestone', 'question', 'note'], required: true },
    text:    { type: String, required: true },
    author:  { type: String, default: 'Founder' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

export const WorkItem = mongoose.models.WorkItem || mongoose.model('WorkItem', WorkItemSchema);
