import mongoose from 'mongoose';

const HistoryEntrySchema = new mongoose.Schema(
  {
    action:     { type: String },
    reason:     { type: String },
    timestamp:  { type: String },
    version:    { type: Number },
    ai_response:{ type: String },
  },
  { _id: false }
);

const DecisionLogSchema = new mongoose.Schema(
  {
    user_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    employee_id:    { type: String, enum: ['destroyer', 'researcher', 'engineer', 'strategist', 'fundraiser'], required: true },
    status:         { type: String, enum: ['generating', 'pending', 'accepted', 'rejected', 'revised', 'pushback', 'error'], default: 'pending' },
    version:        { type: Number, default: 1 },

    // Log content
    title:          { type: String, default: '' },
    situation:      { type: String, default: '' },
    recommendation: { type: String, default: '' },
    reasoning:      { type: String, default: '' },
    risk_if_ignored:{ type: String, default: '' },
    confidence:     { type: Number, min: 0, max: 100, default: 75 },
    urgency:        { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
    node_ref:       { type: String, default: 'other' },

    // Sub-AI quality review
    review_score:   { type: Number, min: 0, max: 100 },
    review_note:    { type: String },

    // Rejection/pushback
    pushback_reason:{ type: String },

    // Full append-only event history
    history:        { type: [HistoryEntrySchema], default: [] },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

export const DecisionLog = mongoose.models.DecisionLog || mongoose.model('DecisionLog', DecisionLogSchema);
