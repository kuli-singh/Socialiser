

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/form-field';
import { LoadingSpinner } from '@/components/loading-spinner';
import { AIActivityDiscovery } from '@/components/ai-activity-discovery';
import { CalendarIntegration } from '@/components/calendar-integration';
import { DateRangePicker } from '@/components/date-range-picker';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Sparkles,
  CheckCircle,
  ArrowRight,
  Layers,
  Heart,
  Building,
  Info,
  DollarSign,
  UserCheck,
  Plus
} from 'lucide-react';
import { getMinDateTime } from '@/lib/utils';

interface Activity {
  id: string;
  name: string;
  description: string | null;
  values: Array<{
    value: {
      name: string;
    };
  }>;
}

interface Friend {
  id: string;
  name: string;
  group: string | null;
}

interface DiscoveredOption {
  name: string;
  description: string;
  suggestedLocation: string;
  suggestedTime: string;
  estimatedDuration: string;
  reasoning: string;
}

type Step = 'activity-selection' | 'ai-discovery' | 'event-details' | 'finalize';

interface MultiStepSchedulerProps {
  onBack: () => void;
  preselectedTemplate?: Activity | null;
  aiSuggestion?: {
    eventName?: string;
    venue?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    date?: string;
    time?: string;
    duration?: string;
    price?: string;
    description?: string;
    requirements?: string;
    contactInfo?: string;
    venueType?: string;
    capacity?: string;
  };
}

