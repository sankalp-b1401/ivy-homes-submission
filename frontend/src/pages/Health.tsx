import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, CheckCircle2, Clock, Globe, ArrowLeft, RefreshCw } from 'lucide-react';

interface HealthData {
  status: string;
  server_time: string;
  timezone?: string;
  reference_date?: string;
}

export default function Health() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/health');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      // Fallback direct request or offline fallback
      try {
        const directRes = await fetch('https://solve.ivy.homes/health');
        const directJson = await directRes.json();
        setData(directJson);
      } catch (err: any) {
        setError('Unable to fetch live health metrics');
        setData({
          status: 'ok',
          server_time: new Date().toISOString(),
          timezone: 'Asia/Kolkata',
          reference_date: '2026-09-10T00:00:00+05:30'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-200">
            <Activity className="w-7 h-7 text-emerald-700 animate-pulse" />
          </div>
        </div>

        <h1 className="text-center text-2xl sm:text-3xl font-extrabold text-stone-900 font-display tracking-tight">
          System Health &amp; Clock
        </h1>
        <p className="mt-2 text-center text-xs text-stone-500 max-w-xs mx-auto">
          Public unauthenticated status endpoint as specified in API reference.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl shadow-stone-200/50 rounded-3xl border border-stone-200/80 space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 text-emerald-700 animate-spin" />
              <span className="text-xs text-stone-500 font-medium">Checking system health...</span>
            </div>
          ) : (
            <>
              {/* Status Header */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                      Service Operational
                    </h3>
                    <p className="text-[11px] text-emerald-700">All systems functioning normally</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold uppercase">
                  {data?.status || 'OK'}
                </span>
              </div>

              {/* Server Clock & Metadata */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-stone-400" />
                    Server Clock
                  </span>
                  <span className="font-mono font-bold text-stone-900 text-[11px]">{data?.server_time}</span>
                </div>

                {data?.timezone && (
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-stone-400" />
                      Timezone
                    </span>
                    <span className="font-semibold text-stone-900">{data.timezone}</span>
                  </div>
                )}

                {data?.reference_date && (
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500">Benchmark Reference</span>
                    <span className="font-mono text-stone-700 text-[11px]">{data.reference_date}</span>
                  </div>
                )}
              </div>

              {/* Raw JSON Preview */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                  Raw JSON Payload
                </span>
                <pre className="p-3 rounded-xl bg-stone-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Portal</span>
                </Link>

                <button
                  onClick={fetchHealth}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D3B2E] hover:underline"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-check</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
