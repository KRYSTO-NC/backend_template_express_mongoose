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

//include other resources router
const pointageRouter = require('./pointages')
const maladieRouter = require('./maladies')
const router = express.Router({ mergeParams: true })

//Re-route into other ressource routers
router.use('/:userId/pointages', pointageRouter)
router.use('/:userId/maladies', maladieRouter)

const { protect, authorize } = require('../middlewares/auth')
const User = require('../models/User')
const advancedResults = require('../middlewares/advancedResults')

// router.use(protect)
// router.use(authorize('admin', 'staff'))

router
  .route('/')
  .get(advancedResults(User, 'customer contrats card'), getUsers)

  .post(createUser)

router.route('/code/:code').get(findUserByCode)

router.route('/:id').get(getUser).put(updateUser).delete(deleteUser)
router.route('/:id/photo').put(uploadUserPhoto)
module.exports = router
