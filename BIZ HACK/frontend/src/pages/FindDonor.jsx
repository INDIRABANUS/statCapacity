import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import DonorCard from '../components/DonorCard';
import { Search, Filter, RefreshCw, AlertCircle, Droplet, MapPin, CheckCircle } from 'lucide-react';

const BLOOD_GROUPS = ['ALL', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const FindDonor = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGroup = searchParams.get('bloodGroup') || 'ALL';
  const initialLocation = searchParams.get('location') || '';

  const [bloodGroup, setBloodGroup] = useState(initialGroup);
  const [location, setLocation] = useState(initialLocation);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDonors = async (bg = bloodGroup, loc = location) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (bg && bg !== 'ALL') {
        params.bloodGroup = bg;
      }
      if (loc && loc.trim() !== '') {
        params.location = loc.trim();
      }

      const { data } = await api.get('/donors', { params });
      if (data.success) {
        setDonors(data.donors || []);
      }
    } catch (err) {
      console.error('Error fetching donors:', err);
      setError(
        err.response?.data?.message || 'Unable to load donors right now. Please check if backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Sync state when URL query params change
  useEffect(() => {
    const bg = searchParams.get('bloodGroup') || 'ALL';
    const loc = searchParams.get('location') || '';
    setBloodGroup(bg);
    setLocation(loc);
    fetchDonors(bg, loc);
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = {};
    if (bloodGroup && bloodGroup !== 'ALL') params.bloodGroup = bloodGroup;
    if (location.trim()) params.location = location.trim();
    setSearchParams(params);
  };

  const handleReset = () => {
    setBloodGroup('ALL');
    setLocation('');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-1">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Live Filter: Showing ONLY Active & Available Donors</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Find Blood Donors
        </h1>
        <p className="text-slate-600 text-sm max-w-3xl">
          Search through verified donors ready for immediate donation. You can filter by required blood type or enter your city/district.
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Blood Group Select */}
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-red-500" />
                <span>Select Blood Group</span>
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none focus:border-red-500"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg === 'ALL' ? 'All Blood Groups' : bg}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Input */}
            <div className="md:col-span-5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>City / District / Area</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Erode, Chennai, Salem..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Buttons */}
            <div className="md:col-span-3 flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-red-600/30 hover:shadow transition-all"
              >
                <Search className="w-4 h-4" />
                <span>Filter</span>
              </button>
              {(bloodGroup !== 'ALL' || location.trim() !== '') && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-11 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl flex items-center justify-center transition-colors"
                  title="Clear all filters"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
          <span>Found</span>
          <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-xs">
            {donors.length}
          </span>
          <span>available donor{donors.length === 1 ? '' : 's'}</span>
          {(bloodGroup !== 'ALL' || location) && (
            <span className="text-slate-400 text-xs">
              (Filtered by: {bloodGroup !== 'ALL' ? `Type: ${bloodGroup}` : ''}{' '}
              {location ? `Location: "${location}"` : ''})
            </span>
          )}
        </div>
      </div>

      {/* Donor Cards Grid / States */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-200"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-8 bg-slate-100 rounded"></div>
              <div className="h-10 bg-slate-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-red-900">Error Loading Donors</h3>
          <p className="text-sm text-red-700 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => fetchDonors(bloodGroup, location)}
            className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry Search
          </button>
        </div>
      ) : donors.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
            <Droplet className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-800">No Available Donors Found</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              We couldn't find any active and available donors matching your current filter criteria.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
            >
              Reset Filters
            </button>
            <a
              href="tel:108"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              Call Blood Bank Helpline (108)
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {donors.map((donor) => (
            <DonorCard key={donor._id} donor={donor} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FindDonor;
