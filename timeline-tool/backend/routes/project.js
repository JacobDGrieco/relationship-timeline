import express from 'express';
import jwt from 'jsonwebtoken';
import Project from '../models/Project.js';

const router = express.Router();

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log('Auth header:', authHeader);

  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  console.log('Token extracted:', token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error('JWT error:', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}


router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { _id, ...projectData } = req.body;
    let project;

    if (_id) {
      project = await Project.create({
        ...projectData,
        userId: req.userId,
        projectName: projectData.projectName || 'Untitled Project',
        createdAt: new Date()
      });
    } else {
      project = await Project.create({ ...projectData, userId: req.userId });
    }

    res.json({ success: true, project });
  } catch (err) {
    console.error('Project save error:', err);
    res.status(500).json({ error: 'Server error saving project' });
  }
});


router.get('/load', authMiddleware, async (req, res) => {
  const projects = await Project.find({ userId: req.userId }).sort({ updatedAt: -1 });
  res.json(projects);
});

export default router;
