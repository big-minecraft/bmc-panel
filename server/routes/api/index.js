const express = require('express');
const { api: controller } = require('../../controllers');
const {verifyToken, verifyAdminToken} = require('../../middleware/auth');
const {patch} = require("request");

const router = express.Router();

router.route('/instances')
    .get(controller.getInstances);

router.route('/proxies')
    .get(verifyToken, controller.getProxies);

router.route('/gamemodes')
    .get(verifyToken, controller.getGamemodes)
    .post(verifyToken, controller.createGamemode);

router.route('/gamemodes/:name')
    .get(verifyToken, controller.getGamemodeContent)
    .put(verifyToken, controller.updateGamemodeContent)
    .patch(verifyToken, controller.toggleGamemode)
    .delete(verifyToken, controller.deleteGamemode)
    .post(verifyToken, controller.restartGamemode);

router.route('/proxy-config')
    .get(verifyToken, controller.getProxyConfig)

router.route('/proxy')
    .get(verifyToken, controller.getProxyContent)
    .put(verifyToken, controller.updateProxyContent)
    .patch(verifyToken, controller.toggleProxy)
    .post(verifyToken, controller.restartProxy);

router.route('/register')
    .post(controller.register);

router.route('/verify')
    .post(controller.verify);

router.route('/login')
    .post(controller.login);

router.route('/verify-invite')
    .post(controller.verifyInvite);

router.route('/verify-login')
    .post(controller.verifyLogin);

router.route('/invite-codes')
    .get(verifyAdminToken, controller.getInviteCodes)
    .post(verifyAdminToken, controller.createInviteCode);

router.route('/invite-codes/:code')
    .delete(verifyAdminToken, controller.revokeInviteCode);

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

router.route('/sftp/files')
    .get(verifyToken, controller.getSFTPFiles);

router.route('/sftp/file')
    .get(verifyToken, controller.getSFTPFileContent)
    .post(verifyToken, controller.createSFTPFile)
    .put(verifyToken, controller.updateSFTPFile)
    .delete(verifyToken, controller.deleteSFTPFile);

router.route('/sftp/directories')
    .post(verifyToken, controller.createSFTPDirectory);

router.route('/sftp/directory')
    .delete(verifyToken, controller.deleteSFTPDirectory);

router.route('/sftp/upload')
    .post(verifyToken, controller.uploadSFTPFiles);

router.route('/sftp/download')
    .get(verifyToken, controller.downloadSFTPFile)

router.route('/sftp/download-multiple')
    .post(verifyToken, controller.downloadSFTPFiles);

router.route('/sftp/archive')
    .post(verifyToken, controller.archiveSFTPFile);

router.route('/sftp/archive-multiple')
    .post(verifyToken, controller.archiveSFTPFiles);

router.route('/sftp/move')
    .post(verifyToken, controller.moveSFTPFile);

router.route('/sftp/unarchive')
    .post(verifyToken, controller.unarchiveSFTPFile);

router.route('/databases')
    .get(verifyToken, controller.getDatabases)
    .post(verifyToken, controller.createDatabase);

router.route('/databases/:name')
    .delete(verifyToken, controller.deleteDatabase)
    .patch(verifyToken, controller.resetDatabasePassword);

router.route('/nodes')
    .get(verifyToken, controller.getNodes);

router.route('/metrics/cpu')
    .get(controller.getCPUMetrics);

router.route('/metrics/memory')
    .get(controller.getMemoryMetrics);


module.exports = router;