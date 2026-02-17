import { NextResponse } from 'next/server';
import { getMetrics } from '../../../lib/logger';

export async function GET(request) {
  // Only expose metrics in development or if explicitly enabled
  const allow = process.env.NODE_ENV === 'development' || process.env.EXPOSE_METRICS === 'true';
  if (!allow) {
    return NextResponse.json({ error: 'Metrics not available' }, { status: 403 });
  }

  try {
    const metrics = getMetrics();
    return NextResponse.json({ metrics });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read metrics' }, { status: 500 });
  }
}
