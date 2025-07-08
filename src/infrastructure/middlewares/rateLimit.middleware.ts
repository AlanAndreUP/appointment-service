import rateLimit from 'express-rate-limit';

export const createRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana de tiempo
  message: {
    data: null,
    message: 'Demasiadas peticiones, por favor intenta más tarde',
    status: 'error',
    error: {
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // máximo 20 requests por ventana para endpoints sensibles
  message: {
    data: null,
    message: 'Demasiadas peticiones para este endpoint, por favor intenta más tarde',
    status: 'error',
    error: {
      code: 'STRICT_RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
}); 