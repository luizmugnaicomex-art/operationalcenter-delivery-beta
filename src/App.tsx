import React, { useState, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, ComposedChart, Area, ReferenceLine, Cell, LabelList
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Package, CheckCircle, Clock, Calendar, 
  Upload, AlertTriangle, LayoutDashboard, FileSpreadsheet, ShieldAlert,
  Flame, Info, AlertCircle
} from 'lucide-react';

// Initial data fallback
const INITIAL_DATA = [
  { date: '2026-03-23', day: 'Mon', scheduled: 134, totalBacklog: 134, actual: 99, postponed: 35, efficiency: 73.9 },
  { date: '2026-03-24', day: 'Tue', scheduled: 165, totalBacklog: 200, actual: 122, postponed: 78, efficiency: 61.0 },
  { date: '2026-03-25', day: 'Wed', scheduled: 137, totalBacklog: 215, actual: 111, postponed: 104, efficiency: 51.6 },
  { date: '2026-03-26', day: 'Thu', scheduled: 69, totalBacklog: 173, actual: 168, postponed: 5, efficiency: 97.1 },
  { date: '2026-03-27', day: 'Fri', scheduled: 164, totalBacklog: 169, actual: 117, postponed: 52, efficiency: 69.2 },
  { date: '2026-03-28', day: 'Sat', scheduled: 30, totalBacklog: 82, actual: 48, postponed: 34, efficiency: 58.5 },
  { date: '2026-03-30', day: 'Mon', scheduled: 169, totalBacklog: 169, actual: 161, postponed: 8, efficiency: 95.3 },
  { date: '2026-03-31', day: 'Tue', scheduled: 199, totalBacklog: 207, actual: 121, postponed: 86, efficiency: 58.5 }
];

