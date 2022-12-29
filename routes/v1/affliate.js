const app = require('express');
const router = app.Router();
const AffliateController = require('../../controller/affliate.controller');

router.post('/set/promo', AffliateController.setPromoCode);

module.exports = router;