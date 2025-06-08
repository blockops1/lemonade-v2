import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 32, 48, 64, 128, 192, 256, 512];
const inputFile = path.join(__dirname, '../public/images/lemons.jpg');
const outputDir = path.join(__dirname, '../public');

async function generateFavicons() {
  try {
    // Create PNG versions in different sizes
    for (const size of sizes) {
      await sharp(inputFile)
        .resize(size, size)
        .png()
        .toFile(path.join(outputDir, `favicon-${size}x${size}.png`));
    }

    // Create ICO file (16x16 and 32x32)
    await sharp(inputFile)
      .resize(32, 32)
      .toFormat('ico')
      .toFile(path.join(outputDir, 'favicon.ico'));

    // Create apple-touch-icon
    await sharp(inputFile)
      .resize(180, 180)
      .png()
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));

    console.log('Favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

generateFavicons(); 