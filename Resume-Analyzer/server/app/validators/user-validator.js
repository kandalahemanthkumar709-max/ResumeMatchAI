import Joi from 'joi';

export const userRegistrationSchema = Joi.object({
    name: Joi.string().min(2).required().messages({
        'string.empty': 'Name is required',
        'string.min': 'Name is too short'
    }),
    email: Joi.string().email().required().messages({
        'string.empty': 'Email is required',
        'string.email': 'Please include a valid email'
    }),
    password: Joi.string().min(6).required().messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Passwords do not match',
        'string.empty': 'Confirm password is required'
    }),
    role: Joi.string().valid('seeker', 'recruiter').required().messages({
        'any.only': 'Role must be Seeker or Recruiter'
    })
});

export const userLoginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.empty': 'Email is required',
        'string.email': 'Please include a valid email'
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Password is required'
    })
});

