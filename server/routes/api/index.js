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
router.route('/gamemodes')
    .get(controller.getGamemodes)
    .post(controller.createGamemode);
router.route('/gamemodes/:name')
    .get(controller.getGamemodeContent)
    .put(controller.updateGamemodeContent)
    .patch(controller.toggleGamemode)
    .delete(controller.deleteGamemode);

module.exports = router;