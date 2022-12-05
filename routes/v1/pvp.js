const express = require('express');
const router = express.Router();
const PVPController = require('../../controller/pvp.controller');
var verifyToken = require('../middleware/auth');

router.get('/box/filters', verifyToken, PVPController.getFilters);

router.post('/box/list', verifyToken, PVPController.getBoxList);

router.post('/battle/create', verifyToken, PVPController.createBattle);

router.get('/battle/list', PVPController.getBattleList);

router.get('/battle/:pvpId', PVPController.getBattleByCode);

router.get('/battle/:pvpId/seed', PVPController.getBattleSeedByCode);

router.get('/battle/box/:code', PVPController.getBoxItems);

module.exports = router;