'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  Share2,
  Link2,
  Copy,
  Check,
  MessageCircle,
  Mail,
  Smartphone,
} from 'lucide-react';

interface ShareAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHARE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://smartbasket.in';
const SHARE_TEXT = 'Shop fresh groceries at amazing prices on SmartBasket!';
const SHARE_TITLE = 'SmartBasket - Fresh Groceries Online';

function copyToClipboard(text: string): Promise<boolean> {
  // Try clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  // Fallback: use hidden textarea (works in non-secure contexts)
  return new Promise<boolean>((resolve) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      resolve(success);
    } catch {
      resolve(false);
    }
  });
}

const shareOptions = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: MessageCircle,
    color: 'bg-green-500 hover:bg-green-600',
    getUrl: () => `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT}\n\n${SHARE_URL}`)}`,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: Smartphone,
    color: 'bg-sky-500 hover:bg-sky-600',
    getUrl: () => `https://t.me/share/url?url=${encodeURIComponent(SHARE_URL)}&text=${encodeURIComponent(SHARE_TEXT)}`,
  },
  {
    id: 'email',
    name: 'Email',
    icon: Mail,
    color: 'bg-amber-500 hover:bg-amber-600',
    getUrl: () => `mailto:?subject=${encodeURIComponent(SHARE_TITLE)}&body=${encodeURIComponent(`${SHARE_TEXT}\n\n${SHARE_URL}`)}`,
  },
  {
    id: 'copy',
    name: 'Copy Link',
    icon: Link2,
    color: 'bg-gray-100 hover:bg-gray-200',
    getUrl: () => SHARE_URL,
    isCopy: true as const,
  },
];

export default function ShareAppDialog({ open, onOpenChange }: ShareAppDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (option: typeof shareOptions[number]) => {
    if (option.isCopy) {
      const success = await copyToClipboard(SHARE_URL);
      if (success) {
        setCopied(true);
        toast({
          title: 'Link Copied!',
          description: 'SmartBasket link copied to clipboard. Share it with friends!',
        });
        setTimeout(() => setCopied(false), 2000);
      } else {
        toast({
          title: 'Copy Failed',
          description: 'Could not copy the link. Please select the link manually.',
          variant: 'destructive',
        });
      }
      return;
    }

    // Social share: open in new window
    const url = option.getUrl();
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
    toast({
      title: `Opening ${option.name}`,
      description: `Share SmartBasket with your friends on ${option.name}!`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden">
        {/* Green header with gradient */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 pt-6 pb-5 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
                <Share2 className="size-5" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-white text-lg font-bold">Share SmartBasket</DialogTitle>
                <DialogDescription className="text-white/80 text-xs">
                  Share with friends &amp; family and save together!
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        {/* Link preview with copy button */}
        <div className="px-6 pt-4 pb-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white font-bold text-xs">SB</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                SmartBasket - Fresh Groceries Online
              </p>
              <p className="text-xs text-gray-400 truncate">{SHARE_URL}</p>
            </div>
            <button
              onClick={async () => {
                const success = await copyToClipboard(SHARE_URL);
                if (success) {
                  setCopied(true);
                  toast({ title: 'Copied!', description: 'Link copied to clipboard.' });
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
              title="Copy link"
            >
              {copied ? (
                <Check className="size-4 text-green-500" />
              ) : (
                <Copy className="size-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {/* Share options grid */}
        <div className="px-6 pb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Share via
          </p>
          <div className="grid grid-cols-4 gap-3">
            {shareOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleShare(option)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 active:scale-95 ${
                  option.id === 'copy' && copied
                    ? 'bg-green-50 ring-2 ring-green-300'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${option.color} flex items-center justify-center shadow-sm transition-all duration-200 text-white`}
                >
                  {option.id === 'copy' && copied ? (
                    <Check className="size-5 text-green-600" />
                  ) : (
                    <option.icon className="size-5" />
                  )}
                </div>
                <span className="text-[11px] font-medium text-gray-600">
                  {option.id === 'copy' && copied ? 'Copied!' : option.name}
                </span>
              </button>
            ))}
          </div>

          {/* Pro tip for manual sharing */}
          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-xs text-amber-700 font-medium">
              💡 Pro tip: Copy the link and share it on any social media or messaging app!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
