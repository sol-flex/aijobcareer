const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  filename: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  data: {
    type: Buffer,
    required: true
  },
  metadata: {
    size: {
      type: Number,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }
}, { timestamps: true });

// Add custom method to stream the file
resumeSchema.methods.streamFile = function() {
  return this.data;
};

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
