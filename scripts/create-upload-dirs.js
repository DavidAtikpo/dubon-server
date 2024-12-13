const fs = require('fs');
const path = require('path');

const uploadDirs = [
  'idCard',
  'proofOfAddress', 
  'photos', 
  'taxCertificate', 
  'signedDocument'
];

const baseUploadPath = path.join(__dirname, '../uploads');

uploadDirs.forEach(dir => {
  const fullPath = path.join(baseUploadPath, dir);
  
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${fullPath}`);
  }
});

console.log('Upload directories setup complete.'); 