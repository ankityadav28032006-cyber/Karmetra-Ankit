import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Check, 
  X, 
  RotateCw, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  User, 
  Sparkles,
  Info,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/apiClient';

interface ProfilePhotoUploaderProps {
  currentAvatarUrl?: string;
  fullName?: string;
  onPhotoUploaded: (avatarUrl: string) => void;
  onPhotoRemoved: () => void;
  disabled?: boolean;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  mimeType?: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MIN_DIMENSION_PX = 150;
const MAX_DIMENSION_PX = 5000;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  currentAvatarUrl,
  fullName = 'Candidate',
  onPhotoUploaded,
  onPhotoRemoved,
  disabled = false
}) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  
  // Pending Image for Preview before Upload
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [pendingImageMeta, setPendingImageMeta] = useState<{
    width: number;
    height: number;
    sizeKb: number;
    type: string;
  } | null>(null);
  
  // Upload & Removal States
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Camera Stream States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera helper
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Clean up camera stream and object URLs on unmount or modal close
  useEffect(() => {
    return () => {
      stopCameraStream();
      if (pendingPreviewUrl && pendingPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pendingPreviewUrl);
      }
    };
  }, [stopCameraStream, pendingPreviewUrl]);

  // Start live camera stream
  const startCameraStream = useCallback(async (facing: 'user' | 'environment' = cameraFacing) => {
    setCameraError(null);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser or environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280, min: 480 },
          height: { ideal: 1280, min: 480 },
          aspectRatio: { ideal: 1 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Video play warning:', e));
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      let msg = 'Could not access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera permissions in your browser bar.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera device found on this system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is already in use by another application.';
      }
      setCameraError(msg);
      setIsCameraActive(false);
    }
  }, [cameraFacing, stopCameraStream]);

  // Handle Switch to Camera Tab
  const handleSelectTab = (tab: 'upload' | 'camera') => {
    setActiveTab(tab);
    setErrorMessage(null);
    if (tab === 'camera') {
      startCameraStream(cameraFacing);
    } else {
      stopCameraStream();
    }
  };

  // Flip camera (Front/Back)
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    startCameraStream(nextFacing);
  };

  // Validate image file (Type, Size, Dimensions)
  const validateImageFile = (file: File): Promise<ValidationResult> => {
    return new Promise((resolve) => {
      // 1. File Type Check
      if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
        return resolve({
          valid: false,
          error: `Invalid file type "${file.type || 'unknown'}". Only JPG, PNG, and WEBP images are supported.`
        });
      }

      // 2. File Size Check
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        return resolve({
          valid: false,
          error: `File size is ${sizeMb} MB. Maximum allowed profile photo size is 5.0 MB.`
        });
      }

      if (file.size < 1024) {
        return resolve({
          valid: false,
          error: 'File size is too small or corrupted. Please choose a valid image.'
        });
      }

      // 3. Image Dimensions Check
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        URL.revokeObjectURL(objectUrl);

        if (width < MIN_DIMENSION_PX || height < MIN_DIMENSION_PX) {
          return resolve({
            valid: false,
            error: `Image dimensions (${width} × ${height} px) are too small. Photo must be at least ${MIN_DIMENSION_PX} × ${MIN_DIMENSION_PX} pixels.`,
            width,
            height,
            sizeBytes: file.size,
            mimeType: file.type
          });
        }

        if (width > MAX_DIMENSION_PX || height > MAX_DIMENSION_PX) {
          return resolve({
            valid: false,
            error: `Image dimensions (${width} × ${height} px) exceed maximum allowed resolution of ${MAX_DIMENSION_PX} × ${MAX_DIMENSION_PX} pixels.`,
            width,
            height,
            sizeBytes: file.size,
            mimeType: file.type
          });
        }

        return resolve({
          valid: true,
          width,
          height,
          sizeBytes: file.size,
          mimeType: file.type
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        return resolve({
          valid: false,
          error: 'Failed to read image data. The file might be corrupted.'
        });
      };

      img.src = objectUrl;
    });
  };

  // Handle selected file from input or drop
  const processSelectedFile = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const validation = await validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid photo file.');
      return;
    }

    // Set preview
    const previewUrl = URL.createObjectURL(file);
    setPendingImageFile(file);
    setPendingPreviewUrl(previewUrl);
    setPendingImageMeta({
      width: validation.width || 0,
      height: validation.height || 0,
      sizeKb: Math.round(file.size / 1024),
      type: file.type.replace('image/', '').toUpperCase()
    });
  };

  // Capture snapshot from live video
  const captureCameraSnapshot = () => {
    if (!videoRef.current || !isCameraActive) return;

    setIsCapturing(true);
    try {
      const video = videoRef.current;
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 640;

      // Crop to a square centered snapshot
      const minDimension = Math.min(width, height);
      const startX = (width - minDimension) / 2;
      const startY = (height - minDimension) / 2;

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 640;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Could not initialize canvas context');

      // Mirror if front facing
      if (cameraFacing === 'user') {
        ctx.translate(640, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(
        video,
        startX, startY, minDimension, minDimension,
        0, 0, 640, 640
      );

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setErrorMessage('Could not generate snapshot blob.');
          setIsCapturing(false);
          return;
        }

        const file = new File([blob], `camera-snapshot-${Date.now()}.jpg`, { type: 'image/jpeg' });
        stopCameraStream();
        await processSelectedFile(file);
        setIsCapturing(false);
      }, 'image/jpeg', 0.92);

    } catch (err: any) {
      console.error('Capture error:', err);
      setErrorMessage('Failed to capture snapshot from camera.');
      setIsCapturing(false);
    }
  };

  // Confirm and upload photo to server
  const handleConfirmUpload = async () => {
    if (!pendingImageFile) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const res = await api.uploadCandidatePhoto(pendingImageFile);
      if (res && res.avatarUrl) {
        onPhotoUploaded(res.avatarUrl);
        setSuccessMessage('Profile photo updated successfully!');
        setTimeout(() => {
          handleCloseModal();
        }, 1200);
      } else {
        throw new Error('Upload succeeded but no avatar URL was returned.');
      }
    } catch (err: any) {
      console.error('Photo upload failed:', err);
      setErrorMessage(err.message || 'Failed to securely upload profile photo to storage.');
    } finally {
      setIsUploading(false);
    }
  };

  // Remove existing photo
  const handleRemoveCurrentPhoto = async () => {
    if (!currentAvatarUrl) return;
    if (!window.confirm('Are you sure you want to remove your profile photo? A default avatar will be shown.')) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await api.deleteCandidatePhoto();
      onPhotoRemoved();
      setSuccessMessage('Profile photo removed.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Delete photo error:', err);
      setErrorMessage(err.message || 'Failed to remove photo.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset modal state and close
  const handleCloseModal = () => {
    stopCameraStream();
    if (pendingPreviewUrl && pendingPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pendingPreviewUrl);
    }
    setPendingImageFile(null);
    setPendingPreviewUrl(null);
    setPendingImageMeta(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsOpenModal(false);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const initialLetter = (fullName?.trim().charAt(0) || 'U').toUpperCase();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
      {/* 1. Main Avatar Display with Hover Triggers */}
      <div className="relative group">
        <div 
          id="candidate-profile-photo-display"
          className="w-24 h-24 rounded-3xl bg-linear-to-br from-slate-900 via-slate-800 to-teal-950 text-white font-black text-3xl flex items-center justify-center overflow-hidden border-2 border-teal-500/80 shadow-md transition-all group-hover:border-teal-400"
        >
          {currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt={fullName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback to initial if image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-teal-300">
              <span>{initialLetter}</span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">Avatar</span>
            </div>
          )}
        </div>

        {/* Quick Action Badges */}
        <div className="absolute -bottom-1.5 -right-1.5 flex items-center gap-1">
          <button
            type="button"
            id="btn-trigger-photo-modal"
            onClick={() => {
              setIsOpenModal(true);
              setActiveTab('upload');
            }}
            disabled={disabled}
            title="Upload or Change Profile Photo (Camera / File)"
            className="p-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all border border-white/20 flex items-center justify-center"
          >
            <Camera className="w-4 h-4" />
          </button>

          {currentAvatarUrl && (
            <button
              type="button"
              id="btn-remove-photo-direct"
              onClick={handleRemoveCurrentPhoto}
              disabled={disabled || isDeleting}
              title="Remove Profile Photo"
              className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all border border-white/20 flex items-center justify-center"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* 2. Photo Info & Control Actions */}
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-black text-slate-900">Profile Photo</h4>
          {currentAvatarUrl ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3 h-3" />
              Active Photo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
              <User className="w-3 h-3 text-slate-400" />
              Default Avatar
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 leading-relaxed max-w-md">
          Upload a clear passport-style headshot or capture live via camera. Supported formats: <strong>JPG, PNG, WEBP</strong> (Max 5MB, min 150×150px).
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            id="btn-open-photo-upload-modal"
            onClick={() => {
              setIsOpenModal(true);
              setActiveTab('upload');
            }}
            disabled={disabled}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-teal-400" />
            <span>{currentAvatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
          </button>

          <button
            type="button"
            id="btn-open-camera-modal"
            onClick={() => {
              setIsOpenModal(true);
              handleSelectTab('camera');
            }}
            disabled={disabled}
            className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Camera className="w-3.5 h-3.5 text-teal-600" />
            <span>Capture with Camera</span>
          </button>

          {currentAvatarUrl && (
            <button
              type="button"
              id="btn-remove-photo-secondary"
              onClick={handleRemoveCurrentPhoto}
              disabled={disabled || isDeleting}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              <span>Remove</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Comprehensive Photo Modal (Camera, Upload, Validation & Preview) */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div 
            id="photo-uploader-modal-card"
            className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Candidate Profile Photo</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Verify image and review before uploading</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              
              {/* Alert Feedback Messages */}
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">{errorMessage}</div>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">{successMessage}</div>
                </div>
              )}

              {/* View 1: Pending Image Preview & Validation Specs */}
              {pendingPreviewUrl ? (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                      Preview & Verify
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">How your photo will appear</h4>
                  </div>

                  {/* Circular & Rounded Preview Frames */}
                  <div className="flex items-center justify-center gap-6 py-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="text-center space-y-1.5">
                      <div className="w-28 h-28 rounded-full overflow-hidden border-3 border-teal-500 shadow-md mx-auto">
                        <img 
                          src={pendingPreviewUrl} 
                          alt="Circular Preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold">Circular Badge</span>
                    </div>

                    <div className="text-center space-y-1.5">
                      <div className="w-24 h-28 rounded-2xl overflow-hidden border-2 border-slate-300 shadow-sm mx-auto">
                        <img 
                          src={pendingPreviewUrl} 
                          alt="Resume Card Preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold">Resume Card</span>
                    </div>
                  </div>

                  {/* Validation Metadata Pill Box */}
                  {pendingImageMeta && (
                    <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">DIMENSIONS</span>
                        <span className="font-bold text-slate-800">{pendingImageMeta.width} × {pendingImageMeta.height} px</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">FILE SIZE</span>
                        <span className="font-bold text-slate-800">{pendingImageMeta.sizeKb} KB</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">FORMAT</span>
                        <span className="font-bold text-slate-800">{pendingImageMeta.type}</span>
                      </div>
                    </div>
                  )}

                  {/* Preview Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (pendingPreviewUrl && pendingPreviewUrl.startsWith('blob:')) {
                          URL.revokeObjectURL(pendingPreviewUrl);
                        }
                        setPendingImageFile(null);
                        setPendingPreviewUrl(null);
                        setPendingImageMeta(null);
                        setErrorMessage(null);
                        if (activeTab === 'camera') startCameraStream();
                      }}
                      disabled={isUploading}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                    >
                      Choose Different Photo
                    </button>

                    <button
                      type="button"
                      id="btn-confirm-upload-photo"
                      onClick={handleConfirmUpload}
                      disabled={isUploading}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving to Storage...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Confirm & Save Photo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* View 2: Tabs for Upload File vs Camera Stream */
                <div className="space-y-4">
                  {/* Tab Selector */}
                  <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => handleSelectTab('upload')}
                      className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                        activeTab === 'upload'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 text-teal-600" />
                      <span>Choose File / Drag & Drop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectTab('camera')}
                      className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                        activeTab === 'camera'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5 text-teal-600" />
                      <span>Live Camera</span>
                    </button>
                  </div>

                  {/* Tab Content: File Picker & Drag-and-Drop */}
                  {activeTab === 'upload' && (
                    <div className="space-y-3">
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                          isDragOver 
                            ? 'border-teal-500 bg-teal-50/50 scale-[0.99]' 
                            : 'border-slate-300 hover:border-teal-400 bg-slate-50/50 hover:bg-teal-50/20'
                        }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => {
                            if (e.target.files?.[0]) processSelectedFile(e.target.files[0]);
                          }}
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          className="hidden"
                        />
                        <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
                          <Upload className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">
                          Click to browse or drag & drop photo here
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Supported: JPG, PNG, WEBP • Max size: 5MB
                        </p>
                      </div>

                      {/* Formatting guidelines */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                        <div className="font-bold text-slate-700 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-teal-600" />
                          <span>Photo Guidelines for Top Placement:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-500 pl-1">
                          <li>Clear face visibility with good front lighting</li>
                          <li>Plain or neutral background recommended</li>
                          <li>Square or 4:5 aspect ratio works best</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Tab Content: Live Camera Capture */}
                  {activeTab === 'camera' && (
                    <div className="space-y-4">
                      {cameraError ? (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-3">
                          <div className="font-bold flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <span>Camera Unavailable</span>
                          </div>
                          <p>{cameraError}</p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startCameraStream()}
                              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Retry Camera</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectTab('upload')}
                              className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 font-bold text-xs rounded-xl"
                            >
                              Upload File Instead
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Live Video Viewfinder Container */}
                          <div className="relative w-full aspect-square max-w-xs mx-auto rounded-3xl overflow-hidden bg-slate-900 border-2 border-teal-500 shadow-lg">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
                            />

                            {/* Viewfinder Circle Overlay for alignment */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                              <div className="w-48 h-48 rounded-full border-2 border-teal-400/70 border-dashed animate-pulse"></div>
                            </div>

                            {/* Flip Camera Control */}
                            <button
                              type="button"
                              onClick={toggleCameraFacing}
                              title="Flip Camera (Front/Back)"
                              className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl backdrop-blur-xs transition-all shadow-md"
                            >
                              <RotateCw className="w-4 h-4" />
                            </button>

                            <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none">
                              <span className="text-[10px] font-bold text-white bg-slate-950/70 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20">
                                Align face within circle
                              </span>
                            </div>
                          </div>

                          {/* Capture Button */}
                          <div className="flex items-center justify-center gap-3 pt-1">
                            <button
                              type="button"
                              id="btn-take-camera-snapshot"
                              onClick={captureCameraSnapshot}
                              disabled={!isCameraActive || isCapturing}
                              className="px-6 py-3 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-lg shadow-teal-600/30 flex items-center gap-2 transition-all"
                            >
                              {isCapturing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Camera className="w-4 h-4" />
                              )}
                              <span>{isCapturing ? 'Capturing...' : 'Capture Photo'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
