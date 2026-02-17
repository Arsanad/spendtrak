const sharp = require('sharp');
const path = require('path');

async function resizeIcon() {
  const assetsDir = path.join(__dirname, '../assets');
  const inputPath = path.join(assetsDir, 'logo.png');
  const outputPath = path.join(assetsDir, 'icon-1024.png');
  const iconPath = path.join(assetsDir, 'icon.png');
  const adaptiveIconPath = path.join(assetsDir, 'adaptive-icon.png');

  // Dark background color matching app theme
  const bgColor = { r: 10, g: 10, b: 15 };

  // Target: logo fills 80-85% of canvas
  const canvasSize = 1024;
  const logoSize = Math.round(canvasSize * 0.82); // 82% of canvas = ~840px
  const padding = Math.round((canvasSize - logoSize) / 2); // ~92px padding on each side

  try {
    console.log('Processing logo...');

    // Step 1: Load and trim the logo to remove transparent edges
    const trimmedLogo = await sharp(inputPath)
      .trim() // Remove transparent edges
      .toBuffer();

    // Get trimmed dimensions
    const trimmedMeta = await sharp(trimmedLogo).metadata();
    console.log(`Trimmed logo size: ${trimmedMeta.width}x${trimmedMeta.height}`);

    // Step 2: Resize trimmed logo to fit within logoSize while maintaining aspect ratio
    const resizedLogo = await sharp(trimmedLogo)
      .resize(logoSize, logoSize, {
        fit: 'inside', // Maintain aspect ratio, fit within bounds
        withoutEnlargement: false, // Allow enlarging if needed
      })
      .toBuffer();

    const resizedMeta = await sharp(resizedLogo).metadata();
    console.log(`Resized logo size: ${resizedMeta.width}x${resizedMeta.height}`);

    // Step 3: Create dark background and composite logo centered
    const icon1024 = await sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: { ...bgColor, alpha: 1 }
      }
    })
    .composite([{
      input: resizedLogo,
      gravity: 'center'
    }])
    .flatten({ background: bgColor }) // Remove alpha for App Store
    .png()
    .toFile(outputPath);

    console.log(`\nCreated icon-1024.png (${canvasSize}x${canvasSize})`);
    console.log(`Logo fills ~${Math.round((resizedMeta.width / canvasSize) * 100)}% of width`);

    // Step 4: Also update icon.png (usually 1024x1024 or similar)
    await sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: { ...bgColor, alpha: 1 }
      }
    })
    .composite([{
      input: resizedLogo,
      gravity: 'center'
    }])
    .png()
    .toFile(iconPath);

    console.log(`Updated icon.png`);

    // Step 5: Update adaptive-icon.png for Android (usually needs more padding for safe zone)
    const adaptiveLogoSize = Math.round(canvasSize * 0.65); // 65% for adaptive icon safe zone
    const adaptiveResizedLogo = await sharp(trimmedLogo)
      .resize(adaptiveLogoSize, adaptiveLogoSize, {
        fit: 'inside',
        withoutEnlargement: false,
      })
      .toBuffer();

    await sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: { ...bgColor, alpha: 1 }
      }
    })
    .composite([{
      input: adaptiveResizedLogo,
      gravity: 'center'
    }])
    .png()
    .toFile(adaptiveIconPath);

    console.log(`Updated adaptive-icon.png (with safe zone padding)`);

    // Verify output
    const finalMeta = await sharp(outputPath).metadata();
    console.log('\nVerification:');
    console.log(`  Dimensions: ${finalMeta.width}x${finalMeta.height}`);
    console.log(`  Channels: ${finalMeta.channels} (${finalMeta.channels === 3 ? 'RGB - no alpha' : 'RGBA'})`);
    console.log(`  Format: ${finalMeta.format}`);

    console.log('\n Icon resized successfully!');

  } catch (error) {
    console.error('Error resizing icon:', error.message);
    process.exit(1);
  }
}

resizeIcon();
