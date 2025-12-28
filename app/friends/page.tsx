

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { Users, Plus, Edit, Trash2, Upload, Download } from 'lucide-react';

interface Friend {
  id: string;
  name: string;
  group: string | null;
  createdAt: string;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends');
      if (!response.ok) throw new Error('Failed to fetch friends');
      const data = await response.json();
      // Ensure data is an array before setting and filter out nulls
      setFriends(Array.isArray(data) ? data.filter((item): item is Friend => item !== null && item !== undefined) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setFriends([]); // Ensure friends is always an array even on error
    } finally {
      setLoading(false);
    }
  };

  const deleteFriend = async (id: string) => {
    if (!confirm('Are you sure you want to delete this friend?')) return;

    try {
      const response = await fetch(`/api/friends/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete friend');
      setFriends(friends.filter(friend => friend.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete friend');
    }
  };

  const exportFriends = async () => {
    try {
      const response = await fetch('/api/friends/export');
      if (!response.ok) throw new Error('Failed to export friends');

      // Create a blob from the response
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `friends-export-${new Date().toISOString().split('T')[0]}.csv`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export friends');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(friends.map(f => f.group || 'No Group')))].sort();
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter friends based on selection
  const filteredFriends = selectedCategory === 'All'
    ? friends
    : friends.filter(f => (f.group || 'No Group') === selectedCategory);

  // Group filtered friends by group
  const groupedFriends = (filteredFriends ?? []).reduce((acc, friend) => {
    const group = friend?.group || 'No Group';
    if (!acc[group]) acc[group] = [];
    acc[group].push(friend);
    return acc;
  }, {} as Record<string, Friend[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Friends</h1>
          <p className="text-gray-600 mt-1">Manage your contacts and organize them by groups</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-md leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
          </div>

          <Button variant="outline" asChild>
            <Link href="/friends/import">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Link>
          </Button>
          <Button variant="outline" onClick={exportFriends}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button asChild>
            <Link href="/friends/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Friend
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            <CardTitle>Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-gray-900">{friends.length}</div>
              <p className="text-gray-600 text-sm">Total Friends</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{categories.length - 1}</div>
              <p className="text-gray-600 text-sm">Groups</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {friends.filter(f => f.group).length}
              </div>
              <p className="text-gray-600 text-sm">Grouped Friends</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Friends List */}
      {filteredFriends.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No friends found</h3>
            <p className="text-gray-600 mb-4"> Try adjusting your filter or add new friends.</p>
            {friends.length === 0 && ( /* Only show add/import if NO friends total */
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" asChild>
                  <Link href="/friends/import">
                    <Upload className="h-4 w-4 mr-2" />
                    Import from CSV
                  </Link>
                </Button>
                <Button variant="outline" onClick={exportFriends}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button asChild>
                  <Link href="/friends/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Friend
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFriends).map(([group, groupFriends]) => (
            <Card key={group}>
              <CardHeader>
                <CardTitle className="text-lg">{group}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Added</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupFriends.map((friend) => (
                        <tr key={friend.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{friend.name}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {(() => {
                              try {
                                const date = friend?.createdAt ? new Date(friend.createdAt) : null;
                                return date && !isNaN(date.getTime()) ? date.toLocaleDateString('en-US') : 'Date unknown';
                              } catch {
                                return 'Date unknown';
                              }
                            })()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/friends/${friend.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteFriend(friend.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

