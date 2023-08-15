const express = require('express')
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  uploadUserPhoto,
  findUserByCode,
} = require('../controllers/users')

const router = express.Router({ mergeParams: true })

const { protect, authorize } = require('../middlewares/auth')
const User = require('../models/User')
const advancedResults = require('../middlewares/advancedResults')

// router.use(protect)
// router.use(authorize('admin', 'staff'))

router
  .route('/')
  .get(advancedResults(User), getUsers)

  .post(createUser)

router.route('/:id').get(getUser).put(updateUser).delete(deleteUser)
router.route('/:id/photo').put(uploadUserPhoto)
module.exports = router
