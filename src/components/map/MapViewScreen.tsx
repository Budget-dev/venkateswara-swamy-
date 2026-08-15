import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MapPin, Navigation, Compass, ChevronRight, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const MapViewScreen: React.FC = () => {
  const { locations, setCurrentView, setSelectedLocationId } = useApp();
  const [activeLocId, setActiveLocId] = useState<string>(locations[0]?.id || '');

  const activeLoc = locations.find((l) => l.id === activeLocId) || locations[0];
  if (!activeLoc) return <div className="p-8 text-center text-slate-500">Loading map...</div>;

  const handleSelectLoc = (locId: string) => {
    setSelectedLocationId(locId);
    setCurrentView('location-detail');
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Counter Locations Map
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Geographic overview of token counters
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentView('home')}
          className="gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
      </div>

      {/* Map Graphic Canvas Container */}
      <Card className="overflow-hidden border-border bg-slate-50 relative min-h-[400px] flex flex-col justify-between">
        {/* Subtle Map Grid Background Graphic */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-60"></div>

        {/* Top Map Status Badge */}
        <div className="relative z-10 p-4 flex items-center justify-between">
          <Badge variant="secondary" className="gap-1.5 shadow-sm bg-white/80 backdrop-blur-sm">
            <Compass className="w-3.5 h-3.5" />
            <span>Tirupati Region Map</span>
          </Badge>

          <Badge variant="outline" className="bg-emerald-50/80 backdrop-blur-sm text-emerald-700 border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            Live Updates
          </Badge>
        </div>

        {/* Map Pins Display */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3 px-4 py-6">
          {locations.map((loc) => {
            const isSelected = loc.id === activeLocId;

            return (
              <Card
                key={loc.id}
                onClick={() => setActiveLocId(loc.id)}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary ring-1 ring-primary shadow-md bg-white'
                    : 'border-border bg-white/90 hover:bg-white shadow-sm'
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm leading-none">{loc.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{loc.shortAddress}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-lg font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {loc.bestLineChance}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Best: Line {loc.bestLineNumber}</span>
                    <span className={`font-medium flex items-center gap-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                      <span>Inspect</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom Location Drawer */}
        <div className="relative z-10 p-4 pt-0">
          <Card className="bg-white/95 backdrop-blur-sm shadow-md">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <span>{activeLoc.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    ({activeLoc.distanceKm || 0.8} km from station)
                  </span>
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Hours: {activeLoc.operatingHours} · Reports: {activeLoc.totalReportsCount}
                </p>
              </div>

              <Button
                onClick={() => handleSelectLoc(activeLoc.id)}
                className="w-full sm:w-auto gap-1.5"
              >
                <span>View Detail</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </Card>
    </div>
  );
};

