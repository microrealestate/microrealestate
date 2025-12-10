import mongoose from 'mongoose';

const irlSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  quarter: { type: String, required: true }, // T1, T2, T3, T4
  value: { type: Number, required: true },
  source: { type: String, default: 'INSEE' },
  retrievedAt: { type: Date, default: Date.now },
});

// Empêche les doublons
irlSchema.index({ year: 1, quarter: 1 }, { unique: true });

const IRL = mongoose.models.IRL || mongoose.model('IRL', irlSchema);
export default IRL;
