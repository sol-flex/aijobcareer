const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Company = require('../models/Company');

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ deprecated: { $ne: true } });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new job
router.post('/', async (req, res) => {
    const job = new Job({
        // Company Info
        company: req.body.companyName,
        companyLogo: req.body.companyLogo,
        
        // Basic Info
        title: req.body.title,
        primaryRole: req.body.primaryRole,
        positionType: req.body.positionType,
        
        // Location
        locationType: req.body.locationType,
        locations: req.body.locations,
        
        // Details
        description: req.body.description,
        keywords: req.body.keywords,
        
        // Compensation
        currency: req.body.currency,
        salaryMin: req.body.salaryMin,
        salaryMax: req.body.salaryMax,
        equityMin: req.body.equityMin,
        equityMax: req.body.equityMax,
        cryptoPayment: req.body.cryptoPayment,
        
        // How to Apply
        applicationMethod: req.body.applicationMethod,
        applicationUrl: req.body.applicationUrl,
        applicationEmail: req.body.applicationEmail
    });

  try {
    const newJob = await job.save();
    res.status(201).json(newJob);
  } catch (error) {
    console.error('Error saving job:', error); // Add this line
    res.status(400).json({ message: error });
  }
});

// Get a single job by ID
router.get('/:id', async (req, res) => {
    try {
      const job = await Job.findById(req.params.id);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      res.json(job);
    } catch (error) {
      console.error('Error fetching job:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Update a job (PATCH)
router.patch('/:id', async (req, res) => {
    try {
      const job = await Job.findById(req.params.id);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
  
      // Update only the fields that are provided
      Object.keys(req.body).forEach(key => {
        job[key] = req.body[key];
      });
  
      const updatedJob = await job.save();
      res.json(updatedJob);
    } catch (error) {
        console.log(error);
      res.status(400).json({ message: error.message });
    }
  });
  // Get all jobs by company name

// Get jobs by company name
router.get('/company/:companyName', async (req, res) => {
    try {
      const { companyName } = req.params;

      const jobs = await Job.find({
        company: companyName,
        deprecated: { $ne: true }
      }).sort({
        primaryRole: 1,  // Sort by role first
        createdAt: -1    // Then by date (newest first)
      });

      if (!jobs.length) {
        return res.status(404).json({ message: 'No jobs found for this company' });
      }

      res.json(jobs);
    } catch (error) {
      console.error('Error fetching company jobs:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.get('/companies', async (req, res) => {
    try {
      const companies = await Company.find();

    } catch (error) {
      console.error('Error fetching companies:', error);

    }
  })

module.exports = router;