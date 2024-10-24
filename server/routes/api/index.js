const express = require('express'),
  { api: controller } = require('../../controllers');


const router = express.Router();

router.route('/')
  .get(controller.getMain);

router.route('/json')
  .get(controller.getJson);
router.route('/instances')
    .get(controller.getInstances);
router.route('/proxies')
    .get(controller.getProxies);

module.exports = router;