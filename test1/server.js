require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the environment variables (.env).');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date()
  });
});

// GET all stored users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve records from database',
      error: error.message
    });
  }
});

// POST a new user (store name and emailId)
app.post('/api/users', async (req, res) => {
  try {
    const { name, emailId } = req.body;

    if (!name || !emailId) {
      return res.status(400).json({
        success: false,
        message: 'Both Name and Email ID are required.'
      });
    }

    const newUser = new User({
      name: name.trim(),
      emailId: emailId.trim()
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Record saved successfully!',
      data: savedUser
    });
  } catch (error) {
    console.error('Error creating user:', error);

    // Mongoose validation error handling
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to save record to database',
      error: error.message
    });
  }
});

// DELETE a user by ID
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    res.json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete record',
      error: error.message
    });
  }
});

// Serve frontend for all unmatched GET routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
