'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, X } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  name: string;
  bio: string;
  avatar_url?: string;
  interests: string[];
  plans_hosted: number;
  plans_joined: number;
}

const AVAILABLE_INTERESTS = [
  'gaming',
  'coffee',
  'hiking',
  'dining',
  'shopping',
  'cultural',
  'sports',
  'photography',
  'reading',
  'music',
  'cooking',
  'art',
];

// Mock current user
const mockUser: UserProfile = {
  id: '2',
  name: 'Alex Chen',
  bio: 'Love exploring new places and meeting interesting people. Coffee enthusiast and weekend hiker.',
  avatar_url: 'https://i.pravatar.cc/150?img=2',
  interests: ['coffee', 'hiking', 'photography'],
  plans_hosted: 3,
  plans_joined: 12,
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile>(mockUser);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user.name,
    bio: user.bio,
    interests: [...user.interests],
  });

  const handleToggleInterest = (interest: string) => {
    setEditData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSaveProfile = () => {
    setUser((prev) => ({
      ...prev,
      name: editData.name,
      bio: editData.bio,
      interests: editData.interests,
    }));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: user.name,
      bio: user.bio,
      interests: [...user.interests],
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 md:px-6 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="rounded-lg">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-slate-900">
              {isEditing ? 'Edit Profile' : 'Profile'}
            </h1>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="rounded-lg"
            >
              Edit Profile
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 md:px-6">
        {/* Avatar Section */}
        <div className="mb-8">
          {isEditing ? (
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-teal-600">
                    {user.name[0]}
                  </span>
                )}
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                <Upload size={16} />
                Upload Photo
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-teal-600">
                    {user.name[0]}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Content */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          {isEditing ? (
            // Edit Mode
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Your name"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={editData.bio}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  rows={4}
                />
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Interests
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => handleToggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        editData.interests.includes(interest)
                          ? 'bg-teal-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveProfile}
                  className="flex-1 rounded-lg"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 rounded-lg"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="space-y-8">
              {/* Name and Bio */}
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  {user.name}
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  {user.bio}
                </p>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-slate-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal-600">
                    {user.plans_hosted}
                  </p>
                  <p className="text-sm text-slate-600">Plans Hosted</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal-600">
                    {user.plans_joined}
                  </p>
                  <p className="text-sm text-slate-600">Plans Joined</p>
                </div>
              </div>

              {/* Interests Tags */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest) => (
                    <div
                      key={interest}
                      className="px-3 py-1.5 rounded-full text-sm font-medium bg-teal-100 text-teal-700"
                    >
                      {interest}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
