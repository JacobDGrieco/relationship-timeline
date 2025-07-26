import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectName: { type: String, default: 'Untitled Project' },
  graphData: Object,
  nodeDetails: Object,
  timelineEntries: Array,
  timelineStartDate: String,
  timelineEndDate: String,
  snapshots: Array,
  versions: [{ snapshot: Object, savedAt: Date }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Project', ProjectSchema);
