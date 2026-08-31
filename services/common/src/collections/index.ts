import mongoose from 'mongoose';

export { default as Account } from './account';
export { default as Document } from './document';
export { default as Email } from './email';
export { default as Lease } from './lease';
export { default as Property } from './property';
export { default as Realm } from './realm';
export { default as Template } from './template';
export { default as Tenant } from './tenant';
export const ObjectId = mongoose.Types.ObjectId;
export const startSession = mongoose.startSession;
