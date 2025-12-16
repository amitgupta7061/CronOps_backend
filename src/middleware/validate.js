import { ValidationError } from '../utils/errors.js';

/**
 * Creates a validation middleware using a Zod schema
 * @param {Object} schema - Zod schema object
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 */
export const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const data = await schema.parseAsync(req[source]);
      req[source] = data; // Replace with parsed/transformed data
      next();
    } catch (error) {
      next(error); // Let error handler deal with ZodError
    }
  };
};

/**
 * Validates multiple sources at once
 * @param {Object} schemas - Object with 'body', 'query', 'params' keys containing Zod schemas
 */
export const validateRequest = (schemas) => {
  return async (req, res, next) => {
    try {
      const validations = [];

      if (schemas.body) {
        validations.push(
          schemas.body.parseAsync(req.body).then((data) => {
            req.body = data;
          })
        );
      }

      if (schemas.query) {
        validations.push(
          schemas.query.parseAsync(req.query).then((data) => {
            req.query = data;
          })
        );
      }

      if (schemas.params) {
        validations.push(
          schemas.params.parseAsync(req.params).then((data) => {
            req.params = data;
          })
        );
      }

      await Promise.all(validations);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validate;
