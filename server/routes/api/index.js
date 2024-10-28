const express = require('express');
const { api: controller } = require('../../controllers');
const {verifyToken, verifyAdminToken} = require('../../middleware/auth');

const router = express.Router();

router.route('/instances')
    .get(verifyToken, controller.getInstances);

router.route('/proxies')
    .get(verifyToken, controller.getProxies);

router.route('/gamemodes')
    .get(verifyToken, controller.getGamemodes)
    .post(verifyToken, controller.createGamemode);

router.route('/gamemodes/:name')
    .get(verifyToken, controller.getGamemodeContent)
    .put(verifyToken, controller.updateGamemodeContent)
    .patch(verifyToken, controller.toggleGamemode)
    .delete(verifyToken, controller.deleteGamemode);

router.route('/register')
    .post(controller.register);

router.route('/verify')
    .post(controller.verify);

router.route('/login')
    .post(controller.login);

router.route('/verify-login')
    .post(controller.verifyLogin);

router.route('/invite-codes')
    .get(verifyAdminToken, controller.getInviteCodes)
    .post(verifyAdminToken, controller.createInviteCode);

router.route('/invite-codes/:code')
    .delete(verifyAdminToken, controller.revokeInviteCode);

router.route('/verify-invite')
    .post(verifyToken, controller.verifyInvite);

router.route('/users')
    .get(verifyAdminToken, controller.getUsers);

router.route('/users/:id/admin')
    .patch(verifyAdminToken, controller.setAdmin);

router.route('/users/:id/password')
    .patch(verifyAdminToken, controller.resetPassword);

router.route('/users/:id')
    .delete(verifyAdminToken, controller.deleteUser);

router.route('/logout')
    .post(verifyToken, controller.logout);



module.exports = router;