import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { subMonths, format } from 'date-fns';
import { useApp } from '../../context/AppContext';

export const ContributionHistoryCard: React.FC = () => {
  const { reportHistory } = useApp();
  const today = new Date();
  
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(today, 5 - i);
    return {
      monthKey: format(d, 'yyyy-MM'),
      label: format(d, 'MMM')
    };
  });

  const currentMonthYear = format(today, 'MMM yyyy');

  // Count reports in each of the last 6 months
  const monthlyCounts = last6Months.map(({ monthKey, label }) => {
    const count = reportHistory.filter(report => {
      if (!report.createdAt) return false;
      const reportDate = new Date(report.createdAt);
      return format(reportDate, 'yyyy-MM') === monthKey;
    }).length;
    return { label, count };
  });

  const maxCount = Math.max(...monthlyCounts.map(m => m.count), 1);
  const totalInPeriod = monthlyCounts.reduce((acc, m) => acc + m.count, 0);

  const chartData = monthlyCounts.map(m => ({
    label: m.label,
    count: m.count,
    // Minimum 4% baseline for clean visual rendering if 0 reports
    heightPercent: m.count === 0 ? 4 : Math.max(15, Math.round((m.count / maxCount) * 100))
  }));

  return (
    <Card className="bg-white border border-slate-200/90 shadow-2xs rounded-3xl overflow-hidden">
      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-slate-900 font-bold text-base tracking-tight">Contribution History</h2>
            <p className="text-slate-500 text-xs font-medium">Last 6 months of devotee reports</p>
          </div>
          <span className="px-3 py-1 bg-blue-50 border border-blue-200/60 rounded-full text-xs font-bold text-blue-800">
            {totalInPeriod} reports
          </span>
        </div>

        {/* Bar Chart */}
        <div className="h-36 flex items-end justify-between gap-3 pt-2">
          {chartData.map((item, index) => (
            <div key={index} className="flex flex-col items-center gap-2 w-full h-full justify-end">
              <span className="text-[10px] font-bold text-slate-500">
                {item.count > 0 ? item.count : ''}
              </span>
              <div 
                className={`w-full rounded-t-md transition-all duration-500 ease-out ${
                  item.count > 0 ? 'bg-blue-600' : 'bg-slate-100 hover:bg-slate-200'
                }`}
                style={{ height: `${item.heightPercent}%` }}
              ></div>
              <span className="text-slate-500 text-[11px] font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Mini Cards */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 flex flex-col justify-center space-y-0.5">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Current Month</span>
            <span className="text-slate-900 font-bold text-sm">{currentMonthYear}</span>
            <span className="text-slate-500 text-[11px] font-medium">
              {monthlyCounts[5]?.count || 0} reports submitted
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 flex flex-col justify-center space-y-0.5">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Devotee Status</span>
            <span className="text-slate-900 font-bold text-sm">
              {totalInPeriod > 0 ? 'Active Contributor' : 'Devotee Pilgrim'}
            </span>
            <span className="text-emerald-700 text-[11px] font-semibold">
              Real-time Verified
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
