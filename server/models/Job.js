const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  // Company Info
  company: { type: String, required: true },
  companyLogo: { type: String },
  
  // Basic Info
  title: { type: String, required: true },
  primaryRole: { type: String, required: true },
  positionType: { type: String, required: true },
  
  // Location
  locationType: { type: String, required: true },
  country: { type: String, required: true},
  locations: { type: String, required: true},

  
  // Details
  description: { type: String, required: true },
  keywords: { type: String },
  
  // Compensation
  currency: { type: String, default: 'USD' },
  salaryMin: { type: Number },
  salaryMax: { type: Number },
  equityMin: { type: Number },
  equityMax: { type: Number },
  cryptoPayment: { type: Boolean, default: false },

  category: {  // Simple string field
    type: String,
    required: false
  },
  
  // How to Apply
  applicationMethod: { type: String, required: true },
  applicationUrl: { 
    type: String, 
    required: function() { 
      return this.applicationMethod === 'Apply by website'; 
    }
  },
  applicationEmail: { 
    type: String, 
    required: function() { 
      return this.applicationMethod === 'Apply by email'; 
    }
  },

  publishedAt: {
    type: Date,
    default: null  // Will be set when payment is confirmed
  },
  expiresAt: {
    type: Date,
    default: null  // Will be set when payment is confirmed
  },
  
  //Payment status

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  published: {
    type: Boolean,
    default: false
  },

  // Deprecation (for daily sync)
  deprecated: {
    type: Boolean,
    default: false
  },
  deprecatedAt: {
    type: Date
  },
  platform: {
    type: String,
    enum: ['greenhouse', 'lever', 'ashby', 'scraped'],
    default: 'scraped'
  },

  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;