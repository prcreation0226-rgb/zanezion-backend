import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'i14k7hvk',
  api_key: process.env.CLOUDINARY_API_KEY || '619871459582297',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'APdrXDmmW6cTt2gvDNpjMu63X2E'
});

export const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'zanezion';

export default cloudinary;
