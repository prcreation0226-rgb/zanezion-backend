import { sendResponse } from '../utils/response.js';

export const validate = (schema) => (req, res, next) => {
  try {
    if (schema.shape && (schema.shape.body || schema.shape.query || schema.shape.params)) {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;
    } else {
      req.body = schema.parse(req.body);
    }
    next();
  } catch (err) {
    if (err && (err.issues || err.errors)) {
      const issues = err.issues || err.errors;
      const errorMessages = issues.map((e) => {
        const field = e.path[e.path.length - 1];
        return `${field}: ${e.message}`;
      }).join(', ');
      
      console.error("[VALIDATION ERROR]:", errorMessages);
      
      // If the user requested { success: false, message: ..., field: ... }
      // we can return it cleanly for the first error:
      return res.status(400).json({
        success: false,
        message: errorMessages,
        field: issues[0]?.path[issues[0]?.path.length - 1] || null
      });
    }
    return sendResponse(res, 400, `Validation Error: ${err.message || err}`);
  }
};
