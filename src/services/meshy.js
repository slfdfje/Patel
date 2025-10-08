import fetch from 'node-fetch';
const API_BASES = ['https://api.meshy.ai/openapi/v1', 'https://api.meshy.ai/v2'];

function buildHeaders(key) {
  return {
    'Authorization': `Bearer ${key}`,
    'X-API-Key': key,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

async function tryBases(path, options) {
  let lastErrText = '';
  for (const base of API_BASES) {
    const resp = await fetch(`${base}${path}`, options);
    if (resp.ok) return resp;
    lastErrText = `${resp.status} ${await resp.text()}`;
    // On 401/404, try next base
    if (![401,404].includes(resp.status)) break;
  }
  throw new Error(lastErrText || 'Unknown Meshy error');
}

export async function createImageTo3DTask(imageUrls) {
  const key = process.env.MESHY_API_KEY;
  if (!key) throw new Error('Missing MESHY_API_KEY');
  const body = {
    image_url: imageUrls[0],
    ai_model: 'meshy-3'
  };
  const resp = await tryBases('/image-to-3d', {
    method: 'POST',
    headers: buildHeaders(key),
    body: JSON.stringify(body)
  });
  return resp.json();
}

export async function getTask(taskId) {
  const key = process.env.MESHY_API_KEY;
  if (!key) throw new Error('Missing MESHY_API_KEY');
  const resp = await tryBases(`/tasks/${taskId}`, {
    headers: buildHeaders(key)
  });
  return resp.json();
}

