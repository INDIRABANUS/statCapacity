import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, Droplet, ShieldCheck, Clock, Users, ArrowRight, CheckCircle2, PhoneCall, AlertCircle } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const Home = () => {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState('');
  const [location, setLocation] = useState('');

  const handleQuickSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedGroup && selectedGroup !== 'ALL') params.append('bloodGroup', selectedGroup);
    if (location.trim()) params.append('location', location.trim());
    navigate(`/find-donor?${params.toString()}`);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-50/70 via-slate-50 to-slate-50 py-16 lg:py-24 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-100/80 border border-red-200 text-red-700 text-xs font-bold tracking-wide uppercase shadow-sm">
              <Droplet className="w-3.5 h-3.5 fill-red-600 text-red-600" />
              <span>BIZ HACK'26 Prototype • Problem Statement 35</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Every Drop Counts. <br className="hidden sm:inline" />
              Find Blood Donors <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">Instantly</span>.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
              A real-time blood donor discovery platform designed to eliminate emergency delays. Connect with verified, active, and immediately available donors in your local area.
            </p>

            {/* Quick Search Card */}
            <div className="mt-8 max-w-2xl mx-auto bg-white p-4 sm:p-5 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80">
              <form onSubmit={handleQuickSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5 text-left">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Blood Group
                  </label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none focus:border-red-500"
                  >
                    <option value="">Any Blood Group</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-5 text-left">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    City / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Erode, Coimbatore..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <button
                    type="submit"
                    className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30 transition-all hover:shadow-lg"
                  >
                    <Search className="w-4 h-4" />
                    <span className="sm:hidden">Search</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Quick CTAs */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-sm font-semibold">
              <Link
                to="/find-donor"
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2 shadow-sm transition-all"
              >
                <span>Browse All Active Donors</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-red-600 border border-red-200 shadow-sm flex items-center gap-2 transition-all"
              >
                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                <span>Register as a Donor</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Why BloodBridge?
          </h2>
          <p className="text-slate-600 mt-2 text-sm">
            Solving real-time blood shortage and coordination bottlenecks during medical emergencies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Enforced Real-time Availability</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Public search strictly presents only donors marked as <strong>ACTIVE</strong> and <strong>AVAILABLE</strong> at the database level, preventing futile calls.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Verified Donor Profiles</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Donors can easily toggle availability and log last donation dates. Administrators can moderate and verify every record.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Direct Contact & Fast Action</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Seekers get instant phone call integration and city-level filtering to locate donors within minutes of an emergency.
            </p>
          </div>
        </div>
      </section>

      {/* Blood Compatibility Guide */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-red-400 text-xs uppercase font-bold tracking-wider">
                Blood Group Guide
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                Quick Compatibility Reference
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Knowing compatible blood types saves vital time during transfusions and emergencies.
              </p>
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span><strong>O Negative</strong>: Universal red cell donor for all patients</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span><strong>AB Positive</strong>: Universal recipient from any blood group</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-700">
                    <tr>
                      <th className="p-3">Blood Type</th>
                      <th className="p-3">Can Donate To</th>
                      <th className="p-3">Can Receive From</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    <tr className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-red-400">O+</td>
                      <td className="p-3 text-slate-300">O+, A+, B+, AB+</td>
                      <td className="p-3 text-slate-300">O+, O-</td>
                    </tr>
                    <tr className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-red-400">O-</td>
                      <td className="p-3 text-emerald-400 font-semibold">Everyone (Universal Donor)</td>
                      <td className="p-3 text-slate-300">O-</td>
                    </tr>
                    <tr className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-red-400">A+</td>
                      <td className="p-3 text-slate-300">A+, AB+</td>
                      <td className="p-3 text-slate-300">A+, A-, O+, O-</td>
                    </tr>
                    <tr className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-red-400">B+</td>
                      <td className="p-3 text-slate-300">B+, AB+</td>
                      <td className="p-3 text-slate-300">B+, B-, O+, O-</td>
                    </tr>
                    <tr className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-red-400">AB+</td>
                      <td className="p-3 text-slate-300">AB+ only</td>
                      <td className="p-3 text-emerald-400 font-semibold">Everyone (Universal Recipient)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-3xl p-8 sm:p-12 text-center text-white space-y-6 shadow-xl shadow-red-600/20">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Save a Life in Your City?
          </h2>
          <p className="text-red-100 max-w-xl mx-auto text-sm sm:text-base font-medium">
            Join hundreds of verified donors across Tamil Nadu. Your 10 minutes can give someone another lifetime.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="px-6 py-3.5 rounded-xl bg-white text-red-700 font-bold hover:bg-red-50 shadow-lg transition-all"
            >
              Register as Donor Today
            </Link>
            <Link
              to="/find-donor"
              className="px-6 py-3.5 rounded-xl bg-red-800/80 hover:bg-red-800 text-white font-bold border border-red-400/40 shadow-lg transition-all"
            >
              Search for Donors
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
