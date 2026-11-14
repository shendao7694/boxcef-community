// @path: api/_middleware.js
import { applyCors, preflightResponse } from './_libs/cors.js';

export async function onRequest(context) {
  const { request, env, next } = context;

  if (request.method.toUpperCase() === 'OPTIONS') {
    return preflightResponse(request, env);
  }

  const response = await next();
  return applyCors(response, request, env);
}
