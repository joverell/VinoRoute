'use client';

import { useState, useRef, useEffect } from 'react';
import { Winery } from "@/types";
import WineryCard from "./WineryCard";
import WineryDetail from "./WineryDetail";
import { ItineraryStop } from '@/utils/itineraryLogic';
import { TripStop, PrepopulatedStop } from './HomePage';
import { SavedTour } from '@/types';
import AddCustomStopForm from './AddCustomStopForm';
import { Region } from '@/types';
import { User } from 'firebase/auth';
import Auth from './Auth';

const getNextSaturday10AM = () => {
  const now = new Date();
  const nextSaturday = new Date(now);
  const dayOfWeek = now.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
  nextSaturday.setDate(now.getDate() + daysUntilSaturday);
  if (daysUntilSaturday === 0 && now.getHours() >= 10) {
    nextSaturday.setDate(nextSaturday.getDate() + 7);
  }
  nextSaturday.setHours(10, 0, 0, 0);
  const pad = (num: number) => num.toString().padStart(2, '0');
  const year = nextSaturday.getFullYear();
  const month = pad(nextSaturday.getMonth() + 1);
  const day = pad(nextSaturday.getDate());
  const hours = pad(nextSaturday.getHours());
  const minutes = pad(nextSaturday.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const DragHandleIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400"><circle cx="9" cy="6" r="1.5" fill="currentColor"/><circle cx="15" cy="6" r="1.5" fill="currentColor"/><circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/><circle cx="9" cy="18" r="1.5" fill="currentColor"/><circle cx="15" cy="18" r="1.5" fill="currentColor"/></svg> );
const InfoIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg> );
const formatTime = (date: Date) => date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
const formatSavedDate = (timestamp: { seconds: number }) => new Date(timestamp.seconds * 1000).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

interface SidebarProps {
  user: User | null;
  onSaveTour: () => void;
  savedTours: SavedTour[];
  onLoadTour: (tour: SavedTour) => void;
  onDeleteTour: (tourId: string) => void;
  tripStops: TripStop[];
  onAddToTrip: (winery: Winery) => void;
  onRemoveFromTrip: (wineryId: number | string) => void;
  onReorderWineries: (reorderedStops: TripStop[]) => void;
  itinerary: ItineraryStop[] | null;
  startTime: string;
  onStartTimeChange: (time: string) => void;
  onOptimizeRoute: () => void;
  defaultDuration: number;
  onDefaultDurationChange: (duration: number) => void;
  onDurationChange: (wineryId: number | string, newDuration: number) => void;
  selectedWinery: Winery | null;
  onSelectWinery: (winery: Winery | null) => void;
  onAddCustomStop: (name: string, address: string, duration: number) => void;
  selectedRegion: Region;
  onRegionSelection: (value: string) => void;
  includeDistilleries: boolean;
  onToggleDistilleries: () => void;
  availableWineries: Winery[];
  regions: Region[];
  prepopulatedStop: PrepopulatedStop | null;
  onClearPrepopulatedStop: () => void;
  showRegionOverlay: boolean;
  onToggleRegionOverlay: () => void;
  filterMode: 'region' | 'state' | 'country';
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  searchTags: string[];
  onTagFilterChange: (tag: string) => void;
}

export default function Sidebar({
  user, onSaveTour, savedTours, onLoadTour, onDeleteTour,
  tripStops, onAddToTrip, onRemoveFromTrip, onReorderWineries, itinerary,
  startTime, onStartTimeChange, onOptimizeRoute, defaultDuration,
  onDefaultDurationChange, onDurationChange, selectedWinery, onSelectWinery, onAddCustomStop,
  selectedRegion, onRegionSelection, includeDistilleries, onToggleDistilleries,
  availableWineries, regions, prepopulatedStop, onClearPrepopulatedStop,
  showRegionOverlay, onToggleRegionOverlay, filterMode,
  searchTerm, onSearchTermChange, searchTags, onTagFilterChange
}: SidebarProps) {
  const [view, setView] = useState<'planner' | 'saved'>('planner');
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    if (!startTime) {
      onStartTimeChange(getNextSaturday10AM());
    }
  }, [startTime, onStartTimeChange]);

  useEffect(() => {
    if (prepopulatedStop) {
      setShowCustomForm(true);
    }
  }, [prepopulatedStop]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => { dragItem.current = index; };
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => { dragOverItem.current = index; };
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const reordered = [...tripStops];
      const draggedItemContent = reordered.splice(dragItem.current, 1)[0];
      reordered.splice(dragOverItem.current, 0, draggedItemContent);
      onReorderWineries(reordered);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleAddCustomAndClose = (name: string, address: string, duration: number) => {
    onAddCustomStop(name, address, duration);
    setShowCustomForm(false);
    onClearPrepopulatedStop();
  };
  
  const handleCancelCustomForm = () => {
    setShowCustomForm(false);
    onClearPrepopulatedStop();
  };

  const handleShare = (tourId: string) => {
    const url = `${window.location.origin}/?tour=${tourId}`;
    navigator.clipboard.writeText(url);
    alert("Shareable link copied to clipboard!");
  };

  const groupedRegions = regions.reduce((acc, region) => {
    const state = region.state || 'Other';
    (acc[state] = acc[state] || []).push(region);
    return acc;
  }, {} as Record<string, Region[]>);

  const selectValue = filterMode === 'country'
    ? 'Australia'
    : filterMode === 'state'
    ? `state-${selectedRegion.state}`
    : selectedRegion.name;

  return (
    <div className="w-full sm:w-96 h-full p-4 overflow-y-auto bg-white shadow-lg flex-shrink-0 print:hidden">
      <div className="flex my-4 border-b">
        <button onClick={() => setView('planner')} className={`flex-1 pb-2 font-semibold ${view === 'planner' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-500'}`}>Planner</button>
        {user && (
          <button onClick={() => setView('saved')} className={`flex-1 pb-2 font-semibold ${view === 'saved' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-500'}`}>Saved Tours ({savedTours.length})</button>
        )}
      </div>

      {view === 'planner' && (
        <div>
          <div className="p-4 mb-4 border rounded-lg">
            <h2 className="text-xl font-bold text-gray-800">Plan Your Tour</h2>
            <div className="my-4">
              <label htmlFor="region" className="block text-sm font-medium text-gray-700">Region</label>
              <select
                id="region" name="region"
                value={selectValue}
                onChange={(e) => onRegionSelection(e.target.value)}
                className="w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm"
              >
                <option value="Australia">All of Australia</option>
                {Object.entries(groupedRegions).map(([state, stateRegions]) => (
                  <optgroup key={state} label={state}>
                    <option value={`state-${state}`}>{`All of ${state}`}</option>
                    {stateRegions.map(r => <option key={r.name} value={r.name}>{r.name.replace(/, (VIC|SA|WA|NSW|TAS|QLD|ACT)$/, '')}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4 my-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Start Time</label>
                <input
                  type="datetime-local" id="startTime" name="startTime" value={startTime}
                  onChange={(e) => onStartTimeChange(e.target.value)}
                  className="w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label htmlFor="defaultDuration" className="block text-sm font-medium text-gray-700">Visit (mins)</label>
                <input
                  type="number" id="defaultDuration" name="defaultDuration" value={defaultDuration}
                  onChange={(e) => onDefaultDurationChange(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm"
                  min="15" step="15"
                />
              </div>
            </div>
            {tripStops.length > 1 && (
              <button onClick={onOptimizeRoute} className="w-full px-4 py-2 font-bold text-white bg-teal-500 rounded-lg hover:bg-teal-600">Find Most Efficient Route</button>
            )}
          </div>

          {tripStops.length > 0 && (
            <div className="mb-4 printable">
              <div className="flex items-center justify-between mb-2">

                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-700">My Tour ({tripStops.length})</h3>
                  <div
                    className="relative"
                    onMouseEnter={() => setShowInfoTooltip(true)}
                    onMouseLeave={() => setShowInfoTooltip(false)}
                  >
                    <InfoIcon />
                    {showInfoTooltip && (
                      <div className="absolute bottom-full mb-2 w-64 p-2 text-xs text-white bg-gray-800 rounded-md shadow-lg z-10">
                        All route calculations will be based from the starting point, or location 1, listed below.
                      </div>
                    )}
                  </div>

                </div>
                <div className="flex items-center gap-2">
                  {itinerary && (
                    <button onClick={() => window.print()} className="px-2 py-1 text-xs font-bold text-white bg-gray-500 rounded-lg hover:bg-gray-600">Print</button>
                  )}
                  {user && (
                    <button onClick={onSaveTour} className="px-2 py-1 text-xs font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600">Save</button>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {tripStops.map((stop, index) => {
                  const stopInfo = itinerary?.find(i => i.winery.id === stop.winery.id);
                  return (
                    <div key={stop.winery.id}>
                      <div className={`p-2 rounded-lg ${stopInfo?.warning ? 'bg-red-50' : 'bg-gray-100'}`}
                        draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="cursor-grab"><DragHandleIcon /></div>
                            <div className="flex items-center justify-center w-6 h-6 text-sm font-bold text-white bg-rose-500 rounded-full">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold">{stop.winery.name}</p>
                              {stopInfo && (
                                <p className="text-xs">{formatTime(stopInfo.arrivalTime)} - {formatTime(stopInfo.departureTime)}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={stop.duration}
                              onChange={(e) => onDurationChange(stop.winery.id, parseInt(e.target.value, 10))}
                              className="w-16 p-1 text-sm text-center border border-gray-300 rounded-md"
                              min="15" step="15"
                            />
                            <button onClick={() => onRemoveFromTrip(stop.winery.id)} className="pr-2 text-xs font-bold text-red-500 hover:text-red-700">X</button>
                          </div>
                        </div>
                        {stopInfo?.warning && <p className="pl-16 text-xs font-bold text-red-600">{stopInfo.warning}</p>}

                      </div>
                      {stopInfo?.travelTimeToNext && (
                        <div className="pl-8 text-xs text-center text-gray-500">&#8595; <em>Travel: {stopInfo.travelTimeToNext.text}</em></div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-center text-gray-400">Drag and drop to reorder your tour.</p>
            </div>
          )}

          <div>
            {selectedWinery ? (
              <WineryDetail
                winery={selectedWinery}
                onClearSelection={() => onSelectWinery(null)}
                onAddToTrip={onAddToTrip}
                onRemoveFromTrip={onRemoveFromTrip}
                isInTrip={tripStops.some(stop => stop.winery.id === selectedWinery.id)}
                user={user}
              />
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-700">Available Locations</h3>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setShowCustomForm(!showCustomForm)} className="px-2 py-1 text-xs font-bold text-teal-700 bg-teal-100 rounded-lg hover:bg-teal-200">
                      {showCustomForm ? 'Cancel' : '+ Custom Stop'}
                    </button>
                  </div>
                </div>
                {showCustomForm && <AddCustomStopForm onAdd={handleAddCustomAndClose} onCancel={handleCancelCustomForm} defaultDuration={defaultDuration} prepopulatedData={prepopulatedStop} />}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search wineries or tags..."
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  />
                  {searchTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-sm font-medium text-gray-700">Filtering by:</span>
                      {searchTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => onTagFilterChange(tag)}
                          className="px-2 py-1 text-xs text-white bg-rose-500 rounded-full hover:bg-rose-600"
                        >
                          {tag} &times;
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-4 mt-4">
                  {availableWineries.map((winery) => (
                    <WineryCard
                      key={winery.id}
                      winery={winery}
                      onAddToTrip={onAddToTrip}
                      onRemoveFromTrip={onRemoveFromTrip}
                      isInTrip={tripStops.some(stop => stop.winery.id === winery.id)}
                      isSelected={false}

                      onSelect={onSelectWinery}
                      onTagClick={onTagFilterChange}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}


      {view === 'saved' && user && (
        <div>
          <h2 className="text-xl font-bold text-gray-800">My Saved Tours</h2>
          {savedTours.length > 0 ? (
            <div className="flex flex-col gap-4 mt-4">
              {savedTours.map(tour => (
                <div key={tour.id} className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-bold">{tour.tourName}</p>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{tour.regionName}</span>
                    <span>Saved: {formatSavedDate(tour.createdAt)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <button onClick={() => handleShare(tour.id)} className="w-full px-3 py-1 text-sm font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600">Share</button>
                    <button onClick={() => onLoadTour(tour)} className="w-full px-3 py-1 text-sm font-bold text-white bg-teal-500 rounded-lg hover:bg-teal-600">Load</button>
                    <button onClick={() => onDeleteTour(tour.id)} className="w-full px-3 py-1 text-sm font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">You have no saved tours.</p>
          )}
        </div>
      )}
    </div>
  );
}