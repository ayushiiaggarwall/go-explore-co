import { useState } from 'react';
import { useParallelUniverseStore } from '../../hooks/useParallelUniverseStore';
import Button from '../ui/Button';
import { Card } from '../ui/card';
import { Calendar, ArrowLeft, Clock } from 'lucide-react';
import { DatePicker } from '../ui/date-picker';

interface DatesStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function DatesStep({ onNext, onBack }: DatesStepProps) {
  const { dateRange, setDateRange } = useParallelUniverseStore();
  const [startDate, setStartDate] = useState<Date | undefined>(dateRange?.start);
  const [endDate, setEndDate] = useState<Date | undefined>(dateRange?.end);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate) {
      setDateRange({ start: startDate, end: endDate });
      onNext();
    }
  };

  const calculateDays = () => {
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const days = calculateDays();
  const canProceed = startDate && endDate && days <= 14 && days >= 1;
  const isValidRange = startDate && endDate ? endDate >= startDate : true;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Calendar className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">When Are You Traveling?</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Select your travel dates. We support trips from 1 to 14 days.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h4 className="font-medium mb-4">Start Date</h4>
            <DatePicker
              selected={startDate}
              onSelect={setStartDate}
              placeholder="Select start date"
              disabled={(date) => date < new Date()}
            />
          </Card>

          <Card className="p-6">
            <h4 className="font-medium mb-4">End Date</h4>
            <DatePicker
              selected={endDate}
              onSelect={setEndDate}
              placeholder="Select end date"
              disabled={(date) => date < new Date() || (startDate && date < startDate)}
            />
          </Card>
        </div>

        {startDate && endDate && (
          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <h4 className="font-medium">Trip Duration</h4>
                <p className="text-sm text-muted-foreground">
                  {days} {days === 1 ? 'day' : 'days'} 
                  {!isValidRange && (
                    <span className="text-destructive ml-2">
                      End date must be after start date
                    </span>
                  )}
                  {days > 14 && (
                    <span className="text-destructive ml-2">
                      Maximum trip length is 14 days
                    </span>
                  )}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Quick date ranges */}
        <Card className="p-6">
          <h4 className="font-medium mb-4">Quick Options</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: 'Weekend', days: 2 },
              { label: 'Long Weekend', days: 3 },
              { label: '1 Week', days: 7 },
              { label: '2 Weeks', days: 14 }
            ].map((option) => (
              <Button
                key={option.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const start = new Date();
                  start.setDate(start.getDate() + 1); // Start tomorrow
                  const end = new Date(start);
                  end.setDate(end.getDate() + option.days - 1);
                  setStartDate(start);
                  setEndDate(end);
                }}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button type="submit" disabled={!canProceed} className="px-8">
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}