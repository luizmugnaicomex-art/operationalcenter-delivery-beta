import React, { useState, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, ComposedChart, Area, LabelList, Cell, ReferenceLine
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Package, CheckCircle, Clock, Calendar, 
  Upload, AlertCircle, LayoutDashboard, FileSpreadsheet, AlertTriangle
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

const KpiCard = ({ title, value, icon: Icon, color, trend, critical }: any) => (
  <div className={`bg-white p-6 rounded-2xl border ${critical ? 'border-rose-500 shadow-rose-100' : 'border-slate-100'} shadow-sm transition-all hover:shadow-md relative overflow-hidden`}>
    {critical && <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-600 animate-pulse" />}
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend !== undefined && (
        <span className={`flex items-center text-sm font-bold ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <h3 className={`text-sm font-bold mb-1 ${critical ? 'text-rose-600' : 'text-slate-500'}`}>{title}</h3>
    <p className={`text-3xl font-black ${critical ? 'text-rose-700' : 'text-slate-900'}`}>{value}</p>
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

      if (parsedData.length > 0) {
        setData(parsedData);
      }
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
    
    return { totalScheduled, totalActual, totalPostponed, avgEfficiency: parseFloat(avgEfficiency as string) };
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xl">
          <p className="font-bold text-slate-900 mb-2 border-b border-slate-50 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm mb-1">
              <span className="text-slate-500 capitalize">{entry.name}:</span>
              <span className="font-bold" style={{ color: entry.color }}>
                {entry.name === 'efficiency' ? `${entry.value}%` : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const isChaos = totals.avgEfficiency < 75 || totals.totalPostponed > totals.totalScheduled * 0.2;

  return (
    <div className={`min-h-screen p-4 md:p-8 font-sans transition-colors duration-500 ${isChaos ? 'bg-rose-50/30' : 'bg-slate-50'} text-slate-900`}>
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        accept=".csv,.xlsx" 
        onChange={handleFileUpload}
      />

      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className={`p-2 rounded-lg ${isChaos ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-blue-100 text-blue-600'}`}>
              {isChaos ? <AlertTriangle className="w-6 h-6" /> : <LayoutDashboard className="w-6 h-6" />}
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Delivery Operations Center</h1>
            {isChaos && (
              <span className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-full animate-pulse shadow-sm">
                CRITICAL STATUS
              </span>
            )}
          </div>
          <p className="text-slate-500 font-medium">Live data visualization for logistics performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Upload CSV
          </button>
          <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg flex items-center gap-2 cursor-pointer">
            <FileSpreadsheet className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <KpiCard 
            title="Total Scheduled" 
            value={totals.totalScheduled} 
            icon={Package} 
            color="bg-slate-800" 
          />
          <KpiCard 
            title="Actual Deliveries" 
            value={totals.totalActual} 
            icon={CheckCircle} 
            color={totals.totalActual < totals.totalScheduled * 0.8 ? "bg-rose-500" : "bg-emerald-500"} 
            critical={totals.totalActual < totals.totalScheduled * 0.8}
          />
          <KpiCard 
            title="Avg. Efficiency" 
            value={`${totals.avgEfficiency}%`} 
            icon={totals.avgEfficiency < 75 ? TrendingDown : TrendingUp} 
            color={totals.avgEfficiency < 75 ? "bg-rose-600" : "bg-indigo-500"} 
            critical={totals.avgEfficiency < 75}
          />
          <KpiCard 
            title="Total Postponed" 
            value={totals.totalPostponed} 
            icon={AlertCircle} 
            color={totals.totalPostponed > 100 ? "bg-rose-600" : "bg-amber-500"} 
            critical={totals.totalPostponed > 100}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 bg-white p-6 rounded-2xl border ${isChaos ? 'border-rose-200 shadow-rose-100' : 'border-slate-100'} shadow-sm`}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-black text-slate-900">Volume Performance</h2>
                <p className="text-sm font-medium text-slate-500">Scheduled vs Actual Deliveries</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-300"></span>Scheduled</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-rose-500"></span>Actual (Critical)</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400"></span>Actual (Good)</div>
              </div>
            </div>
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBacklog" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                    dy={10}
                    tickFormatter={(str) => {
                        const parts = str.split('-');
                        return parts.length > 2 ? `${parts[1]}/${parts[2]}` : str;
                    }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="totalBacklog" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" fill="url(#colorBacklog)" name="Total Backlog" />
                  <Bar dataKey="scheduled" name="scheduled" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={28}>
                    <LabelList dataKey="scheduled" position="top" fill="#64748b" fontSize={12} fontWeight="bold" />
                  </Bar>
                  <Bar dataKey="actual" name="actual" radius={[4, 4, 0, 0]} barSize={28}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.efficiency < 70 ? '#ef4444' : '#34d399'} />
                    ))}
                    <LabelList dataKey="actual" position="top" fill="#0f172a" fontSize={13} fontWeight="black" />
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`bg-white p-6 rounded-2xl border ${isChaos ? 'border-rose-200 shadow-rose-100' : 'border-slate-100'} shadow-sm`}>
            <div className="mb-8">
              <h2 className="text-lg font-black text-slate-900">Efficiency Trend</h2>
              <p className="text-sm font-medium text-slate-500">Fulfillment percentage over time</p>
            </div>
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={2} label={{ position: 'insideTopLeft', value: 'CRITICAL THRESHOLD (70%)', fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} />
                  <Line 
                    type="monotone" 
                    dataKey="efficiency" 
                    stroke={totals.avgEfficiency < 75 ? '#ef4444' : '#6366f1'} 
                    strokeWidth={4} 
                    dot={{ r: 5, fill: totals.avgEfficiency < 75 ? '#ef4444' : '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, strokeWidth: 0 }}
                  >
                    <LabelList dataKey="efficiency" position="top" fill="#0f172a" fontSize={12} fontWeight="black" formatter={(val: any) => `${val}%`} />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-2xl border ${isChaos ? 'border-rose-200 shadow-rose-100' : 'border-slate-100'} shadow-sm overflow-hidden`}>
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-black text-slate-900">Detailed Activity Logs</h2>
            {isChaos && <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">Review required for highlighted rows</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-wider">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-center">Original Schedule</th>
                  <th className="px-6 py-4 text-center">Backlog + Daily</th>
                  <th className="px-6 py-4 text-center">Delivered</th>
                  <th className="px-6 py-4 text-center">Postponed</th>
                  <th className="px-6 py-4 text-right">Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row, idx) => {
                  const isRowCritical = row.efficiency < 70 || row.postponed > 50;
                  return (
                    <tr key={idx} className={`transition-colors ${isRowCritical ? 'bg-rose-50/50 hover:bg-rose-100/50' : 'hover:bg-slate-50'}`}>
                      <td className="px-6 py-4 text-sm">
                        <div className={`font-bold ${isRowCritical ? 'text-rose-900' : 'text-slate-900'}`}>{row.date}</div>
                        <div className={`text-xs uppercase font-bold ${isRowCritical ? 'text-rose-500' : 'text-slate-400'}`}>{row.day}</div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-slate-600">{row.scheduled}</td>
                      <td className="px-6 py-4 text-center text-sm">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-black ${isRowCritical ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                              {row.totalBacklog}
                          </span>
                      </td>
                      <td className={`px-6 py-4 text-center text-sm font-black ${isRowCritical ? 'text-rose-600' : 'text-emerald-600'}`}>{row.actual || 0}</td>
                      <td className="px-6 py-4 text-center text-sm">
                        {row.postponed > 50 ? (
                          <div className="flex items-center justify-center gap-1.5 text-rose-600 font-black bg-rose-100 py-1 px-2 rounded-md w-fit mx-auto">
                            <AlertCircle className="w-4 h-4" />
                            {row.postponed}
                          </div>
                        ) : (
                          <span className="text-slate-500 font-medium">
                            {row.postponed || 0}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden hidden sm:block">
                            <div 
                              className={`h-full rounded-full ${row.efficiency > 80 ? 'bg-emerald-500' : row.efficiency > 70 ? 'bg-amber-500' : 'bg-rose-600'}`}
                              style={{ width: `${Math.min(row.efficiency, 100)}%` }}
                            />
                          </div>
                          <span className={`text-sm font-black ${isRowCritical ? 'text-rose-600' : 'text-slate-700'}`}>{row.efficiency}%</span>
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

      <footer className="max-w-7xl mx-auto mt-12 mb-8 text-center text-slate-400 text-xs font-medium">
        <p>© 2026 Logistics Hub AI • Interactive Delivery Dashboard</p>
      </footer>
    </div>
  );
};

export default App;
