// Simple script to generate PWA icons
// Run with: node generate-icons.js

const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [192, 512];

function generateIcon(size, maskable = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#0a0e17';
  if (maskable) {
    // Maskable icons need full bleed
    ctx.fillRect(0, 0, size, size);
  } else {
    // Regular icons can have rounded corners (we'll just use full rect for simplicity)
    ctx.fillRect(0, 0, size, size);
  }
  
  // Scale factor
  const scale = size / 192;
  
  // Gradient rectangle (receipt)
  const gradient = ctx.createLinearGradient(30 * scale, 40 * scale, 162 * scale, 152 * scale);
  gradient.addColorStop(0, '#14B8A6');
  gradient.addColorStop(1, '#06B6D4');
  
  ctx.fillStyle = gradient;
  roundRect(ctx, 30 * scale, 40 * scale, 132 * scale, 112 * scale, 12 * scale);
  ctx.fill();
  
  // Lines on receipt
  ctx.fillStyle = 'rgba(10, 14, 23, 0.3)';
  ctx.fillRect(45 * scale, 55 * scale, 90 * scale, 4 * scale);
  ctx.fillRect(45 * scale, 67 * scale, 60 * scale, 4 * scale);
  ctx.fillRect(45 * scale, 79 * scale, 75 * scale, 4 * scale);
  ctx.fillRect(45 * scale, 91 * scale, 50 * scale, 4 * scale);
  
  // Dashed line
  ctx.strokeStyle = 'rgba(10, 14, 23, 0.5)';
  ctx.lineWidth = 2 * scale;
  ctx.setLineDash([6 * scale, 3 * scale]);
  ctx.beginPath();
  ctx.moveTo(35 * scale, 110 * scale);
  ctx.lineTo(157 * scale, 110 * scale);
  ctx.stroke();
  
  // Euro symbol
  ctx.fillStyle = 'rgba(10, 14, 23, 0.7)';
  ctx.font = `bold ${28 * scale}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('€', 96 * scale, 135 * scale);
  
  return canvas.toBuffer('image/png');
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Generate icons
sizes.forEach(size => {
  // Regular icon
  const icon = generateIcon(size, false);
  fs.writeFileSync(`public/icon-${size}.png`, icon);
  console.log(`Generated icon-${size}.png`);
  
  // Maskable icon
  const maskableIcon = generateIcon(size, true);
  fs.writeFileSync(`public/icon-maskable-${size}.png`, maskableIcon);
  console.log(`Generated icon-maskable-${size}.png`);
});

console.log('Icons generated successfully!');


