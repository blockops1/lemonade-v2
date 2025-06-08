import pngToIco from 'png-to-ico';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');

async function generateIco() {
  try {
    // Use the 16x16, 32x32, and 48x48 PNGs for the ICO file
    const pngFiles = [
      path.join(publicDir, 'favicon-16x16.png'),
      path.join(publicDir, 'favicon-32x32.png'),
      path.join(publicDir, 'favicon-48x48.png')
    ];

    const buf = await pngToIco(pngFiles);
    
    // Write the ICO file
    const fs = await import('fs/promises');
    await fs.writeFile(path.join(publicDir, 'favicon.ico'), buf);
    
    console.log('favicon.ico generated successfully!');
  } catch (error) {
    console.error('Error generating favicon.ico:', error);
  }
}

generateIco(); 