// Custom Jest resolver for path aliases
const path = require('path');

module.exports = (request, options) => {
  // Handle @/* path aliases
  if (request.startsWith('@/')) {
    const moduleName = request.replace('@/', '');
    const resolvedPath = path.resolve(options.rootDir, 'src', moduleName);
    return options.defaultResolver(resolvedPath, options);
  }
  
  // Handle relative paths from src directory
  if (request.startsWith('../src/')) {
    const resolvedPath = path.resolve(options.rootDir, request);
    return options.defaultResolver(resolvedPath, options);
  }
  
  // Default resolution
  return options.defaultResolver(request, options);
};