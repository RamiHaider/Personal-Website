const fs = require('fs');
const path = require('path');

// Paths
const sourceFile = path.join(__dirname, '..', 'appointments.json');
const destFile = path.join(__dirname, 'appointments.json');

// Copy the file
try {
  console.log('Copying appointments.json to public directory...');
  console.log('Source file:', sourceFile);
  console.log('Destination file:', destFile);
  
  // Check if source file exists
  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Source file not found: ${sourceFile}`);
  }
  
  // Copy the file
  fs.copyFileSync(sourceFile, destFile);
  
  // Verify the copy
  if (!fs.existsSync(destFile)) {
    throw new Error('Destination file was not created');
  }
  
  const stats = fs.statSync(destFile);
  console.log('File copied successfully!');
  console.log('File size:', stats.size, 'bytes');
} catch (error) {
  console.error('Error copying file:', error);
  process.exit(1);
} 