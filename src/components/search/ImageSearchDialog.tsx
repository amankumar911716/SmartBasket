'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ImageIcon, Camera, Upload, X, RotateCcw, Search, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ImageSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearchResult: (keywords: string[], items: string[]) => void;
}

type DialogStep = 'choose' | 'preview' | 'processing' | 'results';

export default function ImageSearchDialog({
  open,
  onOpenChange,
  onSearchResult,
}: ImageSearchDialogProps) {
  const [step, setStep] = useState<DialogStep>('choose');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [identifiedItems, setIdentifiedItems] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens/closes
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      // Reset after close animation
      setTimeout(() => {
        setStep('choose');
        setImagePreview(null);
        setImageFile(null);
        setProcessing(false);
        setIdentifiedItems([]);
        setKeywords([]);
        setDescription('');
        setErrorMsg('');
      }, 200);
    } else {
      setStep('choose');
      setErrorMsg('');
    }
    onOpenChange(newOpen);
  }, [onOpenChange]);

  // Process selected/captured image file
  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file (JPG, PNG, WebP).',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select an image under 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setStep('preview');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGalleryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  const handleCameraChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  // Start AI analysis
  const handleAnalyze = useCallback(async () => {
    if (!imageFile) return;

    setProcessing(true);
    setStep('processing');
    setErrorMsg('');

    try {
      const base64 = await fileToBase64(imageFile);
      const mimeType = imageFile.type || 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      const res = await fetch('/api/search/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });

      const data = await res.json();

      if (data.success && data.keywords && data.keywords.length > 0) {
        setIdentifiedItems(data.items || []);
        setKeywords(data.keywords || []);
        setDescription(data.message || '');
        setStep('results');
      } else {
        setErrorMsg(data.message || 'Could not identify grocery items. Try a clearer photo.');
        setStep('choose');
        toast({
          title: 'No Items Detected',
          description: data.message || 'Could not identify grocery items. Try a clearer photo.',
          variant: 'destructive',
        });
      }
    } catch {
      setErrorMsg('Failed to analyze image. Please try again.');
      setStep('choose');
      toast({
        title: 'Image Search Failed',
        description: 'Failed to analyze the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }, [imageFile]);

  // Use the search results to navigate to products page
  const handleSearchNow = useCallback(() => {
    const searchTerms = keywords.slice(0, 3);
    onSearchResult(searchTerms, identifiedItems);
    handleOpenChange(false);
  }, [keywords, identifiedItems, onSearchResult, handleOpenChange]);

  // Retake/re-upload
  const handleRetake = useCallback(() => {
    setStep('choose');
    setImagePreview(null);
    setImageFile(null);
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0 [&>button]:hidden">
        {/* Choose Step */}
        {step === 'choose' && (
          <div className="p-6">
            <DialogHeader className="text-left pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
                  <Camera className="size-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg">Search by Image</DialogTitle>
                  <DialogDescription className="text-sm mt-0.5">
                    Take a photo or upload an image of any grocery item
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
                <X className="size-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            )}

            <div className="space-y-3">
              {/* Upload from Gallery */}
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-green-400 hover:bg-green-50/50 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <Upload className="size-5 text-blue-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-green-700 transition-colors">
                    Upload from Gallery
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Select a photo from your device storage
                  </p>
                </div>
                <span className="text-gray-300 group-hover:text-green-400 transition-colors">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>

              {/* Capture via Camera */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-green-400 hover:bg-green-50/50 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                  <Camera className="size-5 text-emerald-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-green-700 transition-colors">
                    Capture via Camera
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Open camera and take a photo now
                  </p>
                </div>
                <span className="text-gray-300 group-hover:text-green-400 transition-colors">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            </div>

            {/* Supported formats */}
            <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-400">
              <ImageIcon className="size-3.5" />
              <span>Supports JPG, PNG, WebP &bull; Max 10MB</span>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && (
          <div className="p-6">
            <DialogHeader className="text-left pb-4">
              <DialogTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="size-5 text-green-600" />
                Image Preview
              </DialogTitle>
              <DialogDescription>
                Review the image before searching
              </DialogDescription>
            </DialogHeader>

            {imagePreview && (
              <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm bg-gray-50">
                <img
                  src={imagePreview}
                  alt="Selected for search"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <Button
                variant="outline"
                onClick={handleRetake}
                className="flex-1 gap-2"
              >
                <RotateCcw className="size-4" />
                <span className="hidden sm:inline">Choose Different</span>
                <span className="sm:hidden">Retry</span>
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={processing}
                className="flex-1 gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm"
              >
                {processing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {processing ? 'Analyzing...' : 'Search'}
              </Button>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="p-8 flex flex-col items-center justify-center min-h-[280px]">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                <Sparkles className="size-8 text-green-600 animate-pulse" />
              </div>
              <span className="absolute inset-0 rounded-2xl border-2 border-green-400 animate-ping opacity-20" />
            </div>

            {imagePreview && (
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-green-200 shadow-sm mt-4">
                <img src={imagePreview} alt="Analyzing" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="text-center mt-4">
              <p className="text-base font-semibold text-gray-800">Analyzing Image</p>
              <p className="text-sm text-gray-500 mt-1">
                Identifying grocery items with AI...
              </p>
            </div>

            <div className="flex items-center gap-2 bg-green-50 rounded-full px-4 py-2 mt-5">
              <Loader2 className="size-3.5 animate-spin text-green-600" />
              <span className="text-xs text-green-700 font-medium">AI is working...</span>
            </div>
          </div>
        )}

        {/* Results Step */}
        {step === 'results' && (
          <div className="p-6">
            <DialogHeader className="text-left pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <Sparkles className="size-5 text-green-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg">Items Found!</DialogTitle>
                  <DialogDescription className="text-sm mt-0.5">
                    {description || 'We identified the following items'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Identified items */}
            {identifiedItems.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Identified Items
                </p>
                <div className="flex flex-wrap gap-2">
                  {identifiedItems.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-sm text-green-700 font-medium"
                    >
                      <span className="size-1.5 rounded-full bg-green-500" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Search keywords */}
            {keywords.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Search Keywords
                </p>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs text-gray-600 font-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRetake}
                className="flex-1 gap-2"
              >
                <RotateCcw className="size-4" />
                <span className="hidden sm:inline">Search Again</span>
                <span className="sm:hidden">Retry</span>
              </Button>
              <Button
                onClick={handleSearchNow}
                className="flex-1 gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm"
              >
                <Search className="size-4" />
                Show Products
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Hidden file inputs */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleGalleryChange}
        className="hidden"
        aria-label="Upload image from gallery"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraChange}
        className="hidden"
        aria-label="Capture photo with camera"
      />
    </Dialog>
  );
}
