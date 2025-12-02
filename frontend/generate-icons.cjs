// Simple script to generate PWA icons
// Run with: node generate-icons.cjs

const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [192, 512];

function generateIcon(size, maskable = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background - dark
  ctx.fillStyle = '#0a0e17';
  ctx.fillRect(0, 0, size, size);
  
  // Rounded corners (simulated by drawing over corners)
  if (!maskable) {
    const radius = size * 0.2;
    ctx.fillStyle = '#0a0e17';
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, radius);
    ctx.fill();
  }
  
  // Euro symbol with gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#14B8A6');
  gradient.addColorStop(1, '#06B6D4');
  
  ctx.fillStyle = gradient;
  ctx.font = `bold ${size * 0.625}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('€', size / 2, size / 2 + size * 0.05);
  
  return canvas.toBuffer('image/png');
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
