// Jest setup - patch module resolution before any tests run
const originalResolve = require('jest-resolve').default.resolve;

require('jest-resolve').default.resolve = function(request, options) {
  // If the request contains @/ prefix, resolve it to src/
  if (request.startsWith('@/')) {
    const modulePath = request.replace('@/', '');
    const resolved = require('path').resolve(options.rootDir, 'src', modulePath);
    return originalResolve.call(this, resolved + '.ts', options);
  }
  
  // For relative paths from src directory
  if (request.includes('/src/') && !request.endsWith('.js')) {
    const resolved = request + '.ts';
    return originalResolve.call(this, resolved, options);
  }
  
  return originalResolve.call(this, request, options);
};

console.log('Jest path resolution patched');