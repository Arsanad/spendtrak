const sharp = require('sharp');
const path = require('path');

async function prepareIcon() {
  const assetsDir = path.join(__dirname, '../assets');
  const inputPath = path.join(assetsDir, 'icon.png');
  const outputPath = path.join(assetsDir, 'icon-1024.png');

  try {
    // Resize to 1024x1024 and remove alpha channel with dark background
    await sharp(inputPath)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 10, g: 10, b: 15, alpha: 1 } // Dark background matching app theme
      })
      .flatten({ background: { r: 10, g: 10, b: 15 } }) // Remove alpha/transparency
      .png()
      .toFile(outputPath);

    console.log('App Store icon created successfully: assets/icon-1024.png');
    console.log('Dimensions: 1024x1024');
    console.log('Alpha channel: removed (opaque)');

    // Verify the output
    const metadata = await sharp(outputPath).metadata();
    console.log('\nVerification:');
    console.log(`  Width: ${metadata.width}`);
    console.log(`  Height: ${metadata.height}`);
    console.log(`  Channels: ${metadata.channels} (${metadata.channels === 3 ? 'RGB - no alpha' : 'RGBA - has alpha'})`);
    console.log(`  Format: ${metadata.format}`);

    if (metadata.width === 1024 && metadata.height === 1024 && metadata.channels === 3) {
      console.log('\n App Store requirements met!');
    } else if (metadata.channels === 4) {
      console.log('\n Warning: Image still has alpha channel. Re-processing...');
      // Force remove alpha by converting to JPEG and back to PNG
      await sharp(outputPath)
        .jpeg()
        .toBuffer()
        .then(buffer => sharp(buffer).png().toFile(outputPath));
      console.log('Re-processed to remove alpha channel.');
    }

  } catch (error) {
    console.error('Error preparing icon:', error.message);
    process.exit(1);
  }
}

prepareIcon();
