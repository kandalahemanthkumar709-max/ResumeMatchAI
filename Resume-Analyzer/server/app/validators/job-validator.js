import Joi from 'joi';

export const jobSchema = Joi.object({
    title: Joi.string().max(150).required().messages({
        'string.empty': 'Job title is required',
        'string.max': 'Title cannot exceed 150 characters'
    }),
    company: Joi.string().required().messages({
        'string.empty': 'Company name is required'
    }),
    companyLogo: Joi.string().allow('', null),
    location: Joi.string().allow('', null),
    locationType: Joi.string().valid('remote', 'hybrid', 'onsite').default('onsite'),
    description: Joi.string().required().messages({
        'string.empty': 'Job description is required'
    }),
    requirements: Joi.string().allow('', null),
    salary: Joi.object({
        min: Joi.number(),
        max: Joi.number(),
        currency: Joi.string().default('USD'),
        isVisible: Joi.boolean().default(true)
    }).allow(null),
    jobType: Joi.string().valid('full-time', 'part-time', 'contract', 'internship', 'freelance').default('full-time'),
    expiresAt: Joi.date(),
    education_required: Joi.string().allow('', null)
});
