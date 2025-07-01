
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/form-field';
import { LoadingSpinner } from '@/components/loading-spinner';
import { AIActivityDiscovery } from '@/components/ai-activity-discovery';
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
  Phone,
  DollarSign,
  UserCheck
} from 'lucide-react';

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
  const [currentStep, setCurrentStep] = useState<Step>(
    aiSuggestion ? 'event-details' : (preselectedTemplate ? 'ai-discovery' : 'activity-selection')
  );
  const [activities, setActivities] = useState<Activity[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(preselectedTemplate || null);
  const [selectedOption, setSelectedOption] = useState<DiscoveredOption | null>(null);
  const [formData, setFormData] = useState({
    datetime: '',
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
        setActivities(data);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends');
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (err) {
      console.error('Failed to fetch friends:', err);
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
      // Parse venue from suggestedLocation if it contains a comma
      venue: option.suggestedLocation.includes(',') 
        ? option.suggestedLocation.split(',')[0].trim()
        : '',
      address: option.suggestedLocation.includes(',') 
        ? option.suggestedLocation.split(',').slice(1).join(',').trim()
        : option.suggestedLocation,
    }));
    setCurrentStep('event-details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    // Validation
    if (!selectedActivity) {
      setErrors({ activity: 'Please select an activity template' });
      setSubmitting(false);
      return;
    }

    if (!formData.datetime) {
      setErrors({ datetime: 'Please select a date and time' });
      setSubmitting(false);
      return;
    }

    if (formData.friendIds.length === 0) {
      setErrors({ friendIds: 'Please select at least one friend' });
      setSubmitting(false);
      return;
    }

    try {
      // Create activity instance with rich details
      const instanceData = {
        activityId: selectedActivity.id,
        datetime: formData.datetime,
        location: formData.location || null,
        friendIds: formData.friendIds,
        // Rich instance fields
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
      };

      const response = await fetch('/api/instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(instanceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule activity');
      }

      const instance = await response.json();
      router.push(`/invite/${instance.id}`);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleFriend = (friendId: string) => {
    const updatedFriendIds = formData.friendIds.includes(friendId)
      ? formData.friendIds.filter(id => id !== friendId)
      : [...formData.friendIds, friendId];
    handleChange('friendIds', updatedFriendIds);
  };

  // Get minimum datetime (now)
  const now = new Date();
  const minDateTime = now.toISOString().slice(0, 16);

  if (loading) return <LoadingSpinner />;

  // Step 1: Activity Selection (skipped if template is preselected)
  if (currentStep === 'activity-selection' && !preselectedTemplate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Choose Activity Template</h1>
            <p className="text-gray-600 mt-1">Select a template to create a specific event with AI assistance</p>
          </div>
        </div>

        {activities.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-200 bg-slate-50">
            <CardContent className="text-center py-12">
              <Layers className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activity templates available</h3>
              <p className="text-gray-600 mb-4">You need to create at least one activity template first.</p>
              <Button onClick={() => router.push('/activities/new')}>
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <Card 
                key={activity.id}
                className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300 border-l-4 border-l-slate-500"
                onClick={() => handleActivitySelect(activity)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        {activity.name}
                        <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-800 text-xs">
                          Template
                        </Badge>
                      </CardTitle>
                    </div>
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activity.description && (
                    <p className="text-sm text-gray-700">{activity.description}</p>
                  )}
                  
                  {activity.values.length > 0 && (
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Heart className="h-3 w-3 mr-1" />
                        Values:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {activity.values.slice(0, 3).map((av, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {av.value.name}
                          </Badge>
                        ))}
                        {activity.values.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{activity.values.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <Button 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActivitySelect(activity);
                    }}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get AI Suggestions
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Step 2: AI Discovery
  if (currentStep === 'ai-discovery' && selectedActivity) {
    return (
      <AIActivityDiscovery
        selectedActivity={selectedActivity}
        onOptionSelected={handleOptionSelected}
        onBack={preselectedTemplate ? onBack : () => setCurrentStep('activity-selection')}
      />
    );
  }

  // Step 3: Event Details
  if (currentStep === 'event-details' && selectedActivity) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => setCurrentStep('ai-discovery')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Details</h1>
            <p className="text-gray-600 mt-1">Customize your event with specific details</p>
          </div>
        </div>

        {/* Template Context */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="py-4">
            <div className="flex items-center space-x-3">
              <Layers className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-sm text-slate-600">Creating event from template:</p>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-slate-900">{selectedActivity.name}</span>
                  <Badge variant="secondary" className="bg-slate-200 text-slate-800 text-xs">
                    Template
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Selection Summary */}
        {selectedOption && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <CheckCircle className="h-5 w-5 mr-2" />
                AI Suggestion Applied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-800">
                AI has pre-filled the details below. You can customize them as needed.
              </p>
            </CardContent>
          </Card>
        )}

        <form className="space-y-6">
          {/* Event Title & Basic Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Info className="h-5 w-5 text-blue-600 mr-2" />
                <CardTitle>Event Title & Type</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Custom Event Title" required error={errors.customTitle}>
                <Input
                  value={formData.customTitle}
                  onChange={(e) => handleChange('customTitle', e.target.value)}
                  placeholder={`e.g., "Thai Cooking Lesson at Cordon Bleu"`}
                />
              </FormField>

              <FormField label="Event Type" error={errors.venueType}>
                <Select value={formData.venueType} onValueChange={(value) => handleChange('venueType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indoor">Indoor</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </CardContent>
          </Card>

          {/* Venue & Location */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Building className="h-5 w-5 text-green-600 mr-2" />
                <CardTitle>Venue & Location</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Venue Name" error={errors.venue}>
                <Input
                  value={formData.venue}
                  onChange={(e) => handleChange('venue', e.target.value)}
                  placeholder="e.g., Cordon Bleu Cookery School"
                />
              </FormField>

              <FormField label="Street Address" error={errors.address}>
                <Input
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="e.g., 123 Main Street"
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="City" error={errors.city}>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="City"
                  />
                </FormField>

                <FormField label="State" error={errors.state}>
                  <Input
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="State"
                  />
                </FormField>

                <FormField label="ZIP Code" error={errors.zipCode}>
                  <Input
                    value={formData.zipCode}
                    onChange={(e) => handleChange('zipCode', e.target.value)}
                    placeholder="ZIP"
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Heart className="h-5 w-5 text-purple-600 mr-2" />
                <CardTitle>Event Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Detailed Description" error={errors.detailedDescription}>
                <Textarea
                  value={formData.detailedDescription}
                  onChange={(e) => handleChange('detailedDescription', e.target.value)}
                  placeholder="Describe what participants will do, learn, or experience..."
                  rows={4}
                />
              </FormField>

              <FormField label="Requirements" error={errors.requirements}>
                <Textarea
                  value={formData.requirements}
                  onChange={(e) => handleChange('requirements', e.target.value)}
                  placeholder="What should participants bring or know beforehand?"
                  rows={3}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-orange-600 mr-2" />
                <CardTitle>Additional Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Pricing Info" error={errors.priceInfo}>
                  <Input
                    value={formData.priceInfo}
                    onChange={(e) => handleChange('priceInfo', e.target.value)}
                    placeholder="e.g., $75 per person"
                  />
                </FormField>

                <FormField label="Max Capacity" error={errors.capacity}>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => handleChange('capacity', e.target.value)}
                    placeholder="e.g., 12"
                  />
                </FormField>
              </div>

              <FormField label="Contact Information" error={errors.contactInfo}>
                <Input
                  value={formData.contactInfo}
                  onChange={(e) => handleChange('contactInfo', e.target.value)}
                  placeholder="Venue phone number, website, or other contact details"
                />
              </FormField>
            </CardContent>
          </Card>

          {/* AI Assist Button */}
          <Card className="border-dashed border-blue-300 bg-blue-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Need help with details?</p>
                    <p className="text-sm text-blue-700">AI can suggest venue details, descriptions, and requirements</p>
                  </div>
                </div>
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Suggest Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex space-x-4">
            <Button type="button" onClick={() => setCurrentStep('finalize')} size="lg">
              Continue to Scheduling
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => setCurrentStep('ai-discovery')}>
              Back to AI Suggestions
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Step 4: Finalize
  if (currentStep === 'finalize' && selectedActivity) {
    // Group friends by group
    const groupedFriends = friends.reduce((acc, friend) => {
      const group = friend.group || 'No Group';
      if (!acc[group]) acc[group] = [];
      acc[group].push(friend);
      return acc;
    }, {} as Record<string, Friend[]>);

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => setCurrentStep('event-details')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event Details
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Schedule & Invite</h1>
            <p className="text-gray-600 mt-1">Set the date/time and invite your friends</p>
          </div>
        </div>

        {/* Event Summary */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <CardTitle className="text-blue-900">Event Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                {formData.customTitle || selectedActivity.name}
              </h3>
              <p className="text-sm text-blue-700">
                Based on template: <span className="font-medium">{selectedActivity.name}</span>
              </p>
            </div>
            
            {(formData.venue || formData.address) && (
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  {formData.venue && <div className="font-medium">{formData.venue}</div>}
                  {formData.address && (
                    <div>
                      {formData.address}
                      {formData.city && `, ${formData.city}`}
                      {formData.state && `, ${formData.state}`}
                      {formData.zipCode && ` ${formData.zipCode}`}
                    </div>
                  )}
                </div>
              </div>
            )}

            {formData.detailedDescription && (
              <div className="text-sm text-blue-800">
                <span className="font-medium">Description: </span>
                {formData.detailedDescription.length > 100 
                  ? `${formData.detailedDescription.substring(0, 100)}...`
                  : formData.detailedDescription
                }
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {formData.venueType && (
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  {formData.venueType}
                </Badge>
              )}
              {formData.priceInfo && (
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  {formData.priceInfo}
                </Badge>
              )}
              {formData.capacity && (
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  Max {formData.capacity} people
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Template Context */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="py-4">
            <div className="flex items-center space-x-3">
              <Layers className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-sm text-slate-600">Creating event from template:</p>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-slate-900">{selectedActivity.name}</span>
                  <Badge variant="secondary" className="bg-slate-200 text-slate-800 text-xs">
                    Template
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Selection Summary */}
        {selectedOption && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <CheckCircle className="h-5 w-5 mr-2" />
                AI Suggestion Selected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-medium text-green-900">{selectedOption.name}</h4>
                <p className="text-sm text-green-800">{selectedOption.description}</p>
                <div className="flex items-center text-sm text-green-700">
                  <MapPin className="h-4 w-4 mr-1" />
                  {selectedOption.suggestedLocation}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date, Time & Location */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-green-600 mr-2" />
                <CardTitle>When & Where</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Date & Time" required error={errors.datetime}>
                <Input
                  type="datetime-local"
                  value={formData.datetime}
                  onChange={(e) => handleChange('datetime', e.target.value)}
                  min={minDateTime}
                  required
                />
              </FormField>

              <FormField label="Location" error={errors.location}>
                <Input
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder={selectedOption ? selectedOption.suggestedLocation : "Where will this activity take place?"}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Friend Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-purple-600 mr-2" />
                <CardTitle>Invite Friends</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No friends added</h3>
                  <p className="text-gray-600 mb-4">You need to add friends to invite them.</p>
                  <Button onClick={() => router.push('/friends/new')}>
                    Add Your First Friend
                  </Button>
                </div>
              ) : (
                <FormField label="Select Friends" required error={errors.friendIds}>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Choose who to invite ({formData.friendIds.length} selected):
                    </p>
                    
                    {Object.entries(groupedFriends).map(([group, groupFriends]) => (
                      <div key={group} className="space-y-2">
                        <h4 className="font-medium text-gray-700">{group}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {groupFriends.map((friend) => (
                            <label
                              key={friend.id}
                              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.friendIds.includes(friend.id)}
                                onChange={() => toggleFriend(friend.id)}
                              />
                              <span className="font-medium text-gray-900">{friend.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </FormField>
              )}
            </CardContent>
          </Card>

          {errors.submit && (
            <div className="text-red-600 text-sm">{errors.submit}</div>
          )}

          {/* Submit */}
          <div className="flex space-x-4">
            <Button type="submit" disabled={submitting} size="lg">
              {submitting ? 'Creating Event...' : 'Create Event & Generate Invite'}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={onBack}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return null;
}
