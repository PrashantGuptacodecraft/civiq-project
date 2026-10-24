export const MAX_MEDIA_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
];
export const FORBIDDEN_EXTENSIONS = new Set([
    '.exe', '.bat', '.cmd', '.sh', '.bash', '.ps1', '.vbs', '.js',
    '.html', '.htm', '.php', '.py', '.pl', '.jar', '.msi', '.dll',
    '.com', '.scr', '.pif', '.reg', '.wsf', '.cpl',
]);
