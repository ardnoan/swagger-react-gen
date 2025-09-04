export function sanitizeFunctionName(name) {
  return name
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^(\d)/, '_$1');
}

export function generateOperationId(method, route) {
  // Hilangkan prefix standar (misalnya /api/v1/)
  let cleanRoute = route.replace(/^\/api\/v\d+\//, '');

  // Ambil nama paling akhir (sesuai yang kamu mau, kayak menus_grid)
  const parts = cleanRoute.split('/');
  let baseName = parts[parts.length - 1] || parts[parts.length - 2];

  // Bersihkan biar valid untuk JS function name
  baseName = baseName
    .replace(/\{[^}]+\}/g, 'By')  // ubah {id} → By
    .replace(/[^\w]/g, '_')       // non-alfanumerik → underscore
    .replace(/__+/g, '_')         // multiple underscore jadi satu
    .replace(/^_+|_+$/g, '');     // hapus underscore awal/akhir

  // Naming sesuai method
  const upperMethod = method.toUpperCase();
  switch (upperMethod) {
    case 'POST':
      return `create_${baseName}`;
    case 'PUT':
    case 'PATCH':
      return `update_${baseName}`;
    case 'DELETE':
      return `delete_${baseName}`;
    case 'GET':
    default:
      return baseName; // GET cukup pakai nama entity
  }
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