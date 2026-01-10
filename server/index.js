const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
require('dotenv').config();

console.log('MongoDB URI from .env:', process.env.MONGODB_URI);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  createParentPath: true
}));

// Routes
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/resumes', require('./routes/resumeRoutes'));
// app.use('/api/users', require('./routes/userRoutes'));
//app.use('/api/companies', require('./routes/companyRoutes'));

// Connect to MongoDB
console.log('MongoDB URI from .env:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});