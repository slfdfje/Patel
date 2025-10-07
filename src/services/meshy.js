import fetch from 'node-fetch';
const API_BASE = 'https://api.meshy.ai/openapi/v1';

export async function createImageTo3DTask(imageUrls) {
  const key = process.env.MESHY_API_KEY;
  const resp = await fetch(`${API_BASE}/image-to-3d`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image_url: imageUrls[0],
      ai_model: 'meshy-3'
    })
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Meshy create failed: ${resp.status} ${text}`);
  }
  return resp.json();
}

export async function getTask(taskId) {
  const key = process.env.MESHY_API_KEY;
  const resp = await fetch(`${API_BASE}/tasks/${taskId}`, {
    headers: { 'Authorization': `Bearer ${key}` }
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Meshy task failed: ${resp.status} ${text}`);
  }
  return resp.json();
}

