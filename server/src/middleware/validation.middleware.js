import { validationResult } from 'express-validator'

/**
 * Validate request using express-validator
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    })
  }

  next()
}

/**
 * Pagination validation
 */
export const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10

  if (page < 1) {
    return res.status(400).json({
      success: false,
      message: 'Page must be greater than 0'
    })
  }

  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100'
    })
  }

  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit
  }

  next()
}

/**
 * Year validation
 */
export const validateYear = (req, res, next) => {
  const year = parseInt(req.params.year || req.query.year)

  if (!year || year < 2000 || year > 2100) {
    return res.status(400).json({
      success: false,
      message: 'Invalid year'
    })
  }

  req.year = year
  next()
}
