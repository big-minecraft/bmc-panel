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
router.route('/register')
    .post(controller.register);
router.route('/verify')
    .post(controller.verify);
router.route('/login')
    .post(controller.login);
router.route('/verify-login')
    .post(controller.verifyLogin);

module.exports = router;