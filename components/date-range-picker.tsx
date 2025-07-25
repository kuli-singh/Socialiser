
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, CalendarDays } from 'lucide-react';
import { getMinDateTime } from '@/lib/utils';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onIsAllDayChange: (isAllDay: boolean) => void;
  error?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  isAllDay,
  onStartDateChange,
  onEndDateChange,
  onIsAllDayChange,
  error
}: DateRangePickerProps) {
  const [isMultiDay, setIsMultiDay] = useState(false);

  const handleStartDateChange = (value: string) => {
    onStartDateChange(value);
    
    // Auto-set end date if it's empty or before start date
    if (!endDate || new Date(endDate) < new Date(value)) {
      onEndDateChange(value);
    }
  };

  const handleMultiDayToggle = (enabled: boolean) => {
    setIsMultiDay(enabled);
    if (!enabled) {
      // Reset end date to match start date
      onEndDateChange(startDate);
    }
  };

  const formatInputType = () => {
    return isAllDay ? 'date' : 'datetime-local';
  };

  const formatMinDateTime = () => {
    if (isAllDay) {
      return new Date().toISOString().split('T')[0];
    }
    return getMinDateTime();
  };

  const formatMinEndDateTime = () => {
    if (isAllDay) {
      return startDate ? new Date(startDate).toISOString().split('T')[0] : formatMinDateTime();
    }
    return startDate || getMinDateTime();
  };

  return (
    <Card className="p-4">
      <CardContent className="space-y-4 p-0">
        {/* All-Day Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">All-day event</span>
          </div>
          <Switch
            checked={isAllDay}
            onCheckedChange={onIsAllDayChange}
          />
        </div>

        {/* Multi-Day Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Multi-day event</span>
          </div>
          <Switch
            checked={isMultiDay}
            onCheckedChange={handleMultiDayToggle}
          />
        </div>

        {/* Start Date/Time */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {isMultiDay ? 'Start Date' : 'Date'} {!isAllDay && '& Time'}
          </label>
          <Input
            type={formatInputType()}
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            min={formatMinDateTime()}
            required
            className={error ? 'border-red-500' : ''}
          />
        </div>

        {/* End Date/Time (only if multi-day) */}
        {isMultiDay && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              End Date {!isAllDay && '& Time'}
            </label>
            <Input
              type={formatInputType()}
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              min={formatMinEndDateTime()}
              required
            />
          </div>
        )}

        {/* Event Duration Info */}
        {startDate && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            {isAllDay ? (
              isMultiDay && endDate && startDate !== endDate ? (
                `All-day event from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`
              ) : (
                `All-day event on ${new Date(startDate).toLocaleDateString()}`
              )
            ) : (
              isMultiDay && endDate && startDate !== endDate ? (
                `Event from ${new Date(startDate).toLocaleString()} to ${new Date(endDate).toLocaleString()}`
              ) : (
                `Event on ${new Date(startDate).toLocaleString()}`
              )
            )}
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}
      </CardContent>
    </Card>
  );
}
