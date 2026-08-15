import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CounterLocation, QueueLine } from '../../types';
import {
  LayoutDashboard,
  ShieldAlert,
  Sliders,
  Users,
  Activity,
  AlertTriangle,
  ArrowLeft,
  Settings2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const AdminDashboard: React.FC = () => {
  const { locations, setCurrentView } = useApp();
  // Using zeroed stats since mock data was requested to be removed
  const adminStats = {
    activeUsersOnline: 0,
    totalReportsToday: 0,
    activeCounters: locations.length,
    predictionAccuracyPercent: 0,
    flaggedReportsCount: 0,
    alertsSentToday: 0
  };

  const [selectedLocId, setSelectedLocId] = useState<string>(locations[0]?.id || '');
  const [overrideSuccess, setOverrideSuccess] = useState<string | null>(null);

  const activeLoc = locations.find((l) => l.id === selectedLocId) || locations[0];
  if (!activeLoc) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  const handleToggleQueue = async (queueId: string) => {
    if (!activeLoc) return;
    const updatedQueues = (activeLoc.queues || []).map((q) =>
      q.id === queueId ? { ...q, isActive: !q.isActive } : q
    );
    await updateDoc(doc(db, 'locations', activeLoc.id), { queues: updatedQueues });
  };

  const handleAdjustProbability = async (queueId: string, newProb: number) => {
    if (!activeLoc) return;
    const updatedQueues = (activeLoc.queues || []).map((q) =>
      q.id === queueId ? { ...q, estimatedProbability: newProb } : q
    );
    await updateDoc(doc(db, 'locations', activeLoc.id), { queues: updatedQueues });

    setOverrideSuccess(`Probability for ${queueId} updated to ${newProb}%`);
    setTimeout(() => setOverrideSuccess(null), 3000);
  };

  if (!activeLoc) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="space-y-6 pb-20 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 bg-slate-900/50 p-4 rounded-3xl border border-slate-800">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView('home')}
          className="rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            Command Center
          </h1>
          <p className="text-xs text-slate-400">System overrides and live monitoring</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex flex-col gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-xs text-slate-400 font-medium">Active Users</p>
              <h3 className="text-2xl font-bold text-white">{adminStats.activeUsersOnline}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex flex-col gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-xs text-slate-400 font-medium">Accuracy</p>
              <h3 className="text-2xl font-bold text-white">{adminStats.predictionAccuracyPercent}%</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Override Controls */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3 border-b border-slate-800">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
            <Sliders className="w-4 h-4 text-blue-500" />
            Manual Algorithm Overrides
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 uppercase tracking-wider">Target Location</label>
            <select
              value={selectedLocId}
              onChange={(e) => setSelectedLocId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs text-slate-400 uppercase tracking-wider">Queue Controls</label>
            
            {overrideSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs p-2 rounded-lg text-center font-medium">
                {overrideSuccess}
              </div>
            )}

            {(activeLoc.queues || []).map((q) => (
              <div key={q.id} className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${q.isActive ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                    <span className="text-sm font-bold text-white">{q.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={q.isActive ? "destructive" : "secondary"}
                    className="h-7 text-[10px] uppercase font-bold"
                    onClick={() => handleToggleQueue(q.id)}
                  >
                    {q.isActive ? 'Disable Queue' : 'Enable Queue'}
                  </Button>
                </div>

                {q.isActive && (
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      defaultValue={q.estimatedProbability}
                      className="h-8 bg-slate-900 border-slate-700 text-white w-20 text-center"
                      onBlur={(e) => handleAdjustProbability(q.id, parseInt(e.target.value))}
                    />
                    <span className="text-xs text-slate-500 font-medium">Force Probability %</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
