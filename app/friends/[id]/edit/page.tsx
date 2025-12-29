
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

interface Friend {
  id: string;
  name: string;
  email: string | null;
  notes: string | null;
  group: string | null;
}

export default function EditFriendPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [friend, setFriend] = useState<Friend | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    group: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchFriend();
  }, [params.id]);

  const fetchFriend = async () => {
    try {
      const response = await fetch(`/api/friends/${params.id}`);
      if (!response.ok) throw new Error('Friend not found');

      const data = await response.json();
      setFriend(data);
      setFormData({
        name: data.name,
        email: data.email || '',
        group: data.group || '',
        notes: data.notes || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch friend');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const response = await fetch(`/api/friends/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update friend');
      }

      router.push('/friends');
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
  if (!friend) return <ErrorMessage message="Friend not found" />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/friends">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Friend</h1>
          <p className="text-gray-600 mt-1">Update {friend.name}'s information</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Friend Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="Name" required error={errors.name}>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter their full name"
                required
              />
            </FormField>

            <FormField label="Email" error={errors.email}>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="their.email@example.com"
              />
              <p className="text-sm text-gray-500 mt-1">
                Optional: Add email to enable invite sending via email
              </p>
            </FormField>

            <FormField label="Group" error={errors.group}>
              <Input
                value={formData.group}
                onChange={(e) => handleChange('group', e.target.value)}
                placeholder="e.g., Close Friends, Work, Family"
              />
              <p className="text-sm text-gray-500 mt-1">
                Optional: Organize friends into groups for easier management
              </p>
            </FormField>

            <FormField label="Notes" error={errors.notes}>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Add some notes about your friend..."
                rows={4}
              />
              <p className="text-sm text-gray-500 mt-1">
                Optional: Add personal notes about this friend
              </p>
            </FormField>

            {errors.submit && (
              <div className="text-red-600 text-sm">{errors.submit}</div>
            )}

            <div className="flex space-x-4">
              <Button type="submit" disabled={saving}>
                {saving ? 'Updating...' : 'Update Friend'}
              </Button>
              <Link href="/friends">
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
