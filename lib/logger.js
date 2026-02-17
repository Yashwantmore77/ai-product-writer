// Lightweight logger + metrics helper with optional Sentry integration.
// - If SENTRY_DSN is set, attempts to dynamically load @sentry/node.
// - Exposes captureException, captureMessage, and simple in-memory metrics.

let Sentry = null;
let sentryEnabled = false;

const metrics = {
  requests: 0,
  successes: 0,
  failures: 0,
  providerSuccess: {},
  providerFailures: {},
};

async function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  try {
    // Construct specifier to avoid static bundler resolution when package is missing
    const spec = '@' + 'sentry/node';
    const mod = await import(spec);
    Sentry = mod.default || mod;
    Sentry.init({ dsn, tracesSampleRate: 0.0 });
    sentryEnabled = true;
    console.info('Sentry initialized');
  } catch (err) {
    console.warn('Sentry not initialized (module missing or load failed):', err.message);
  }
}

// Start Sentry init but don't block module import
initSentry();

export function captureException(err, context = {}) {
  try {
    console.error('Captured exception:', err && err.message ? err.message : err, context);
    if (sentryEnabled && Sentry) {
      Sentry.captureException(err, { extra: context });
    }
  } catch (e) {
    console.error('Error in captureException:', e.message);
  }
}

export function captureMessage(message, level = 'info', context = {}) {
  try {
    if (level === 'warn') console.warn(message, context);
    else if (level === 'error') console.error(message, context);
    else console.log(message, context);

    if (sentryEnabled && Sentry) {
      Sentry.captureMessage(message, level);
    }
  } catch (e) {
    console.error('Error in captureMessage:', e.message);
  }
}

export function metricInc(key, amount = 1) {
  try {
    if (typeof key !== 'string') return;
    metrics[key] = (metrics[key] || 0) + amount;
  } catch (e) {
    console.error('metricInc error:', e.message);
  }
}

export function metricProviderSuccess(provider) {
  metrics.providerSuccess[provider] = (metrics.providerSuccess[provider] || 0) + 1;
}

export function metricProviderFailure(provider) {
  metrics.providerFailures[provider] = (metrics.providerFailures[provider] || 0) + 1;
}

export function getMetrics() {
  return metrics;
}

export default {
  captureException,
  captureMessage,
  metricInc,
  metricProviderSuccess,
  metricProviderFailure,
  getMetrics,
};
