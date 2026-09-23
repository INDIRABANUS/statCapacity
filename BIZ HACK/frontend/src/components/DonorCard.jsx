import React, { useState } from 'react';
import { Phone, MapPin, Calendar, Check, Copy, Droplet, Clock } from 'lucide-react';

const DonorCard = ({ donor }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyPhone = () => {
    if (donor?.phone) {
      navigator.clipboard.writeText(donor.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDonationDate = (dateString) => {
    if (!dateString) return 'Not recorded / First time';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Determine days since last donation if date exists
  const getDaysSinceLastDonation = (dateString) => {
    if (!dateString) return null;
    const diffTime = Math.abs(new Date() - new Date(dateString));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysAgo = getDaysSinceLastDonation(donor.lastDonationDate);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative overflow-hidden">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-rose-500"></div>

      <div>
        {/* Header: Blood Group & Status */}
        <div className="flex items-start justify-between gap-3 mb-4 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 flex items-center justify-center p-3 shadow-inner">
              <span className="text-2xl font-black text-red-600 tracking-tight">
                {donor.bloodGroup}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg group-hover:text-red-600 transition-colors leading-tight">
                {donor.name}
              </h3>
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{donor.location}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {donor.availability}
            </span>
          </div>
        </div>

        {/* Metadata Details */}
        <div className="space-y-2 py-3 border-y border-slate-100 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Last Donated:
            </span>
            <span className="font-medium text-slate-700">
              {formatDonationDate(donor.lastDonationDate)}
            </span>
          </div>

          {daysAgo !== null && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Donated:
              </span>
              <span className="font-semibold text-slate-600">
                {daysAgo} days ago
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action CTA Bar */}
      <div className="mt-4 pt-1 flex items-center gap-2">
        <a
          href={`tel:${donor.phone}`}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm shadow-red-600/20 hover:shadow transition-all"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Call Donor</span>
        </a>

        <button
          type="button"
          onClick={handleCopyPhone}
          title="Copy Phone Number"
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors relative"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow">
              Copied!
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default DonorCard;
