import express from 'express';
import jwt from 'jsonwebtoken';
import Project from '../models/Project.js';
import mongoose from 'mongoose';

const router = express.Router();

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}


router.post('/save', authMiddleware, async (req, res) => {
  try {
    const projectData = req.body;
    const projectId = projectData._id;

    let project;
    if (projectId) {
      project = await Project.findOneAndUpdate(
        { _id: projectId, userId: req.userId },
        { ...projectData, userId: req.userId },
        { new: true, upsert: true }
      );
    } else {
      project = await Project.create({
        ...projectData,
        userId: req.userId,
        projectName: projectData.projectName || 'Untitled Project',
        createdAt: new Date()
      });
    }

    res.status(200).json(project);
  } catch (err) {
    console.error('Save project error:', err);
    res.status(500).json({ error: 'Failed to save project' });
  }
});


router.get('/load', authMiddleware, async (req, res) => {
  try {
    console.log(`Fetching all projects for user ${req.userId}`);
    const projects = await Project.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error("Error loading projects:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/load/:id', authMiddleware, async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.userId;

    console.log(`Attempting to load project ${projectId} for user ${userId}`);

    const project = await Project.findOne({ _id: projectId, userId });

    if (!project) {
      console.log("Project not found or does not belong to user.");
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (err) {
    console.error("Error loading project:", err);
    res.status(500).json({ error: 'Server error while loading project' });
  }
});

router.delete('/delete/:id', authMiddleware, async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.userId;

    console.log(`Attempting to delete project ${projectId} for user ${userId}`);

    const deletedProject = await Project.findOneAndDelete({ _id: projectId, userId });

    if (!deletedProject) {
      console.log("Project not found or does not belong to user.");
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log(`Successfully deleted project ${projectId}`);
    res.json({ success: true, deletedId: projectId });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ error: 'Server error while deleting project' });
  }
});




router.get('/debug', (req, res) => {
  res.json({ message: 'project route works' });
});

export default router;
