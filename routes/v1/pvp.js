const express = require('express');
const router = express.Router();
const PVPController = require('../../controller/pvp.controller');

router.get('/box/filters', PVPController.getFilters);

router.post('/box/list', PVPController.getBoxList);

router.post('/battle/create', PVPController.createBattle);

module.exports = router;