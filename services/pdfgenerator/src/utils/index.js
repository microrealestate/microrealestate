import path from 'path';
import sfn from 'sanitize-filename';

export function sanitize(name = '') {
  return sfn(name, { replacement: '_' });
}

export function sanitizePath(filePath = '') {
  return filePath
    ?.split(path.sep)
    .map((element) => sfn(element, { replacement: '_' }))
    .join(path.sep);
}
