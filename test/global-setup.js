// Global setup - runs before any test modules are loaded
const path = require('path');

// Store the original resolver
const originalResolve = require('jest-resolve').default.resolve.bind(require('jest-resolve').default);

// Patch the resolve function to handle @/ path aliases
require('jest-resolve').default.resolve = function(request, options) {
  // Handle @/ path aliases
  if (request.startsWith('@/')) {
    const modulePath = request.replace('@/', '');
    const resolvedPath = path.resolve(options.rootDir, 'src', modulePath);
    console.log(`[GlobalSetup] Resolving @/${modulePath} to ${resolvedPath}`);
    return originalResolve(resolvedPath + '.ts', options);
  }
  
  // Handle relative paths from src
  if (request.startsWith('../src/') || request.startsWith('./src/')) {
    const resolvedPath = path.resolve(options.rootDir, request);
    console.log(`[GlobalSetup] Resolving ${request} to ${resolvedPath}`);
    return originalResolve(resolvedPath, options);
  }
  
  return originalResolve(request, options);
};

console.log('[GlobalSetup] Jest resolver patched for @/ path aliases');