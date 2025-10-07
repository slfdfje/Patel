import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../models/db.js';
import { authMiddleware } from '../middlewares/auth.js';
import { createImageTo3DTask, getTask } from '../services/meshy.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.userId || 'anon';
    const dir = path.join('public/uploads', String(userId));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { files: 4 } });

const router = Router();

router.post('/', authMiddleware, upload.array('images', 4), async (req, res) => {
  const files = req.files || [];
  if (files.length < 1) return res.status(400).json({ error: 'at least 1 image required' });
  if (files.length > 4) return res.status(400).json({ error: 'max 4 images' });

  db.run('INSERT INTO jobs (user_id, status) VALUES (?, ?)', [req.userId, 'pending'], function(err){
    if (err) return res.status(500).json({ error: 'db error' });
    const jobId = this.lastID;
    const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
    const imageUrls = files.map(f => `${baseUrl}/public/${f.path.replace('public/','')}`);
    const stmt = db.prepare('INSERT INTO job_images (job_id, file_path) VALUES (?, ?)');
    for (const f of files) stmt.run(jobId, f.path);
    stmt.finalize();

    createImageTo3DTask(imageUrls).then(async (task) => {
      const taskId = task.task_id || task.id || task.taskId;
      db.run('UPDATE jobs SET meshy_task_id=?, status=\'processing\', updated_at=CURRENT_TIMESTAMP WHERE id=?', [taskId, jobId]);
      res.json({ jobId, taskId });
    }).catch(e => {
      db.run('UPDATE jobs SET status=\'failed\', updated_at=CURRENT_TIMESTAMP WHERE id=?', [jobId]);
      res.status(500).json({ error: e.message });
    });
  });
});

router.get('/', authMiddleware, (req, res) => {
  db.all('SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC', [req.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'db error' });
    res.json(rows);
  });
});

router.get('/:id', authMiddleware, (req, res) => {
  db.get('SELECT * FROM jobs WHERE id=? AND user_id=?', [req.params.id, req.userId], (err, job) => {
    if (err || !job) return res.status(404).json({ error: 'not found' });
    db.all('SELECT * FROM job_images WHERE job_id=?', [job.id], (e, images) => {
      if (e) return res.status(500).json({ error: 'db error' });
      res.json({ job, images });
    });
  });
});

router.post('/:id/poll', authMiddleware, async (req, res) => {
  db.get('SELECT * FROM jobs WHERE id=? AND user_id=?', [req.params.id, req.userId], async (err, job) => {
    if (err || !job) return res.status(404).json({ error: 'not found' });
    if (!job.meshy_task_id) return res.json({ status: job.status });
    try {
      const task = await getTask(job.meshy_task_id);
      const status = task.status || task.task_status || task.state;
      let resultUrl = job.result_url;
      if (task.output && (task.output.glb || task.output.gltf)) {
        resultUrl = task.output.glb || task.output.gltf;
      }
      db.run('UPDATE jobs SET status=?, result_url=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [status, resultUrl, job.id]);
      res.json({ status, resultUrl });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

export default router;

