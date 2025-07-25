
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/form-field';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { ArrowLeft, Save, Heart, Check, Layers, Calendar } from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  description: string | null;
  values: Array<{
    value: {
      id: string;
      name: string;
    };
  }>;
  _count?: {
    instances: number;
  };
}

interface CoreValue {
  id: string;
  name: string;
  description: string | null;
}

export default function EditActivityTemplatePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [allValues, setAllValues] = useState<CoreValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    valueIds: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([fetchActivity(), fetchValues()]);
  }, [params.id]);

  const fetchActivity = async () => {
    try {
      const response = await fetch(`/api/activities/${params.id}`);
      if (!response.ok) throw new Error('Activity template not found');
      
      const data = await response.json();
      setActivity(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        valueIds: (data?.values ?? []).map((v: any) => v?.value?.id).filter(Boolean),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity template');
    }
  };

  const fetchValues = async () => {
    try {
      const response = await fetch('/api/values');
      if (response.ok) {
        const data = await response.json();
        setAllValues(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch values:', err);
      setAllValues([]); // Ensure allValues is always an array even on error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    if (!formData.name.trim()) {
      setErrors({ name: 'Template name is required' });
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/activities/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          valueIds: formData.valueIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update activity template');
      }

      router.push('/activities');
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'An error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleValue = (valueId: string) => {
    const updatedValueIds = formData.valueIds.includes(valueId)
      ? formData.valueIds.filter(id => id !== valueId)
      : [...formData.valueIds, valueId];
    setFormData(prev => ({ ...prev, valueIds: updatedValueIds }));
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!activity) return <ErrorMessage message="Activity template not found" />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/activities">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Activity Templates
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Layers className="h-8 w-8 text-slate-600 mr-3" />
            Edit Activity Template
          </h1>
          <p className="text-gray-600 mt-1">Update your reusable template details and associated values</p>
        </div>
      </div>

      {/* Template Context */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Layers className="h-5 w-5 text-slate-600" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-slate-900">{activity.name}</span>
                  <Badge variant="secondary" className="bg-slate-200 text-slate-800 text-xs">
                    Template
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">
                  {activity._count?.instances || 0} events created from this template
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              {(activity._count?.instances || 0) > 0 && (
                <Link href={`/templates/${activity.id}/events`}>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    View Events ({activity._count?.instances})
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 rounded-full p-1">
              <Layers className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Editing Template</h3>
              <p className="text-sm text-blue-800">
                Changes to this template won't affect existing events. Only new events created from this template will use the updated details.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Template Name" required error={errors.name}>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Hiking, Concert, Movie Night, Dinner"
                required
              />
            </FormField>

            <FormField label="Description" error={errors.description}>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe this activity template..."
                rows={3}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Core Values Association */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Heart className="h-5 w-5 text-red-600 mr-2" />
              <CardTitle>Associated Core Values</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <FormField 
              label="Select values that align with this template" 
              error={errors.valueIds}
            >
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Choose the core values that this template supports ({formData.valueIds.length} selected):
                </p>
                
                {allValues.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No values available</h3>
                    <p className="text-gray-600 mb-4">Create some core values first to associate with templates.</p>
                    <Link href="/values/new">
                      <Button>Create Your First Value</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(allValues ?? []).map((value) => (
                      <label
                        key={value.id}
                        className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                          formData.valueIds.includes(value.id)
                            ? 'bg-blue-50 border-blue-300 shadow-sm'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            checked={formData.valueIds.includes(value.id)}
                            onChange={() => toggleValue(value.id)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            formData.valueIds.includes(value.id)
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300'
                          }`}>
                            {formData.valueIds.includes(value.id) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{value.name}</div>
                          {value.description && (
                            <div className="text-sm text-gray-600 mt-1">{value.description}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </FormField>

            {/* Selected Values Summary */}
            {formData.valueIds.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Selected Values:</h4>
                <div className="flex flex-wrap gap-2">
                  {(formData?.valueIds ?? []).map((valueId) => {
                    const value = (allValues ?? []).find(v => v?.id === valueId);
                    return value ? (
                      <span
                        key={valueId}
                        className="inline-flex items-center bg-green-200 text-green-800 text-sm px-3 py-1 rounded-full"
                      >
                        <Heart className="h-3 w-3 mr-1" />
                        {value?.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {errors.submit && (
          <div className="text-red-600 text-sm">{errors.submit}</div>
        )}

        {/* Submit */}
        <div className="flex space-x-4">
          <Button type="submit" disabled={submitting} size="lg">
            {submitting ? (
              <>
                <LoadingSpinner />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Template Changes
              </>
            )}
          </Button>
          <Link href="/activities">
            <Button type="button" variant="outline" size="lg">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
