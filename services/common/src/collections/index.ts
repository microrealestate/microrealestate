import mongoose from 'mongoose';

export { default as Account } from './account.js';
export { default as Document } from './document.js';
export { default as Email } from './email.js';
export { default as Lease } from './lease.js';
export { default as Property } from './property.js';
export { default as Realm } from './realm.js';
export { default as Template } from './template.js';
export { default as Tenant } from './tenant.js';
export const ObjectId = mongoose.Types.ObjectId;
