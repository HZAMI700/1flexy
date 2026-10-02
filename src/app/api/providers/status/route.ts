import { NextResponse } from 'next/server';
import { getProviderHealthList } from '@/services/downloadProviders';

export const dynamic = 'force-dynamic';

export async function GET() {
  const statusList = getProviderHealthList();
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    total_providers: statusList.length,
    active_pool_count: statusList.filter((p) => p.status !== 'quarantined').length,
    quarantined_count: statusList.filter((p) => p.status === 'quarantined').length,
    providers: statusList,
  });
}
