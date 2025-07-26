import React from 'react';
import { Friend } from '../lib/types';
import { formatDate } from '../lib/utils';

interface FriendCardProps {
  friend: Friend;
  onEdit?: (friend: Friend) => void;
  onDelete?: (friendId: string) => void;
  onExport?: (friend: Friend) => void;
}

export const FriendCard: React.FC<FriendCardProps> = ({
  friend,
  onEdit,
  onDelete,
  onExport
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{friend.name}</h3>
          <p className="text-gray-600">{friend.email}</p>
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={() => onEdit(friend)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Edit
            </button>
          )}
          {onExport && (
            <button
              onClick={() => onExport(friend)}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Export
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(friend.id)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      
      {friend.phone && (
        <p className="text-gray-700 mb-2">
          <span className="font-medium">Phone:</span> {friend.phone}
        </p>
      )}
      
      {friend.birthday && (
        <p className="text-gray-700 mb-2">
          <span className="font-medium">Birthday:</span> {formatDate(friend.birthday)}
        </p>
      )}
      
      {friend.notes && (
        <p className="text-gray-700 mb-2">
          <span className="font-medium">Notes:</span> {friend.notes}
        </p>
      )}
      
      {friend.tags && friend.tags.length > 0 && (
        <div className="mb-2">
          <span className="font-medium text-gray-700">Tags:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {friend.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-4">
        <p>Created: {formatDate(friend.createdAt)}</p>
        <p>Updated: {formatDate(friend.updatedAt)}</p>
      </div>
    </div>
  );
};

export default FriendCard;
