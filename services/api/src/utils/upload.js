import multer from 'multer';

// Memory storage for now (we’ll write to disk inside uploadAttachment)
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB
  }
});
