import express from 'express';
import landlordRouter from './landlord.js';
import locale from 'locale';
import tenantRouter from './tenant.js';

export default function() {
  const router = express.Router();
  router.use(locale(['fr-FR', 'en-US', 'pt-BR', 'de-DE'], 'en-US'));
  router.use('/landlord', landlordRouter());
  router.use('/tenant', tenantRouter());
  return router;
};