const KpiCard = ({ title, value, icon: Icon, color, status }: any) => (
  <div className={`bg-white p-6 rounded-2xl border-2 shadow-sm transition-all hover:shadow-md ${status === 'critical' ? 'border-red-500 bg-red-50 animate-pulse' : 'border-slate-100'}`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {status === 'critical' && (
        <span className="flex items-center text-xs font-black uppercase text-red-600 bg-red-100 px-2 py-1 rounded">
          <ShieldAlert className="w-3 h-3 mr-1" /> Critical
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-bold mb-1 uppercase tracking-tighter">{title}</h3>
    <p className={`text-3xl font-black ${status === 'critical' ? 'text-red-700' : 'text-slate-900'}`}>{value}</p>
  </div>
);

const App = () => {
  const [data, setData] = useState(INITIAL_DATA);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n').map(line => line.split(','));
      if (lines.length < 6) return;

      const days = lines[0];
      const dates = lines[1];
      const scheduledRow = lines[2];
      const backlogRow = lines[3];
      const actualRow = lines[4];
      const postponedRow = lines[5];

      const parsedData = [];
      for (let i = 1; i < dates.length; i++) {
        const date = dates[i]?.trim();
        if (!date || date === "") continue;

        const scheduled = parseInt(scheduledRow[i]) || 0;
        const totalBacklog = parseInt(backlogRow[i]) || 0;
        const actual = parseInt(actualRow[i]) || 0;
        const postponed = parseInt(postponedRow[i]) || 0;
        const efficiency = totalBacklog > 0 ? ((actual / totalBacklog) * 100).toFixed(1) : 0;

        parsedData.push({
          date: date,
          day: days[i]?.trim().slice(0, 3),
          scheduled,
          totalBacklog,
          actual,
          postponed,
          efficiency: parseFloat(efficiency as string)
        });
      }
      if (parsedData.length > 0) setData(parsedData);
    };
    reader.readAsText(file);
  };

  const totals = useMemo(() => {
    const totalScheduled = data.reduce((acc, curr) => acc + curr.scheduled, 0);
    const totalActual = data.reduce((acc, curr) => acc + (curr.actual || 0), 0);
    const totalPostponed = data.reduce((acc, curr) => acc + (curr.postponed || 0), 0);
    const avgEfficiency = data.length > 0 
      ? (data.reduce((acc, curr) => acc + curr.efficiency, 0) / data.length).toFixed(1)
      : 0;
    
    return { totalScheduled, totalActual, totalPostponed, avgEfficiency };
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const effEntry = payload.find((p: any) => p.name === 'efficiency');
      const eff = effEntry ? effEntry.value : 0;
      const isBad = eff < 65;
      return (
        <div className={`p-4 border-2 rounded-lg shadow-2xl ${isBad ? 'bg-red-900 text-white border-red-500' : 'bg-white text-slate-900 border-slate-200'}`}>
          <p className="font-black mb-2 border-b border-white/20 pb-1 text-lg">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6 text-sm mb-1">
              <span className="opacity-80 font-bold uppercase">{entry.name}:</span>
              <span className="font-black">
                {entry.name === 'efficiency' ? `${entry.value}%` : entry.value}
              </span>
            </div>
          ))}
          {isBad && (
            <div className="mt-2 text-[10px] font-black uppercase bg-red-600 px-2 py-1 text-center animate-pulse">
              Performance Failure Detected
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 font-sans text-slate-100">
      <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />

      {/* Chaos Alert Banner */}
      {parseFloat(totals.avgEfficiency as string) < 75 && (
        <div className="max-w-7xl mx-auto mb-6 bg-red-600 text-white px-6 py-3 rounded-xl flex items-center justify-between animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.5)]">
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6" />
            <span className="font-black uppercase tracking-widest text-lg">System Alert: Operational Chaos Detected</span>
          </div>
          <div className="hidden md:block font-bold">Backlog is exceeding capacity thresholds</div>
        </div>
      )}

      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-red-600 p-2 rounded-lg shadow-lg shadow-red-900/50">
                <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Ops Crisis Dashboard</h1>
          </div>
          <p className="text-slate-400 font-bold">Real-time Backlog Escalation Monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-white text-slate-950 rounded-xl text-sm font-black hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 shadow-xl cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            UPLOAD NEW CRISIS DATA
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard 
            title="Total Demand" 
            value={totals.totalScheduled} 
            icon={Package} 
            color="bg-slate-800" 
          />
          <KpiCard 
            title="Completed" 
            value={totals.totalActual} 
            icon={CheckCircle} 
            color="bg-emerald-600" 
          />
          <KpiCard 
            title="Operational Health" 
            value={`${totals.avgEfficiency}%`} 
            icon={TrendingDown} 
            color={parseFloat(totals.avgEfficiency as string) < 70 ? "bg-red-600" : "bg-indigo-600"} 
            status={parseFloat(totals.avgEfficiency as string) < 70 ? "critical" : ""}
          />
          <KpiCard 
            title="Total Failures (Postponed)" 
            value={totals.totalPostponed} 
            icon={Clock} 
            color="bg-rose-700" 
            status={totals.totalPostponed > 100 ? "critical" : ""}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Backlog vs Reality Chart */}
          <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black uppercase text-white">Backlog Accumulation</h2>
                <p className="text-slate-500 text-sm font-bold italic">Gap between load and capacity</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-black uppercase tracking-tighter flex-wrap justify-end">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-600"></span>Total Load</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-400"></span>Scheduled</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span>Delivered</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500"></span>Postponed</div>
              </div>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 35, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chaosGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 900 }} 
                    dy={10}
                    tickFormatter={(str) => {
                      if (typeof str !== 'string') return '';
                      const p = str.split('-');
                      return p.length > 2 ? `${p[1]}/${p[2]}` : str;
                    }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="totalBacklog" stroke="#ef4444" strokeWidth={4} fill="url(#chaosGradient)" name="Total Load">
                    <LabelList dataKey="totalBacklog" position="top" fill="#ef4444" fontSize={14} fontWeight={900} />
                  </Area>
                  <Bar dataKey="scheduled" name="Scheduled" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={14}>
                    <LabelList dataKey="scheduled" position="top" fill="#94a3b8" fontSize={12} fontWeight={900} />
                  </Bar>
                  <Bar dataKey="actual" name="Delivery" fill="#10b981" radius={[4, 4, 0, 0]} barSize={14}>
                    <LabelList dataKey="actual" position="top" fill="#10b981" fontSize={12} fontWeight={900} />
                  </Bar>
                  <Bar dataKey="postponed" name="Postponed" fill="#f97316" radius={[4, 4, 0, 0]} barSize={14}>
                    <LabelList dataKey="postponed" position="top" fill="#f97316" fontSize={12} fontWeight={900} />
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Efficiency Trend Chart */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-inner">
            <div className="mb-8">
              <h2 className="text-xl font-black uppercase text-white">Efficiency Drop</h2>
              <p className="text-sm text-red-500 font-black animate-pulse uppercase tracking-tighter">Warning: Target Threshold 85%</p>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 30, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#475569', fontSize: 12, fontWeight: 900 }} 
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'DANGER', fill: '#ef4444', fontSize: 10, fontWeight: 900, position: 'insideTopRight' }} />
                  <Line 
                    type="step" 
                    dataKey="efficiency" 
                    name="efficiency"
                    strokeWidth={4} 
                    dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (!payload) return null;
                        const isCritical = payload.efficiency < 70;
                        return (
                          <circle 
                            key={`dot-${payload.date}`}
                            cx={cx} cy={cy} r={isCritical ? 6 : 4} 
                            fill={isCritical ? "#ef4444" : "#6366f1"} 
                            stroke="#fff" strokeWidth={2}
                          />
                        );
                    }}
                    stroke="#6366f1"
                  >
                    <LabelList dataKey="efficiency" position="top" fill="#818cf8" fontSize={14} fontWeight={900} formatter={(val: any) => `${val}%`} />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Chaos Table View */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
                <AlertCircle className="text-red-500" /> Damage Assessment Log
            </h2>
            <div className="text-[10px] font-black uppercase text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
                Live Data Feed
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 text-xs font-black uppercase tracking-widest">
                  <th className="px-6 py-5">Incident Date</th>
                  <th className="px-6 py-5 text-center">Load</th>
                  <th className="px-6 py-5 text-center">Success</th>
                  <th className="px-6 py-5 text-center text-red-500">Failed (Postponed)</th>
                  <th className="px-6 py-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.map((row, idx) => {
                  const isCritical = row.efficiency < 70;
                  return (
                    <tr key={idx} className={`${isCritical ? 'bg-red-950/20 hover:bg-red-950/40' : 'hover:bg-slate-800/40'} transition-all`}>
                      <td className="px-6 py-5">
                        <div className={`font-black ${isCritical ? 'text-red-400' : 'text-slate-100'}`}>{row.date}</div>
                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">{row.day}</div>
                      </td>
                      <td className="px-6 py-5 text-center text-slate-300 font-bold">{row.totalBacklog}</td>
                      <td className="px-6 py-5 text-center font-black text-emerald-400">{row.actual}</td>
                      <td className="px-6 py-5 text-center">
                        <div className={`flex items-center justify-center gap-1 font-black ${row.postponed > 50 ? 'text-red-500 animate-bounce' : 'text-orange-500'}`}>
                          {row.postponed > 50 && <ShieldAlert className="w-4 h-4" />}
                          {row.postponed}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex flex-col items-end">
                            <span className={`text-sm font-black ${isCritical ? 'text-red-500' : 'text-indigo-400'}`}>
                                {isCritical ? 'FAILED' : 'SUB-OPTIMAL'} ({row.efficiency}%)
                            </span>
                            <div className="w-24 bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                                <div 
                                    className={`h-full ${isCritical ? 'bg-red-500' : 'bg-indigo-500'}`}
                                    style={{ width: `${Math.min(row.efficiency, 100)}%` }}
                                />
                            </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto mt-12 mb-8 text-center text-slate-600 text-xs font-black uppercase tracking-[0.2em]">
        <p>Warning: System at critical load capacity. Operational failure imminent.</p>
      </footer>
    </div>
  );
};

export default App;
