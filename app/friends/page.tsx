

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { Users, Plus, Edit, Trash2, Upload } from 'lucide-react';

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
      setFriends(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  // Group friends by group
  const groupedFriends = friends.reduce((acc, friend) => {
    const group = friend.group || 'No Group';
    if (!acc[group]) acc[group] = [];
    acc[group].push(friend);
    return acc;
  }, {} as Record<string, Friend[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Friends</h1>
          <p className="text-gray-600 mt-1">Manage your contacts and organize them by groups</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/friends/import">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          </Link>
          <Link href="/friends/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Friend
            </Button>
          </Link>
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
              <div className="text-2xl font-bold text-gray-900">{Object.keys(groupedFriends).length}</div>
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
      {friends.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No friends added yet</h3>
            <p className="text-gray-600 mb-4">Start building your social network!</p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/friends/import">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import from CSV
                </Button>
              </Link>
              <Link href="/friends/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Friend
                </Button>
              </Link>
            </div>
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
                                return date && !isNaN(date.getTime()) ? date.toLocaleDateString() : 'Date unknown';
                              } catch {
                                return 'Date unknown';
                              }
                            })()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Link href={`/friends/${friend.id}/edit`}>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
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

