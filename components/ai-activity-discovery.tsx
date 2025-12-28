
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/loading-spinner';
import { FormField } from '@/components/form-field';
import { Sparkles, MapPin, Clock, ArrowRight, Lightbulb, ExternalLink } from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  description: string | null;
}

interface DiscoveredOption {
  name: string;
  description: string;
  suggestedLocation: string;
  suggestedTime: string;
  estimatedDuration: string;

  reasoning: string;
  url?: string;
}

interface AIActivityDiscoveryProps {
  selectedActivity: Activity;
  onOptionSelected: (option: DiscoveredOption) => void;
  onBack: () => void;
}

export function AIActivityDiscovery({
  selectedActivity,
  onOptionSelected,
  onBack
}: AIActivityDiscoveryProps) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<DiscoveredOption[]>([]);
  const [preferences, setPreferences] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleDiscover = async () => {
    setLoading(true);
    setError(null);
    setOptions([]);

    try {
      const response = await fetch('/api/ai-discovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityName: selectedActivity.name,
          location: location?.trim() || undefined,
          preferences: preferences?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to discover activity options');
      }

      const data = await response.json();
      setOptions(data.options || []);
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="h-8 w-8 text-yellow-500 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">AI Activity Discovery</h2>
        </div>
        <p className="text-gray-600">
          Let AI suggest specific options for your "{selectedActivity.name}" activity
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 text-blue-600 mr-2" />
            Customize Your Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="General Location (Optional)">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., downtown, near parks, city center..."
            />
          </FormField>

          <FormField label="Additional Preferences (Optional)">
            <Textarea
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="e.g., beginner-friendly, outdoor setting, group-oriented, budget-conscious..."
              rows={3}
            />
          </FormField>

          <div className="flex space-x-3">
            <Button
              onClick={handleDiscover}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <LoadingSpinner />
                  Discovering Options...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Discover Specific Options
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* AI Suggestions */}
      {options.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              AI-Suggested Options for {selectedActivity.name}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((option, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300"
                onClick={() => onOptionSelected(option)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-blue-900">{option.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-700">{option.description}</p>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-green-600" />
                      {option.suggestedLocation}
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2 text-blue-600" />
                      {option.suggestedTime} • {option.estimatedDuration}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Why this works:</strong> {option.reasoning}
                    </p>
                  </div>

                  {option.url && (
                    <div className="flex items-center text-xs text-blue-600">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      <a
                        href={option.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Details
                      </a>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOptionSelected(option);
                    }}
                  >
                    Select This Option
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {hasSearched && options.length === 0 && !loading && !error && (
        <div className="text-center py-8">
          <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your preferences or search again.</p>
          <Button onClick={handleDiscover} variant="outline">
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
