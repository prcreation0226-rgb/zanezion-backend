import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 8000,
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'zanezion_super_secret_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'zanezion_refresh_secret_key_2026',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  databaseUrl: process.env.DATABASE_URL,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || 'i14k7hvk',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '619871459582297',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || 'APdrXDmmW6cTt2gvDNpjMu63X2E',
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER || 'zanezion',
};
