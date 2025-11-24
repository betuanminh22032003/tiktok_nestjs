'use client';

import { IconButton } from '@/components/atoms/IconButton';
import { VideoTag } from '@/components/atoms/VideoTag';
import { BottomNav } from '@/components/layout/BottomNav';
import { HeaderLayout } from '@/components/layout/HeaderLayout';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { FileVideo, Image as ImageIcon, Music, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function UploadPage() {
  const router = useRouter();
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [videoPreview, setVideoPreview] = React.useState<string | null>(null);
  const [thumbnail, setThumbnail] = React.useState<File | null>(null);
  const [caption, setCaption] = React.useState('');
  const [hashtags, setHashtags] = React.useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = React.useState('');
  const [music, setMusic] = React.useState('');
  const [uploading, setUploading] = React.useState(false);

  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const thumbnailInputRef = React.useRef<HTMLInputElement>(null);

  const user = {
    id: '1',
    username: 'currentuser',
    avatarUrl: 'https://i.pravatar.cc/150?img=10',
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setThumbnail(file);
    }
  };

  const handleAddHashtag = () => {
    if (hashtagInput.trim() && !hashtags.includes(hashtagInput.trim())) {
      setHashtags([...hashtags, hashtagInput.trim()]);
      setHashtagInput('');
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    if (!videoFile) return;

    setUploading(true);
    try {
      // Implement upload logic here
      console.log('Uploading video:', {
        video: videoFile,
        thumbnail,
        caption,
        hashtags,
        music,
      });

      // Simulate upload
      await new Promise((resolve) => setTimeout(resolve, 2000));

      router.push('/');
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <HeaderLayout user={user} />

      <div className="flex">
        <SidebarLayout user={user} suggestedUsers={[]} onLogout={() => console.log('Logout')} />

        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Upload Video</h1>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Video Upload Section */}
              <div className="space-y-6">
                {/* Video Uploader */}
                <div className="card p-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Select Video
                  </h2>

                  {!videoPreview ? (
                    <div
                      onClick={() => videoInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-dark-700 rounded-lg p-12 text-center cursor-pointer hover:border-primary-500 transition-colors"
                    >
                      <FileVideo className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Click to upload video
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        MP4, WebM, or MOV (Max 100MB)
                      </p>
                    </div>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden bg-black">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full aspect-[9/16] object-contain"
                      />
                      <IconButton
                        icon={X}
                        onClick={() => {
                          setVideoFile(null);
                          setVideoPreview(null);
                        }}
                        variant="danger"
                        className="absolute top-2 right-2"
                      />
                    </div>
                  )}

                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoSelect}
                    className="hidden"
                  />
                </div>

                {/* Thumbnail Upload */}
                {videoFile && (
                  <div className="card p-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                      Thumbnail (Optional)
                    </h2>
                    <div
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-dark-700 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
                    >
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {thumbnail ? thumbnail.name : 'Click to upload thumbnail'}
                      </p>
                    </div>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailSelect}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Video Details Section */}
              <div className="space-y-6">
                {/* Caption */}
                <div className="card p-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Caption
                  </h2>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption..."
                    rows={4}
                    maxLength={500}
                    className="input-field resize-none"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-right">
                    {caption.length}/500
                  </p>
                </div>

                {/* Hashtags */}
                <div className="card p-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Hashtags
                  </h2>
                  <div className="flex gap-2 mb-3">
                    <input
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddHashtag()}
                      placeholder="Enter hashtag"
                      className="input-field flex-1"
                    />
                    <button onClick={handleAddHashtag} className="btn-primary">
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((tag) => (
                      <VideoTag
                        key={tag}
                        label={`#${tag}`}
                        variant="primary"
                        size="md"
                        onClick={() => handleRemoveHashtag(tag)}
                      />
                    ))}
                  </div>
                </div>

                {/* Music */}
                <div className="card p-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Music (Optional)
                  </h2>
                  <input
                    value={music}
                    onChange={(e) => setMusic(e.target.value)}
                    placeholder="Enter music name"
                    className="input-field"
                  />
                </div>

                {/* Upload Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!videoFile || uploading}
                  className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Upload className="w-5 h-5" />
                      Upload Video
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <BottomNav user={user} />
    </div>
  );
}
