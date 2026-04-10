/**
 * catchAsync — The async error wrapper
 * 
 * WHY? 
 * In standard Express, if an async function throws an error:
 *   1. It becomes a REJECTED PROMISE.
 *   2. Express doesn't automatically catch that (unlike normal errors).
 *   3. The server hangs or crashes.
 * 
 * We normally write try { ... } catch(err) { next(err) }.
 * This is tedious for 50+ controllers.
 * 
 * WHAT IT DOES:
 * It takes an async function (fn) and returns a new function.
 * That new function catches any rejection (...).catch(next)
 * and passes it to our global error middleware.
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

export default catchAsync;
