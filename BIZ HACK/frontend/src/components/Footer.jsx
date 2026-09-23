import React from 'react';
import { Heart, Droplet, ShieldCheck, PhoneCall, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md">
                <Droplet className="w-5 h-5 fill-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Blood<span className="text-red-500">Bridge</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Connecting life-saving blood donors with patients in real-time. Built for BIZ HACK'26 Problem Statement PS35.
            </p>
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/50 border border-red-900/50 p-2.5 rounded-lg">
              <ShieldCheck className="w-4 h-4 shrink-0 text-red-400" />
              <span>Verified Donors & Live Availability Checks</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Quick Navigation</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-red-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/find-donor" className="hover:text-red-400 transition-colors">Find Blood Donors</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-red-400 transition-colors">Register as a Donor</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-red-400 transition-colors">Donor / Admin Login</Link>
              </li>
            </ul>
          </div>

          {/* Blood Compatibility Guide */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Universal Donors</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="p-2 rounded bg-slate-800/80 border border-slate-700/50">
                <span className="font-bold text-red-400">O Negative (O-)</span>
                <p className="mt-0.5">Universal red blood cell donor (Can give to all types).</p>
              </div>
              <div className="p-2 rounded bg-slate-800/80 border border-slate-700/50">
                <span className="font-bold text-red-400">AB Positive (AB+)</span>
                <p className="mt-0.5">Universal recipient (Can receive from all types).</p>
              </div>
            </div>
          </div>

          {/* Emergency & Support */}
          <div>
            <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Emergency Support</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5 text-slate-400">
                <PhoneCall className="w-4 h-4 text-red-500 shrink-0" />
                <span>National Blood Helpline: 104 / 108</span>
              </li>
              <li className="flex items-center gap-2.5 text-slate-400">
                <Mail className="w-4 h-4 text-red-500 shrink-0" />
                <span>support@bloodbridge.org</span>
              </li>
              <li className="flex items-center gap-2.5 text-slate-400">
                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                <span>Tamil Nadu, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 BloodBridge • BIZ HACK'26 (PS35 Blood Donor Management System). All rights reserved.</p>
          <p className="text-slate-400 flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for saving lives
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
