import type { HydratedDocument } from 'mongoose';

// Mongoose document
export type MongooseDocType<T> = HydratedDocument<T>;
