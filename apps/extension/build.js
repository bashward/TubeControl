// Simple build script to copy files to dist
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const distDir = join(__dirname, 'dist');

// Create dist directory
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Helper function to copy directory recursively
function copyDirectory(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src);

  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);

    if (statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// Files to copy
const files = [
  'manifest.json',
  'background.js',
  'content_script.js',
  'popup.html',
  'popup.js',
  'socket.io.esm.min.js'
];

console.log('Building extension...');

files.forEach(file => {
  try {
    copyFileSync(
      join(__dirname, file),
      join(distDir, file)
    );
  } catch (err) {
    console.error(`Failed to copy ${file}:`, err.message);
  }
});

// Copy icons directory
try {
  const iconsDir = join(__dirname, 'icons');
  const distIconsDir = join(distDir, 'icons');
  copyDirectory(iconsDir, distIconsDir);
} catch (err) {
  console.error('Failed to copy icons directory:', err.message);
}
