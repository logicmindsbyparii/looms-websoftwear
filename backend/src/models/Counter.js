import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  seq: {
    type: Number,
    default: 0
  }
});

export const Counter = mongoose.model('Counter', counterSchema);

/**
 * Atomically increments and returns the next sequential number for a given key.
 * @param {string} key - e.g. 'roll-2026'
 * @returns {Promise<number>}
 */
export async function getNextSequence(key) {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return counter.seq;
}
