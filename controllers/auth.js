const crypto = require('crypto')
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middlewares/async')
const sendEmail = require('../utils/sendEmail')
const User = require('../models/User')

// @desc      Register user
// @route     POST /worshift/api/v1/auth/register
// @access    Public
exports.register = asyncHandler(async (req, res, next) => {
  const { username, email, password, role } = req.body

  // Create user
  const user = await User.create({
    username,
    email,
    password,
    role,
  })

  sendTokenResponse(user, 200, res)
})

// @desc      Login user
// @route     POST /worshift/api/v1/auth/login
// @access    Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400))
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password')

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401))
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password)

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401))
  }

  sendTokenResponse(user, 200, res)
})

// @desc      Log user out / clear cookie
// @route     GET /worshift/api/v1auth/logout
// @access    Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  })

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc      Get current logged in user
// @route     POST /worshift/api/v1/auth/me
// @access    Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc      Update user details
// @route     PUT  /worshift/api/v1/auth/updatedetails
// @access    Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  // Vérifiez si req.user est défini
  if (!req.user || !req.user.id) {
    return next(new ErrorResponse("L'utilisateur n'est pas authentifié.", 401))
  }

  const fieldsToUpdate = {
    username: req.body.username,
    email: req.body.email,
  }

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  })

  if (!user) {
    return next(new ErrorResponse("L'utilisateur n'a pas été trouvé.", 404))
  }

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc      Update password
// @route     PUT /worshift/api/v1/auth/updatepassword
// @access    Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password')

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401))
  }

  user.password = req.body.newPassword
  await user.save()

  sendTokenResponse(user, 200, res)
})

// @desc      Forgot password
// @route     POST /worshift/api/v1/auth/forgotpassword
// @access    Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404))
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken()

  await user.save({ validateBeforeSave: false })

  // Create reset url
  // const resetUrl = `${req.protocol}://${req.get('host')}/data_pilot/api/v3/auth/resetpassword/${resetToken}`;
  const resetUrl = `${process.env.FRONT_URL}reset-password/${resetToken}`

  const message = `
    Vous recevez cet e-mail car vous (ou quelqu'un d'autre) avez demandé la réinitialisation d'un mot de passe. Veuillez faire une demande à : \n\n ${resetUrl}
  `

  try {
    await sendEmail({
      email: user.email,
      subject: 'Réinitialisation de votre mot de passe DATA PILOT',
      message,
    })

    return res.status(200).json({ success: true, data: 'Email sent' })
  } catch (err) {
    console.log(err)
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save({ validateBeforeSave: false })

    return next(new ErrorResponse('Email could not be sent', 500))
  }
})

// @desc      Reset password
// @route     PUT /worshift/api/v1/auth/resetpassword/:resettoken
// @access    Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  console.log('Reset password function triggered') // Log initial

  // Log the token received from the request
  console.log('Token received from request:', req.params.resettoken)

  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex')

  // Log the hashed token
  console.log('Hashed token:', resetPasswordToken)

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  })

  // Log if the user is found or not
  if (user) {
    console.log('User found with the provided token.')
  } else {
    console.log('No user found with the provided token.')
  }

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400))
  }

  // Set new password
  user.password = req.body.password
  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined

  await user.save()

  console.log('Password reset successful.') // Log when password reset is successful

  sendTokenResponse(user, 200, res)
})

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken()

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  }

  if (process.env.NODE_ENV === 'production') {
    options.secure = true
  }

  // Include role in the response
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    role: user.role,
    customer: user.customer,
  })
}
