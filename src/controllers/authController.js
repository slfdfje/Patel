import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../models/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function register(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const passwordHash = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, passwordHash], function(err){
    if (err) return res.status(400).json({ error: 'email already exists' });
    const token = jwt.sign({ userId: this.lastID }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  });
}

