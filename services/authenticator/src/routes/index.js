const express = require('express');
const locale = require('locale');
const landlordRouter = require('./landlord');
const tenantRouter = require('./tenant');

const router = express.Router();
router.use(locale(['fr-FR', 'en-US', 'pt-BR', 'de-DE'], 'en-US'));
router.use('/landlord', landlordRouter);
router.use('/tenant', tenantRouter);

module.exports = router;
