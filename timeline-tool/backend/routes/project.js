import express from 'express';
import jwt from 'jsonwebtoken';
import Project from '../models/Project.js';

const router = express.Router();

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

router.post('/save', authMiddleware, async (req, res) => {
  const { _id, ...projectData } = req.body;
  let project;

  if (_id) {
    project = await Project.findOneAndUpdate(
      { _id, userId: req.userId },
      { ...projectData, updatedAt: new Date() },
      { new: true }
    );
  } else {
    project = await Project.create({ ...projectData, userId: req.userId });
  }

  res.json({ success: true, project });
});

router.get('/load', authMiddleware, async (req, res) => {
  const projects = await Project.find({ userId: req.userId }).sort({ updatedAt: -1 });
  res.json(projects);
});

export default router;
