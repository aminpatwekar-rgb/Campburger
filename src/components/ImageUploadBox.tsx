import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2, Link2, Check, FileCheck } from 'lucide-react';
import { uploadImage } from '../api';

interface ImageUploadBoxProps {
  value: string;
  onChange: (url: string) => void;
  idToken: string | null;
  label?: string;
  required?: boolean;
}

export default function ImageUploadBox({
  value,
  onChange,
  idToken,
  label = "Menu Item Image",
  required = false,
}: ImageUploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [error, setError] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileProcess = async (file: File) => {
    if (!idToken) {
      setError("Please sign in as admin to upload images.");
      return;
    }
    setError(null);
    setUploading(true);
    setFileDetails({
      name: file.name,
      size: formatFileSize(file.size),
    });

    try {
      const res = await uploadImage(file, idToken);
      onChange(res.url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const clearImage = () => {
    onChange('');
    setFileDetails(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-gray-700">
          {label} {required && <span className="text-[#F4511E]">*</span>}
        </label>
        <div className="flex items-center text-xs gap-2 font-medium">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-1 rounded transition-colors ${
              mode === 'upload' ? 'bg-[#111111] text-white' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            File Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-1 rounded transition-colors ${
              mode === 'url' ? 'bg-[#111111] text-white' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Web URL
          </button>
        </div>
      </div>

      {mode === 'url' ? (
        <div className="space-y-3">
          <div className="relative">
            <input
              type="url"
              required={required && !value}
              placeholder="https://images.unsplash.com/... or image link"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F4511E] focus:border-transparent transition-all"
            />
            {value && (
              <button
                type="button"
                onClick={clearImage}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
          {value && (
            <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={() => setError("Unable to load image from this URL.")}
              />
            </div>
          )}
        </div>
      ) : (
        <div>
          {value ? (
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-3 flex items-center gap-4 group">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-200 shrink-0 relative">
                <img
                  src={value}
                  alt="Uploaded preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs mb-1">
                  <FileCheck size={15} />
                  <span>Image ready</span>
                </div>
                <p className="text-xs font-semibold text-gray-800 truncate">
                  {fileDetails?.name || value.split('/').pop() || "Uploaded image"}
                </p>
                {fileDetails?.size && (
                  <p className="text-[11px] text-gray-400 mt-0.5">{fileDetails.size}</p>
                )}
                <p className="text-[10px] text-gray-400 truncate mt-1">{value}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={clearImage}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  title="Remove image"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                isDragging
                  ? 'border-[#F4511E] bg-orange-50/50 scale-[1.01]'
                  : 'border-gray-300 hover:border-[#F4511E] bg-gray-50/50 hover:bg-orange-50/20'
              } ${uploading ? 'pointer-events-none opacity-80' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*, .png, .jpg, .jpeg, .webp, .svg, .gif, .avif, .bmp, .ico, .tiff, .tif, .heic, .heif"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {uploading ? (
                <div className="py-3 flex flex-col items-center gap-2">
                  <Loader2 className="animate-spin text-[#F4511E]" size={32} />
                  <p className="text-sm font-bold text-gray-700">Uploading & optimizing image...</p>
                  <p className="text-xs text-gray-400">Processing file format</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#F4511E] flex items-center justify-center mb-1">
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      <span className="text-[#F4511E]">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Supports all image file types (PNG, JPG, WEBP, SVG, GIF, AVIF, BMP, etc.)
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs font-semibold text-red-600 mt-1.5">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
