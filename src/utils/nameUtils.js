export function sanitizeFunctionName(name) {
  return name
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^(\d)/, '_$1');
}

export function generateOperationId(method, route) {
  const cleanRoute = route
    .replace(/\{[^}]+\}/g, 'By')
    .replace(/[^\w]/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '');
  
  return `${method.toLowerCase()}${cleanRoute.charAt(0).toUpperCase() + cleanRoute.slice(1)}`;
}

export function extractPathParams(route) {
  const matches = route.match(/\{([^}]+)\}/g);
  return matches ? matches.map(match => match.slice(1, -1)) : [];
}

export function sanitizeTagName(tag) {
  return tag
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '');
}