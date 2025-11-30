import { useState } from 'react';
import { EventFilters } from '@/types/event';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface EventFiltersProps {
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
  showUpcomingFilter?: boolean;
}

const sports = [
  'All Sports',
  'football',
  'basketball',
  'cricket',
  'tennis',
  'badminton',
  'volleyball',
  'hockey',
  'athletics',
  'swimming',
  'other',
];

const statuses = [
  'All Status',
  'draft',
  'published',
  'ongoing',
  'completed',
  'cancelled',
];

export default function EventFilters({ 
  filters, 
  onFiltersChange,
  showUpcomingFilter = false 
}: EventFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<EventFilters>(filters);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleResetFilters = () => {
    const resetFilters: EventFilters = {
      page: 1,
      limit: filters.limit || 12,
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    setIsOpen(false);
  };

  const hasActiveFilters = Object.keys(filters).some(
    key => key !== 'page' && key !== 'limit' && filters[key as keyof EventFilters]
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Events</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Sport Filter */}
          <div className="space-y-2">
            <Label>Sport</Label>
            <Select
              value={localFilters.sport || 'All Sports'}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  sport: value === 'All Sports' ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                {sports.map((sport) => (
                  <SelectItem key={sport} value={sport} className="capitalize">
                    {sport}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={localFilters.status || 'All Status'}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  status: value === 'All Status' ? undefined : (value as any),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status} className="capitalize">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <Label>Sort By</Label>
            <Select
              value={localFilters.sortBy || 'startDate'}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  sortBy: value as any,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startDate">Start Date</SelectItem>
                <SelectItem value="endDate">End Date</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="participants">Participants</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <Label>Sort Order</Label>
            <Select
              value={localFilters.sortOrder || 'asc'}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  sortOrder: value as 'asc' | 'desc',
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Registration Status */}
          <div className="space-y-3">
            <Label>Registration</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="registrationOpen"
                checked={localFilters.registrationOpen === true}
                onCheckedChange={(checked) =>
                  setLocalFilters({
                    ...localFilters,
                    registrationOpen: checked ? true : undefined,
                  })
                }
              />
              <label
                htmlFor="registrationOpen"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Only Open for Registration
              </label>
            </div>
          </div>

          {/* Public/Private */}
          <div className="space-y-3">
            <Label>Visibility</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={localFilters.isPublic === true}
                onCheckedChange={(checked) =>
                  setLocalFilters({
                    ...localFilters,
                    isPublic: checked ? true : undefined,
                  })
                }
              />
              <label
                htmlFor="isPublic"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Public Events Only
              </label>
            </div>
          </div>

          {/* Upcoming Filter (for My Events) */}
          {showUpcomingFilter && (
            <div className="space-y-3">
              <Label>Event Time</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="upcoming"
                  checked={localFilters.upcoming === true}
                  onCheckedChange={(checked) =>
                    setLocalFilters({
                      ...localFilters,
                      upcoming: checked ? true : undefined,
                    })
                  }
                />
                <label
                  htmlFor="upcoming"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Upcoming Events Only
                </label>
              </div>
            </div>
          )}

          {/* Items per page */}
          <div className="space-y-2">
            <Label>Items per page</Label>
            <Select
              value={localFilters.limit?.toString() || '12'}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  limit: parseInt(value),
                  page: 1,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="48">48</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleResetFilters} variant="outline" className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleApplyFilters} className="flex-1">
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}