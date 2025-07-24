
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { Heart, Plus, Edit, Trash2 } from 'lucide-react';

interface CoreValue {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export default function ValuesPage() {
  const [values, setValues] = useState<CoreValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchValues();
  }, []);

  const fetchValues = async () => {
    try {
      const response = await fetch('/api/values');
      if (!response.ok) throw new Error('Failed to fetch values');
      
      const data = await response.json();
      setValues(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deleteValue = async (id: string) => {
    if (!confirm('Are you sure you want to delete this value?')) return;

    try {
      const response = await fetch(`/api/values/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete value');
      
      setValues(values.filter(value => value.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete value');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Values</h1>
          <p className="text-gray-600 mt-1">Define the core values that guide your social activities</p>
        </div>
        <Link href="/values/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Value
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Heart className="h-5 w-5 text-red-600 mr-2" />
            <CardTitle>Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-gray-900">{values.length}</div>
              <p className="text-gray-600 text-sm">Core Values Defined</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {values.filter(v => v.description).length}
              </div>
              <p className="text-gray-600 text-sm">With Descriptions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Values List */}
      {values.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No values defined yet</h3>
            <p className="text-gray-600 mb-4">Start by defining what matters most to you!</p>
            <Link href="/values/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Value
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {values.map((value) => (
            <Card key={value.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <Heart className="h-5 w-5 text-red-600 mr-2" />
                      {value.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Added {(() => {
                        try {
                          const date = value?.createdAt ? new Date(value.createdAt) : null;
                          return date && !isNaN(date.getTime()) ? date.toLocaleDateString() : 'Date unknown';
                        } catch {
                          return 'Date unknown';
                        }
                      })()}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Link href={`/values/${value.id}/edit`}>
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteValue(value.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {value.description ? (
                  <p className="text-sm text-gray-700">{value.description}</p>
                ) : (
                  <p className="text-sm text-gray-500 italic">No description provided</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
