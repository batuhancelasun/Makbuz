// Simple script to generate PWA icons from makbuz.png
// Run with: node generate-icons.cjs

const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

const sizes = [192, 512];

async function generateIcon(size, maskable = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Load the logo image
  const logo = await loadImage('public/makbuz.png');
  
  // Background - use white for both to ensure logo visibility
  // White background works best for PWA icons on most platforms
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  
  // Calculate padding (10% on each side for maskable, 5% for regular)
  const padding = maskable ? size * 0.1 : size * 0.05;
  const iconSize = size - (padding * 2);
  
  // Ensure proper image rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw the logo centered and scaled
  // Use source-over composite to ensure logo is visible
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(logo, padding, padding, iconSize, iconSize);
  
  return canvas.toBuffer('image/png');
}

// Generate icons
(async () => {
  try {
    for (const size of sizes) {
      // Regular icon
      const icon = await generateIcon(size, false);
      fs.writeFileSync(`public/icon-${size}.png`, icon);
      console.log(`Generated icon-${size}.png`);
      
      // Maskable icon
      const maskableIcon = await generateIcon(size, true);
      fs.writeFileSync(`public/icon-maskable-${size}.png`, maskableIcon);
      console.log(`Generated icon-maskable-${size}.png`);
    }
    console.log('Icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
})();
