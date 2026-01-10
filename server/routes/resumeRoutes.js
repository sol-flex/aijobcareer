const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');

// Resume upload route
router.post('/', async (req, res) => {
  try {
    const file = req.files?.resume;
    const email = req.body.email;

    if (!file) {
      console.log('Request body:', req.body);
      console.log('Request files:', req.files);
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size must be less than 10MB'
      });
    }

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Only PDF, DOC, and DOCX files are allowed!'
      });
    }

    // Check if resume already exists for this email
    const existingResume = await Resume.findOne({ email: email });

    if (existingResume) {
      // Update existing resume
      existingResume.filename = file.name;
      existingResume.contentType = file.mimetype;
      existingResume.data = file.data;
      existingResume.metadata.size = file.size;
      existingResume.metadata.uploadedAt = new Date();
      await existingResume.save();

      return res.status(200).json({
        success: true,
        message: 'Resume updated successfully',
        filename: file.name,
        updated: true
      });
    }

    // Create new resume
    const resume = new Resume({
      email: email,
      filename: file.name,
      contentType: file.mimetype,
      data: file.data,
      metadata: {
        size: file.size
      }
    });

    await resume.save();
    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      filename: file.name,
      updated: false
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload resume'
    });
  }
});

// Add route to download resume
router.get('/:id', async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Set appropriate headers for file download
    res.set('Content-Type', resume.contentType);
    res.set('Content-Disposition', `attachment; filename="${resume.filename}"`);

    // Send the file data
    res.send(resume.data);

  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error downloading resume'
    });
  }
});

module.exports = router;