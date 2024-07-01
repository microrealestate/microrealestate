import * as db from './db.js';
import logger from 'winston';

export default class Model {
  constructor(collection) {
    this.collection = collection;
    db.addCollection(collection);
  }

  findOne(realm, id, callback) {
    db.findItemById(realm, this.collection, id, (errors, dbItems) => {
      if (errors && errors.length > 0) {
        callback(errors);
        return;
      }

      const item = dbItems && dbItems.length > 0 ? dbItems[0] : null;
      callback(null, this.schema ? this.schema.filter(item) : item);
    });
  }

  findAll(realm, callback) {
    this.findFilter(realm, {}, callback);
  }

  findFilter(realm, filter, callback) {
    db.listWithFilter(realm, this.collection, filter, (errors, dbItems) => {
      if (errors && errors.length > 0) {
        callback(errors);
        return;
      }
      const items = dbItems || [];
      if (this.schema) {
        items.forEach((item, index) => {
          items[index] = this.schema.filter(item);
        });
      }
      callback(null, items);
    });
  }

  upsert(realm, query, fieldsToSet, fieldsToSetOnInsert, callback) {
    const updateSchema = this.updateSchema || this.schema;

    if (!updateSchema.exists(fieldsToSet)) {
      logger.error('cannot update', this.collection, fieldsToSet, 'not valid');
      callback(['cannot update database fields not valid']);
      return;
    }

    db.upsert(
      realm,
      this.collection,
      query,
      fieldsToSet,
      this.schema.filter(fieldsToSetOnInsert),
      (errors) => {
        if (errors && errors.length > 0) {
          callback(errors);
          return;
        }
        callback(null);
      }
    );
  }

  update(realm, item, callback) {
    const updateSchema = this.updateSchema || this.schema;
    const itemToUpdate = updateSchema.filter(item);
    db.update(realm, this.collection, itemToUpdate, (errors, dbItem) => {
      if (errors && errors.length > 0) {
        return callback(errors);
      }
      callback(null, this.schema.filter(dbItem));
    });
  }

  add(realm, item, callback) {
    const addSchema = this.addSchema || this.schema;
    const itemToAdd = addSchema.filter(item);
    db.add(realm, this.collection, itemToAdd, (errors, dbItem) => {
      if (errors && errors.length > 0) {
        callback(errors);
        return;
      }
      callback(null, this.schema.filter(dbItem));
    });
  }

  remove(realm, ids, callback) {
    db.remove(realm, this.collection, ids, (errors) => {
      callback(errors && errors.length > 0 ? errors : null);
    });
  }
}
