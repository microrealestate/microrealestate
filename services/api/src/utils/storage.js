/* eslint-disable sort-imports */
import { Service } from '@microrealestate/common';
import path from 'path';

const DEFAULT_UPLOADS_DIRECTORY = path.resolve(
  process.cwd(),
  'data',
  'uploads'
);

export function getUploadsDirectory(...segments) {
  const { UPLOADS_DIRECTORY } = Service.getInstance().envConfig.getValues();
  const baseDirectory = UPLOADS_DIRECTORY || DEFAULT_UPLOADS_DIRECTORY;

  if (!segments.length) {
    return baseDirectory;
  }

  return path.resolve(baseDirectory, ...segments);
}