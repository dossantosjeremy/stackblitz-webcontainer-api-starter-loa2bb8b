const fs = require('fs');

class FileUtils {
  ensureFileExists(filePath) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]');
    }
  }
}

module.exports = { FileUtils };