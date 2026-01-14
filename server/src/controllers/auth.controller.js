import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'

/**
 * Generate JWT tokens
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  )

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  )

  return { accessToken, refreshToken }
}

/**
 * Register new user
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      })
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      role: role || 'staff'
    })

    // Generate tokens
    const tokens = generateTokens(user.id)

    // Save refresh token
    await user.update({ refreshToken: tokens.refreshToken })

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        ...tokens
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Login user
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive'
      })
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Generate tokens
    const tokens = generateTokens(user.id)

    // Update user
    await user.update({
      refreshToken: tokens.refreshToken,
      lastLogin: new Date()
    })

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        ...tokens
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Refresh access token
 */
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required'
      })
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

    // Find user
    const user = await User.findByPk(decoded.id)
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      })
    }

    // Generate new tokens
    const tokens = generateTokens(user.id)

    // Update refresh token
    await user.update({ refreshToken: tokens.refreshToken })

    res.json({
      success: true,
      message: 'Token refreshed',
      data: tokens
    })
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      })
    }
    next(error)
  }
}

/**
 * Logout user
 */
export const logout = async (req, res, next) => {
  try {
    // Clear refresh token
    await req.user.update({ refreshToken: null })

    res.json({
      success: true,
      message: 'Logout successful'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get current user profile
 */
export const getProfile = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: req.user.toJSON()
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update user profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body

    await req.user.update({
      ...(name && { name }),
      ...(email && { email })
    })

    res.json({
      success: true,
      message: 'Profile updated',
      data: req.user.toJSON()
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Change password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    // Verify current password
    const isValid = await req.user.comparePassword(currentPassword)
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      })
    }

    // Update password
    await req.user.update({ password: newPassword })

    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    next(error)
  }
}
