import express from 'express';
import locale from 'locale';
import landlordRouter from './landlord';
import tenantRouter from './tenant';

export default function () {
  const router = express.Router();
  router.use(locale(['fr-FR', 'en-US', 'pt-BR', 'de-DE', 'es-CO'], 'en-US'));
  router.use('/landlord', landlordRouter());
  router.use('/tenant', tenantRouter());
  return router;
}
