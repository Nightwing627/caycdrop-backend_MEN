const express = require('express');
const router = express.Router();
const PVPController = require('../../controller/pvp.controller');

router.get('/box/filters', PVPController.getFilters);

router.post('/box/list', PVPController.getBoxList);

router.post('/battle/create', PVPController.createBattle);

router.get('/battle/:pvpId', PVPController.getBattleByCode);

router.get('/battle/:pvpId/seed', PVPController.getBattleSeedByCode);

module.exports = router;