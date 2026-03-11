const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';

async function saveImage(buffer, folder = 'players') {
  const filename = `${uuidv4()}.webp`;
  const folderPath = path.join(UPLOAD_DIR, folder);
  const filePath = path.join(folderPath, filename);

  // Create folder if it doesn't exist
  fs.mkdirSync(folderPath, { recursive: true });

  // Resize and convert to WebP using sharp
  await sharp(buffer)
    .resize(400, 400, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toFile(filePath);

  // Return the public-facing URL
  return `${BASE_URL}/uploads/${folder}/${filename}`;
}

async function saveTeamLogo(buffer) {
  const filename = `${uuidv4()}.webp`;
  const folderPath = path.join(UPLOAD_DIR, 'teams');
  const filePath = path.join(folderPath, filename);

  fs.mkdirSync(folderPath, { recursive: true });

  await sharp(buffer)
    .resize(200, 200, { fit: 'cover' })
    .webp({ quality: 80 })
    .toFile(filePath);

  return `${BASE_URL}/uploads/teams/${filename}`;
}

async function saveAppLogo(buffer) {
  const filename = `${uuidv4()}.webp`;
  const folderPath = path.join(UPLOAD_DIR, 'logos');
  const filePath = path.join(folderPath, filename);

  fs.mkdirSync(folderPath, { recursive: true });

  await sharp(buffer)
    .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 80 })
    .toFile(filePath);

  return `${BASE_URL}/uploads/logos/${filename}`;
}

async function deleteImage(imageUrl) {
  if (!imageUrl) return;
  if (!imageUrl.includes('/uploads/')) return;

  try {
    const urlPath = new URL(imageUrl).pathname; // e.g. /uploads/players/abc.webp
    const filePath = path.join(UPLOAD_DIR, urlPath.replace('/uploads/', ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Deleted image:', filePath);
    }
  } catch (err) {
    console.error('Failed to delete image:', err.message);
    // Don't throw — deletion failure is not critical
  }
}

module.exports = { saveImage, saveTeamLogo, saveAppLogo, deleteImage };
