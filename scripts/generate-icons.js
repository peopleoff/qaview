#!/usr/bin/env node
/**
 * Generate app icons for electron-builder
 * Creates icon.png (1024x1024), icon.icns (macOS), icon.ico (Windows)
 */

import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const buildDir = join(__dirname, '..', 'build');

// Create a simple branded icon: blue gradient background with "QA" text
async function createSourceIcon() {
  const size = 1024;
  const cornerRadius = 180;

  // Create SVG with gradient and text
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1D4ED8;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="shine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:white;stop-opacity:0.3" />
          <stop offset="50%" style="stop-color:white;stop-opacity:0" />
        </linearGradient>
      </defs>

      <!-- Rounded rectangle background -->
      <rect x="0" y="0" width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="url(#bg)"/>

      <!-- Subtle shine effect -->
      <rect x="0" y="0" width="${size}" height="${size/2}" rx="${cornerRadius}" ry="${cornerRadius}" fill="url(#shine)"/>

      <!-- QA text -->
      <text x="50%" y="55%" font-family="SF Pro Display, -apple-system, BlinkMacSystemFont, Helvetica Neue, Arial, sans-serif"
            font-size="420" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">
        QA
      </text>

      <!-- Subtle border -->
      <rect x="4" y="4" width="${size-8}" height="${size-8}" rx="${cornerRadius-4}" ry="${cornerRadius-4}"
            fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="4"/>
    </svg>
  `;

  return Buffer.from(svg);
}

async function generateIcons() {
  mkdirSync(buildDir, { recursive: true });

  const svgBuffer = await createSourceIcon();

  // Generate PNG at 1024x1024
  const pngPath = join(buildDir, 'icon.png');
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(pngPath);

  // Generate ICO for Windows (multiple sizes embedded)
  const icoPath = join(buildDir, 'icon.ico');

  // Create multiple sizes for ICO
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const pngBuffers = await Promise.all(
    sizes.map(size =>
      sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );

  const icoBuffer = await pngToIco(pngBuffers);
  writeFileSync(icoPath, icoBuffer);

  const iconsetDir = join(buildDir, 'icon.iconset');
  mkdirSync(iconsetDir, { recursive: true });

  // macOS iconset requires specific sizes and naming
  const icnsSizes = [
    { size: 16, name: 'icon_16x16.png' },
    { size: 32, name: 'icon_16x16@2x.png' },
    { size: 32, name: 'icon_32x32.png' },
    { size: 64, name: 'icon_32x32@2x.png' },
    { size: 128, name: 'icon_128x128.png' },
    { size: 256, name: 'icon_128x128@2x.png' },
    { size: 256, name: 'icon_256x256.png' },
    { size: 512, name: 'icon_256x256@2x.png' },
    { size: 512, name: 'icon_512x512.png' },
    { size: 1024, name: 'icon_512x512@2x.png' },
  ];

  for (const { size, name } of icnsSizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(iconsetDir, name));
  }

  // Convert iconset to icns using macOS iconutil
  try {
    execSync(`iconutil -c icns "${iconsetDir}" -o "${join(buildDir, 'icon.icns')}"`, {
      stdio: 'inherit'
    });

    // Clean up iconset directory
    rmSync(iconsetDir, { recursive: true });
  } catch (error) {
    console.error('Warning: Could not create .icns file. iconutil may not be available.');
    console.error('The .iconset folder has been preserved. Convert manually or on macOS.');
  }
}

generateIcons().catch(console.error);
