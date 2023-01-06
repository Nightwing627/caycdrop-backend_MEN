const app = require('express');
const router = app.Router();
const AffliateController = require('../../controller/affliate.controller');

router.post('/set/promo', AffliateController.setPromoCode);

router.post('/set/order', AffliateController.setOrder);

module.exports = router;