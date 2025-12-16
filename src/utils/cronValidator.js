import cronParser from 'cron-parser';
import { BadRequestError } from './errors.js';

/**
 * Validates a cron expression
 * @param {string} expression - The cron expression to validate
 * @param {string} timezone - The timezone for the cron expression
 * @returns {boolean} - True if valid
 * @throws {BadRequestError} - If invalid
 */
export function validateCronExpression(expression, timezone = 'UTC') {
  try {
    cronParser.parseExpression(expression, { tz: timezone });
    return true;
  } catch (error) {
    throw new BadRequestError(`Invalid cron expression: ${error.message}`);
  }
}

/**
 * Gets the next execution time for a cron expression
 * @param {string} expression - The cron expression
 * @param {string} timezone - The timezone
 * @returns {Date} - The next execution time
 */
export function getNextExecution(expression, timezone = 'UTC') {
  try {
    const interval = cronParser.parseExpression(expression, { tz: timezone });
    return interval.next().toDate();
  } catch (error) {
    return null;
  }
}

/**
 * Gets the previous execution time for a cron expression
 * @param {string} expression - The cron expression
 * @param {string} timezone - The timezone
 * @returns {Date} - The previous execution time
 */
export function getPreviousExecution(expression, timezone = 'UTC') {
  try {
    const interval = cronParser.parseExpression(expression, { tz: timezone });
    return interval.prev().toDate();
  } catch (error) {
    return null;
  }
}

/**
 * Parses cron expression to human-readable format
 * @param {string} expression - The cron expression
 * @returns {string} - Human readable description
 */
export function describeCronExpression(expression) {
  const parts = expression.trim().split(/\s+/);
  
  if (parts.length < 5 || parts.length > 6) {
    return 'Invalid cron expression';
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  const descriptions = [];

  if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'Every minute';
  }

  if (minute === '0' && hour === '*') {
    return 'Every hour';
  }

  if (minute === '0' && hour === '0' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'Every day at midnight';
  }

  return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
}
