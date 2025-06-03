import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  graphData: Object,
  nodeDetails: Object,
  timelineEntries: Array,
  timelineStartDate: String,
  timelineEndDate: String,
  snapshots: Array,
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Project', ProjectSchema);
