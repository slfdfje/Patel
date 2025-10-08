import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

function joinUrl(base, p) {
  if (!base) return null;
  return base.replace(/\/$/, '') + '/' + p.replace(/^\//, '');
}

export async function uploadToTransferSh(filePath) {
  const fileName = path.basename(filePath);
  const url = `https://transfer.sh/${encodeURIComponent(fileName)}`;
  const stream = fs.createReadStream(filePath);
  const resp = await fetch(url, { method: 'PUT', body: stream });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`transfer.sh failed: ${resp.status} ${text}`);
  }
  const text = (await resp.text()).trim();
  if (!/^https?:\/\//.test(text)) throw new Error('transfer.sh returned invalid URL');
  return text;
}

export async function getPublicUrlForLocalFile(filePath) {
  const publicBase = process.env.PUBLIC_BASE_URL || process.env.BASE_URL;
  if (publicBase) {
    // Map local file path under public/ to public URL
    const rel = filePath.replace(/^public\//, '');
    return joinUrl(publicBase, `public/${rel}`);
  }
  // Fallback: upload to transfer.sh to obtain a temporary public URL
  return await uploadToTransferSh(filePath);
}

