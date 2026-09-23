import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Power,
  UserCheck,
  UserX,
  AlertCircle,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react';

const BLOOD_GROUPS = ['ALL', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState('');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [bloodGroup, setBloodGroup] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, donorsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/donors'),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (donorsRes.data.success) {
        setDonors(donorsRes.data.donors);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
      setError(err.response?.data?.message || 'Failed to fetch admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredDonors = async () => {
    try {
      setTableLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (bloodGroup !== 'ALL') params.bloodGroup = bloodGroup;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (availabilityFilter !== 'ALL') params.availability = availabilityFilter;

      const { data } = await api.get('/admin/donors', { params });
      if (data.success) {
        setDonors(data.donors);
      }
    } catch (err) {
      console.error('Error fetching donors table:', err);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchFilteredDonors();
  };

  const handleResetFilters = () => {
    setSearch('');
    setBloodGroup('ALL');
    setStatusFilter('ALL');
    setAvailabilityFilter('ALL');
    // Fetch with no filters
    api.get('/admin/donors').then((res) => {
      if (res.data.success) setDonors(res.data.donors);
    });
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // Toggle Status: ACTIVE <-> INACTIVE
  const handleToggleStatus = async (donorId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setActionLoadingId(donorId);
    try {
      const { data } = await api.patch(`/admin/donors/${donorId}/status`, {
        status: newStatus,
      });
      if (data.success) {
        showToast(`Donor status changed to ${newStatus}`);
        // Refresh local data & stats
        setDonors((prev) =>
          prev.map((d) => (d._id === donorId ? { ...d, status: newStatus } : d))
        );
        const statsRes = await api.get('/admin/stats');
        if (statsRes.data.success) setStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error('Error changing status:', err);
      alert(err.response?.data?.message || 'Failed to update donor status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle Availability: AVAILABLE <-> UNAVAILABLE
  const handleToggleAvailability = async (donorId, currentAvailability) => {
    const newAvail = currentAvailability === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
    setActionLoadingId(donorId);
    try {
      const { data } = await api.patch(`/admin/donors/${donorId}/availability`, {
        availability: newAvail,
      });
      if (data.success) {
        showToast(`Donor availability changed to ${newAvail}`);
        setDonors((prev) =>
          prev.map((d) => (d._id === donorId ? { ...d, availability: newAvail } : d))
        );
        const statsRes = await api.get('/admin/stats');
        if (statsRes.data.success) setStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error('Error changing availability:', err);
      alert(err.response?.data?.message || 'Failed to update availability');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-500 font-medium">Loading Administrator Console...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Message */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-800 text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-purple-600/20">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">Admin Control Center</h1>
              <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
                PS35 Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time monitoring, blood group breakdown, and donor moderation management.
            </p>
          </div>
        </div>

        <button
          onClick={fetchDashboardData}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors self-start sm:self-center"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh All</span>
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Donors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Donors</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{stats?.totalDonors ?? 0}</div>
          <p className="text-[11px] text-slate-400">All registered profiles</p>
        </div>

        {/* Active Donors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Donors</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">{stats?.activeDonors ?? 0}</div>
          <p className="text-[11px] text-slate-400">Approved & active accounts</p>
        </div>

        {/* Available Donors (Search Ready) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Search Ready</span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-600">{stats?.availableDonors ?? 0}</div>
          <p className="text-[11px] text-slate-400">Active + Available in public search</p>
        </div>

        {/* Inactive Donors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Inactive Accounts</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600">{stats?.inactiveDonors ?? 0}</div>
          <p className="text-[11px] text-slate-400">Deactivated by admin</p>
        </div>
      </div>

      {/* Blood Group Distribution Bar */}
      {stats?.bloodGroupStats && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Inventory & Availability By Blood Group
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {stats.bloodGroupStats.map((bg) => (
              <div
                key={bg._id}
                className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-center space-y-1"
              >
                <div className="text-lg font-black text-red-600">{bg._id}</div>
                <div className="text-xs font-bold text-slate-800">
                  {bg.availableCount} / {bg.count}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">avail / total</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Donor Management Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6 sm:p-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Manage All Donors</h2>
          <p className="text-xs text-slate-500">
            Search, filter, activate/deactivate accounts, or override availability status.
          </p>
        </div>

        {/* Search and Filters Bar */}
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          {/* Keyword Search */}
          <div className="sm:col-span-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search name, email, phone, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Blood Group Filter */}
          <div className="sm:col-span-2">
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg === 'ALL' ? 'All Blood Groups' : bg}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">ACTIVE only</option>
              <option value="INACTIVE">INACTIVE only</option>
            </select>
          </div>

          {/* Availability Filter */}
          <div className="sm:col-span-2">
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="ALL">All Readiness</option>
              <option value="AVAILABLE">AVAILABLE only</option>
              <option value="UNAVAILABLE">UNAVAILABLE only</option>
            </select>
          </div>

          {/* Submit / Reset */}
          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              title="Reset Filters"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Donor Name & Email</th>
                <th className="p-3.5">Blood Type</th>
                <th className="p-3.5">Contact & City</th>
                <th className="p-3.5">Last Donation</th>
                <th className="p-3.5">Account Status</th>
                <th className="p-3.5">Availability</th>
                <th className="p-3.5 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableLoading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                      <span>Loading donors table...</span>
                    </div>
                  </td>
                </tr>
              ) : donors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 font-medium">
                    No donors matching the specified search & filter criteria.
                  </td>
                </tr>
              ) : (
                donors.map((donor) => {
                  const isActing = actionLoadingId === donor._id;
                  const isPubliclySearchable =
                    donor.status === 'ACTIVE' && donor.availability === 'AVAILABLE';

                  return (
                    <tr key={donor._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Email */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-sm">{donor.name}</div>
                        <div className="text-slate-400 text-[11px]">{donor.email}</div>
                      </td>

                      {/* Blood Group */}
                      <td className="p-3.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-600 font-black text-sm">
                          {donor.bloodGroup}
                        </span>
                      </td>

                      {/* Phone & City */}
                      <td className="p-3.5">
                        <div className="font-medium text-slate-800">{donor.phone}</div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{donor.location}</span>
                        </div>
                      </td>

                      {/* Last Donation */}
                      <td className="p-3.5 text-slate-600 font-medium">
                        {formatDate(donor.lastDonationDate)}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            donor.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              donor.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          ></span>
                          {donor.status}
                        </span>
                      </td>

                      {/* Availability */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              donor.availability === 'AVAILABLE'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}
                          >
                            {donor.availability}
                          </span>
                          {isPubliclySearchable ? (
                            <span className="block text-[10px] text-emerald-600 font-semibold">
                              ✓ In Public Search
                            </span>
                          ) : (
                            <span className="block text-[10px] text-slate-400 font-medium">
                              ✗ Excluded
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Status */}
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleToggleStatus(donor._id, donor.status)}
                            className={`p-2 rounded-lg text-xs font-bold transition-all ${
                              donor.status === 'ACTIVE'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                            title={
                              donor.status === 'ACTIVE'
                                ? 'Deactivate Donor Account'
                                : 'Activate Donor Account'
                            }
                          >
                            {donor.status === 'ACTIVE' ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>

                          {/* Toggle Availability */}
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() =>
                              handleToggleAvailability(donor._id, donor.availability)
                            }
                            className={`p-2 rounded-lg text-xs font-bold transition-all ${
                              donor.availability === 'AVAILABLE'
                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                            }`}
                            title="Toggle Availability"
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
