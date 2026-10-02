import { NextResponse } from 'next/server';
import { runHealthCheckSuite } from '@/services/downloadProviders';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const healthResults = await runHealthCheckSuite();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      total_providers: healthResults.length,
      healthy: healthResults.filter((h) => h.status === 'healthy').length,
      degraded: healthResults.filter((h) => h.status === 'degraded').length,
      quarantined: healthResults.filter((h) => h.status === 'quarantined').length,
      providers: healthResults,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Health check execution failed',
      },
      { status: 500 }
    );
  }
}
