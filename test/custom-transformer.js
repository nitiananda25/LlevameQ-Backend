const tsJest = require('ts-jest');
const path = require('path');

const transformer = {
  process(src, fileName, jestOptions) {
    // Handle path aliases in the source files
    const processed = src.replace(/from\s+['"]@\/([^'"]+)['"]/g, (match, modulePath) => {
      const resolvedPath = path.relative(path.dirname(fileName), path.join(__dirname, 'src', modulePath));
      return `from './${resolvedPath.replace(/\\/g, '/')}'`;
    });
    
    return tsJest.createTransformer()(processed, fileName, jestOptions);
  }
};

module.exports = transformer;