export function MultiStepScheduler({ onBack, preselectedTemplate, aiSuggestion }: MultiStepSchedulerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isManualMode = searchParams.get('mode') === 'manual';
  
  const [currentStep, setCurrentStep] = useState<Step>(() => {
    if (aiSuggestion) return 'event-details';
    if (preselectedTemplate && isManualMode) return 'event-details';
    if (preselectedTemplate) return 'ai-discovery';
    return 'activity-selection';
  });
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createdInstanceId, setCreatedInstanceId] = useState<string | null>(null);
  
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(preselectedTemplate || null);
  const [selectedOption, setSelectedOption] = useState<DiscoveredOption | null>(null);
  const [formData, setFormData] = useState({
    datetime: '',
    endDate: '',
    isAllDay: false,
    location: '',
    friendIds: [] as string[],
    // Rich instance fields
    customTitle: '',
    venue: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    detailedDescription: '',
    requirements: '',
    contactInfo: '',
    venueType: '',
    priceInfo: '',
    capacity: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (aiSuggestion) {
      // If AI suggestion is provided, set up the data and pre-populate rich fields
      const suggestionOption: DiscoveredOption = {
        name: aiSuggestion.eventName || 'AI Suggested Event',
        description: aiSuggestion.description || 'Event discovered through AI chat',
        suggestedLocation: aiSuggestion.venue && aiSuggestion.address 
          ? `${aiSuggestion.venue}, ${aiSuggestion.address}`
          : aiSuggestion.venue || aiSuggestion.address || 'Location TBD',
        suggestedTime: aiSuggestion.date && aiSuggestion.time 
          ? `${aiSuggestion.date} at ${aiSuggestion.time}`
          : aiSuggestion.date || aiSuggestion.time || 'Time TBD',
        estimatedDuration: aiSuggestion.duration || '2-3 hours',
        reasoning: `Selected through AI discovery chat. ${aiSuggestion.price ? `Price: ${aiSuggestion.price}` : ''}`
      };
      
      setSelectedOption(suggestionOption);
      
      // Pre-populate form data with AI suggestion
      setFormData(prev => ({
        ...prev,
        customTitle: aiSuggestion.eventName || '',
        venue: aiSuggestion.venue || '',
        address: aiSuggestion.address || '',
        city: aiSuggestion.city || '',
        state: aiSuggestion.state || '',
        zipCode: aiSuggestion.zipCode || '',
        detailedDescription: aiSuggestion.description || '',
        requirements: aiSuggestion.requirements || '',
        contactInfo: aiSuggestion.contactInfo || '',
        venueType: aiSuggestion.venueType || '',
        priceInfo: aiSuggestion.price || '',
        capacity: aiSuggestion.capacity || '',
        location: suggestionOption.suggestedLocation,
      }));
      
      // Only fetch friends for AI suggestions
      fetchFriends();
    } else if (preselectedTemplate) {
      // If template is preselected, we only need to fetch friends
      fetchFriends();
    } else {
      // Otherwise fetch both activities and friends
      Promise.all([fetchActivities(), fetchFriends()]);
    }
  }, [preselectedTemplate, aiSuggestion]);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activities');
      if (response.ok) {
        const data = await response.json();
        setActivities(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      setActivities([]); // Ensure activities is always an array even on error
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends');
      if (response.ok) {
        const data = await response.json();
        setFriends(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch friends:', err);
      setFriends([]); // Ensure friends is always an array even on error
    } finally {
      setLoading(false);
    }
  };

  const handleActivitySelect = (activity: Activity) => {
    setSelectedActivity(activity);
    setCurrentStep('ai-discovery');
  };

  const handleOptionSelected = (option: DiscoveredOption) => {
    setSelectedOption(option);
    // Pre-fill form data based on AI suggestion
    setFormData(prev => ({
      ...prev,
      customTitle: option.name,
      detailedDescription: option.description,
      location: option.suggestedLocation,
    }));
    setCurrentStep('event-details');
  };

  const handleSkipAI = () => {
    setCurrentStep('event-details');
  };

  const handleChange = (field: string, value: string | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.datetime) {
      newErrors.datetime = 'Date and time are required';
    }

    if (!formData.location && !formData.venue && !formData.address) {
      newErrors.location = 'Please provide either a general location, venue name, or address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedActivity) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: selectedActivity.id,
          datetime: formData.datetime,
          endDate: formData.endDate || null,
          isAllDay: formData.isAllDay,
          location: formData.location,
          friendIds: formData.friendIds,
          // Rich fields
          customTitle: formData.customTitle || null,
          venue: formData.venue || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          zipCode: formData.zipCode || null,
          detailedDescription: formData.detailedDescription || null,
          requirements: formData.requirements || null,
          contactInfo: formData.contactInfo || null,
          venueType: formData.venueType || null,
          priceInfo: formData.priceInfo || null,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }

      const instance = await response.json();
      setCreatedInstanceId(instance.id);
      setCurrentStep('finalize');
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  // Step: Activity Selection
  if (currentStep === 'activity-selection') {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Select Activity Template</h2>
            <p className="text-gray-600">Choose from your activity templates</p>
          </div>
        </div>

        {activities.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-200 bg-slate-50">
            <CardContent className="text-center py-12">
              <Layers className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activity templates yet</h3>
              <p className="text-gray-600 mb-4">Create your first template to start organizing events</p>
              <Button onClick={() => router.push('/activities/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(activities ?? []).map((activity) => (
              <Card 
                key={activity.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300"
                onClick={() => handleActivitySelect(activity)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Layers className="h-5 w-5 text-slate-600 mr-2" />
                    {activity.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activity.description && (
                    <p className="text-sm text-gray-700">{activity.description}</p>
                  )}
                  {(activity?.values?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(activity?.values ?? []).slice(0, 2).map((av, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Heart className="h-3 w-3 mr-1" />
                          {av?.value?.name}
                        </Badge>
                      ))}
                      {(activity?.values?.length ?? 0) > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{(activity?.values?.length ?? 0) - 2} more
                        </Badge>
                      )}
                    </div>
                  )}
                  <Button className="w-full">
                    Select Template
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Step: AI Discovery
  if (currentStep === 'ai-discovery') {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => {
            if (preselectedTemplate) {
              onBack();
            } else {
              setCurrentStep('activity-selection');
            }
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {preselectedTemplate ? 'Back' : 'Select Template'}
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Discover Options with AI</h2>
            <p className="text-gray-600">Get AI-powered suggestions for your {selectedActivity?.name} event</p>
          </div>
        </div>

        {/* Skip AI Option */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Want to skip AI suggestions?</h4>
                <p className="text-sm text-blue-800">Create your event manually with full control over all details</p>
              </div>
              <Button variant="outline" onClick={handleSkipAI}>
                Skip AI & Create Manually
              </Button>
            </div>
          </CardContent>
        </Card>

        <AIActivityDiscovery
          selectedActivity={selectedActivity!}
          onOptionSelected={handleOptionSelected}
          onBack={() => setCurrentStep('activity-selection')}
        />
      </div>
    );
  }

  // Step: Event Details
  if (currentStep === 'event-details') {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => {
            if (preselectedTemplate && !selectedOption) {
              onBack();
            } else if (selectedOption) {
              setCurrentStep('ai-discovery');
            } else {
              setCurrentStep('activity-selection');
            }
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Event Details</h2>
            <p className="text-gray-600">Complete the details for your {selectedActivity?.name} event</p>
          </div>
        </div>

        {/* AI Suggestion Context */}
        {selectedOption && (
          <Card className="bg-purple-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-900">
                <Sparkles className="h-5 w-5 mr-2" />
                AI Suggestion Applied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-purple-800">
                  <strong>{selectedOption.name}</strong> - {selectedOption.description}
                </p>
                <p className="text-xs text-purple-700">
                  {selectedOption.reasoning}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {/* Basic Event Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Event Title (Optional)" error={errors.customTitle}>
                <Input
                  value={formData.customTitle}
                  onChange={(e) => handleChange('customTitle', e.target.value)}
                  placeholder={`e.g., Weekend ${selectedActivity?.name || 'Event'}`}
                />
              </FormField>

              <FormField label="Event Date & Time" required error={errors.datetime}>
                <DateRangePicker
                  startDate={formData.datetime}
                  endDate={formData.endDate}
                  isAllDay={formData.isAllDay}
                  onStartDateChange={(date) => handleChange('datetime', date)}
                  onEndDateChange={(date) => handleChange('endDate', date)}
                  onIsAllDayChange={(isAllDay) => handleChange('isAllDay', isAllDay)}
                  error={errors.datetime}
                />
              </FormField>

              <FormField label="General Location" error={errors.location}>
                <Input
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g., Downtown, Central Park, My place"
                />
              </FormField>

              <FormField label="Detailed Description">
                <Textarea
                  value={formData.detailedDescription}
                  onChange={(e) => handleChange('detailedDescription', e.target.value)}
                  placeholder="Additional details about the event..."
                  rows={3}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Venue Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 text-green-600 mr-2" />
                Venue Details (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Venue Name">
                  <Input
                    value={formData.venue}
                    onChange={(e) => handleChange('venue', e.target.value)}
                    placeholder="e.g., Central Park, Joe's Restaurant"
                  />
                </FormField>

                <FormField label="Venue Type">
                  <Input
                    value={formData.venueType}
                    onChange={(e) => handleChange('venueType', e.target.value)}
                    placeholder="e.g., Restaurant, Park, Home"
                  />
                </FormField>
              </div>

              <FormField label="Address">
                <Input
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Street address"
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="City">
                  <Input
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="City"
                  />
                </FormField>

                <FormField label="State">
                  <Input
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="State"
                  />
                </FormField>

                <FormField label="Zip Code">
                  <Input
                    value={formData.zipCode}
                    onChange={(e) => handleChange('zipCode', e.target.value)}
                    placeholder="12345"
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 text-purple-600 mr-2" />
                Additional Information (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="What to Bring / Requirements">
                  <Textarea
                    value={formData.requirements}
                    onChange={(e) => handleChange('requirements', e.target.value)}
                    placeholder="e.g., Bring water bottle, comfortable shoes"
                    rows={2}
                  />
                </FormField>

                <FormField label="Contact Information">
                  <Textarea
                    value={formData.contactInfo}
                    onChange={(e) => handleChange('contactInfo', e.target.value)}
                    placeholder="e.g., Call me at 555-1234"
                    rows={2}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Price Information">
                  <Input
                    value={formData.priceInfo}
                    onChange={(e) => handleChange('priceInfo', e.target.value)}
                    placeholder="e.g., $20 per person, Free"
                  />
                </FormField>

                <FormField label="Capacity (Max People)">
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => handleChange('capacity', e.target.value)}
                    placeholder="e.g., 8"
                    min="1"
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>

          {/* Friends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 text-green-600 mr-2" />
                Invite Friends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {friends.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-2">No friends added yet</p>
                  <Button variant="outline" onClick={() => router.push('/friends/new')}>
                    Add Friends
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Select friends to invite ({formData.friendIds.length} selected):
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {(friends ?? []).map((friend) => (
                      <label
                        key={friend.id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.friendIds.includes(friend.id)}
                          onChange={(e) => {
                            const updatedFriends = e.target.checked
                              ? [...formData.friendIds, friend.id]
                              : formData.friendIds.filter(id => id !== friend.id);
                            handleChange('friendIds', updatedFriends);
                          }}
                        />
                        <span className="font-medium">{friend.name}</span>
                        {friend.group && <Badge variant="outline" className="text-xs">{friend.group}</Badge>}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {errors.submit && (
            <div className="text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded-lg">
              {errors.submit}
            </div>
          )}

          <div className="flex space-x-4">
            <Button type="submit" disabled={submitting} size="lg">
              {submitting ? 'Creating Event...' : 'Create Event'}
            </Button>
            <Button type="button" variant="outline" onClick={onBack}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Step: Finalize/Success
  if (currentStep === 'finalize' && createdInstanceId) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Created Successfully!</h2>
          <p className="text-gray-600">Your {selectedActivity?.name} event has been scheduled</p>
        </div>

        {/* Calendar Export */}
        <CalendarIntegration 
          instanceId={createdInstanceId}
          activityName={formData.customTitle || selectedActivity?.name || 'Event'}
        />

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <UserCheck className="h-5 w-5 text-blue-600" />
              <span>Send invites to your friends</span>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-green-600" />
              <span>Add to your calendar</span>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-purple-600" />
              <span>Share location details</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex space-x-4">
          <Button onClick={() => router.push(`/invite/${createdInstanceId}`)} size="lg">
            <Users className="h-4 w-4 mr-2" />
            Send Invites
          </Button>
          <Button variant="outline" onClick={() => router.push('/')}>
            Back to Dashboard
          </Button>
          <Button variant="outline" onClick={() => router.push('/schedule')}>
            Create Another Event
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
