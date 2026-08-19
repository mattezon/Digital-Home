const express = require('express');
const protect = require('../middleware/auth.cjs');
const {
  createProject,
  getProjects,
  participateProject
} = require('../controllers/projects.cjs');

const router = express.Router();

// Public routes
router.get('/', getProjects);

// Private routes
router.post('/', protect, createProject);
router.post('/:id/participate', protect, participateProject);

module.exports = router;