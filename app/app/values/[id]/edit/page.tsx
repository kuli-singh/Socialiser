
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/form-field';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface CoreValue {
  id: string;
  name: string;
  description: string | null;
}

export default function EditValuePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [value, setValue] = useState<CoreValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchValue();
  }, [params.id]);

  const fetchValue = async () => {
    try {
      const response = await fetch(`/api/values/${params.id}`);
      if (!response.ok) throw new Error('Value not found');
      
      const data = await response.json();
      setValue(data);
      setFormData({
        name: data.name,
        description: data.description || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch value');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const response = await fetch(`/api/values/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update value');
      }

      router.push('/values');
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'An error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!value) return <ErrorMessage message="Value not found" />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/values">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Value</h1>
          <p className="text-gray-600 mt-1">Update {value.name}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Value Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="Value Name" required error={errors.name}>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Family Time, Health, Learning, Adventure"
                required
              />
            </FormField>

            <FormField label="Description" error={errors.description}>
              <Textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe what this value means to you and why it's important..."
                rows={4}
              />
              <p className="text-sm text-gray-500 mt-1">
                Optional: Help yourself remember why this value matters
              </p>
            </FormField>

            {errors.submit && (
              <div className="text-red-600 text-sm">{errors.submit}</div>
            )}

            <div className="flex space-x-4">
              <Button type="submit" disabled={saving}>
                {saving ? 'Updating...' : 'Update Value'}
              </Button>
              <Link href="/values">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
