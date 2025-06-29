
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/form-field';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ArrowLeft, Plus, Layers, Heart } from 'lucide-react';

interface CoreValue {
  id: string;
  name: string;
  description: string | null;
}

export default function NewActivityTemplatePage() {
  const router = useRouter();
  const [values, setValues] = useState<CoreValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    valueIds: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchValues();
  }, []);

  const fetchValues = async () => {
    try {
      const response = await fetch('/api/values');
      if (response.ok) {
        const data = await response.json();
        setValues(data);
      }
    } catch (err) {
      console.error('Failed to fetch values:', err);
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
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create activity template');
      }

      router.push('/activities');
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

  const toggleValue = (valueId: string) => {
    const updatedValueIds = formData.valueIds.includes(valueId)
      ? formData.valueIds.filter(id => id !== valueId)
      : [...formData.valueIds, valueId];
    handleChange('valueIds', updatedValueIds);
  };

  if (loading) return <LoadingSpinner />;

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
            Create Activity Template
          </h1>
          <p className="text-gray-600 mt-1">Define a reusable template for creating specific events</p>
        </div>
      </div>

      {/* Help Text */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="py-4">
          <div className="flex items-start space-x-3">
            <Layers className="h-5 w-5 text-slate-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 mb-1">What are Activity Templates?</h3>
              <p className="text-sm text-gray-600">
                Templates are reusable activity types like "Hiking", "Movie Night", or "Dinner". You'll use them to create specific events with AI assistance later.
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
                placeholder="e.g., Hiking, Movie Night, Dinner, Concert"
                required
              />
            </FormField>

            <FormField label="Description" error={errors.description}>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe this activity template (optional)"
                rows={3}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Values */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 text-red-600 mr-2" />
                  Associated Core Values
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Which of your values does this template align with? (Optional)
                </p>
              </div>
              {values.length === 0 && (
                <Link href="/values/new">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Values
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {values.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No core values defined</h3>
                <p className="text-gray-600 mb-4">Create your core values first to associate them with templates.</p>
                <Link href="/values/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Value
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-3">
                  Select values that this template represents ({formData.valueIds.length} selected):
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {values.map((value) => (
                    <label
                      key={value.id}
                      className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.valueIds.includes(value.id)}
                        onChange={() => toggleValue(value.id)}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{value.name}</div>
                        {value.description && (
                          <div className="text-sm text-gray-600">{value.description}</div>
                        )}
                      </div>
                    </label>
                  ))}
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
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating Template...' : 'Create Activity Template'}
          </Button>
          <Link href="/activities">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
