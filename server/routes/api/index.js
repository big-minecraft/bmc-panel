const express = require('express'),
  { api: controller } = require('../../controllers');


const router = express.Router();

router.route('/')
  .get(controller.getMain);

router.route('/json')
  .get(controller.getJson);
router.route('/servers')
    .get(controller.getPods);
router.route('/instances')
    .get(controller.getInstances);

module.exports = router;