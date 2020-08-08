const router = require('express').Router();

router.use('/auth', require('./routes/auth'));
router.use('/users', require('../domains/user/user.controllers'));
router.use('/subscribes', require('../domains/subscription/subscription.controllers'));

module.exports = router;