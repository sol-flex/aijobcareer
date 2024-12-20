const mongoose = require('mongoose');
const Job = require('../models/Job');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const seedJobs = [
    {
      // Company Info
      company: "AI Innovations",
      companyLogo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNbpIfA-_GwTVZBVlpCvdIcLVOsCxn4BmqHA&s",
      
      // Basic Info
      title: "Senior Machine Learning Engineer",
      primaryRole: "Machine Learning",
      positionType: "Full-time",
      
      // Location
      locationType: "Hybrid",
      locations: "San Francisco, CA",
      
      // Details
      description: "Looking for an experienced ML engineer to lead our AI initiatives. Must have strong background in deep learning, PyTorch, and deployment of ML models at scale.",
      keywords: "machine learning, AI, PyTorch, deep learning, MLOps",
      
      // Compensation
      currency: "USD",
      salaryMin: 150000,
      salaryMax: 200000,
      equityMin: 0.1,
      equityMax: 0.5,
      cryptoPayment: false,
      
      category: "Engineering",
      
      // How to Apply
      applicationMethod: "Apply by website",
      applicationUrl: "https://ai-innovations.com/careers",
    },
    {
      company: "TechStart",
      companyLogo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNbpIfA-_GwTVZBVlpCvdIcLVOsCxn4BmqHA&s",
      title: "Content Marketing Manager",
      primaryRole: "Marketing",
      positionType: "Full-time",
      locationType: "Remote",
      locations: "Remote",
      description: "Drive our content strategy and brand voice. Experience with B2B SaaS marketing and technical content required.",
      keywords: "content marketing, B2B, SaaS, content strategy",
      currency: "USD",
      salaryMin: 90000,
      salaryMax: 120000,
      equityMin: 0.05,
      equityMax: 0.2,
      cryptoPayment: false,
      category: "Marketing",
      applicationMethod: "Apply by email",
      applicationEmail: "jobs@techstart.com"
    },
    {
      company: "DataCorp",
      companyLogo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNbpIfA-_GwTVZBVlpCvdIcLVOsCxn4BmqHA&s",
      title: "Technical Recruiter",
      primaryRole: "Recruiting",
      positionType: "Full-time",
      locationType: "Hybrid",
      locations: "New York, NY",
      description: "Source and recruit top technical talent. Understanding of engineering roles and technical skills required.",
      keywords: "recruiting, technical hiring, talent acquisition",
      currency: "USD",
      salaryMin: 80000,
      salaryMax: 110000,
      category: "HR",
      applicationMethod: "Apply by website",
      applicationUrl: "https://datacorp.com/jobs"
    },
    {
      company: "WebTech",
      companyLogo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNbpIfA-_GwTVZBVlpCvdIcLVOsCxn4BmqHA&s",
      title: "Frontend Developer",
      primaryRole: "Frontend Development",
      positionType: "Full-time",
      locationType: "Onsite",
      locations: "Austin, TX",
      description: "Build responsive web applications using React and TypeScript. Experience with modern frontend frameworks required.",
      keywords: "React, TypeScript, frontend, web development",
      currency: "USD",
      salaryMin: 100000,
      salaryMax: 140000,
      equityMin: 0.1,
      equityMax: 0.3,
      category: "Engineering",
      applicationMethod: "Apply by website",
      applicationUrl: "https://webtech.com/careers"
    },
    {
      company: "CloudTech",
      companyLogo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNbpIfA-_GwTVZBVlpCvdIcLVOsCxn4BmqHA&s",
      title: "DevOps Engineer",
      primaryRole: "DevOps",
      positionType: "Full-time",
      locationType: "Remote",
      locations: "Remote",
      description: "Manage cloud infrastructure and CI/CD pipelines. Experience with AWS, Kubernetes, and automation tools required.",
      keywords: "DevOps, AWS, Kubernetes, CI/CD, automation",
      currency: "USD",
      salaryMin: 120000,
      salaryMax: 160000,
      equityMin: 0.1,
      equityMax: 0.4,
      cryptoPayment: true,
      category: "Engineering",
      applicationMethod: "Apply by email",
      applicationEmail: "devops@cloudtech.io"
    }
  ];
const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing jobs
    await Job.deleteMany({});
    console.log('Cleared existing jobs');

    // Insert new jobs
    await Job.insertMany(seedJobs);
    console.log('Database seeded!');

    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDB();