import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Phone, MapPin, Calendar, Heart, CheckCircle2, AlertCircle, RefreshCw, Power, Save, ShieldAlert } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DonorProfile = () => {
  const { user, donor, updateDonorState } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    bloodGroup: '',
    lastDonationDate: '',
  });

  const [availability, setAvailability] = useState('AVAILABLE');
  const [status, setStatus] = useState('ACTIVE');
  const [loading, setLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (donor) {
      setFormData({
        name: donor.name || user?.name || '',
        phone: donor.phone || '',
        location: donor.location || '',
        bloodGroup: donor.bloodGroup || 'O+',
        lastDonationDate: donor.lastDonationDate
          ? new Date(donor.lastDonationDate).toISOString().split('T')[0]
          : '',
      });
      setAvailability(donor.availability || 'AVAILABLE');
      setStatus(donor.status || 'ACTIVE');
    }
  }, [donor, user]);

  const handleToggleAvailability = async () => {
    if (!donor?._id) return;
    const newStatus = availability === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
    setToggleLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const { data } = await api.patch(`/donors/${donor._id}/availability`, {
        availability: newStatus,
      });
      if (data.success) {
        setAvailability(newStatus);
        updateDonorState(data.donor);
        setSuccessMessage(`Your donation availability is now set to ${newStatus}`);
      }
    } catch (err) {
      console.error('Failed to toggle availability:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to update availability status.');
    } finally {
      setToggleLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!donor?._id) return;

    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const { data } = await api.put(`/donors/${donor._id}`, {
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        bloodGroup: formData.bloodGroup,
        lastDonationDate: formData.lastDonationDate || null,
      });

      if (data.success) {
        updateDonorState(data.donor);
        setSuccessMessage('Your profile information was updated successfully!');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Top Banner / Welcome */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-red-500/20">
            {formData.bloodGroup || 'O+'}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{donor?.name || user?.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                Status: {status}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  availability === 'AVAILABLE'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {availability}
              </span>
            </div>
          </div>
        </div>

        {/* Availability Switch Control */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase text-slate-700">Donation Readiness</div>
            <div className="text-xs text-slate-500">
              {availability === 'AVAILABLE'
                ? 'You appear in emergency searches.'
                : 'Hidden from public searches.'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleAvailability}
            disabled={toggleLoading}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
              availability === 'AVAILABLE'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                : 'bg-slate-800 hover:bg-slate-900 text-white'
            }`}
          >
            {toggleLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Power className="w-4 h-4" />
            )}
            <span>{availability === 'AVAILABLE' ? 'Mark Unavailable' : 'Mark Available'}</span>
          </button>
        </div>
      </div>

      {/* Inactive Account Warning (if deactivated by admin) */}
      {status === 'INACTIVE' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-800 text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <span className="font-bold">Account Deactivated by Moderator: </span>
            Your profile is currently deactivated and will not appear in donor searches regardless of availability settings. Please contact the administrator if this was in error.
          </div>
        </div>
      )}

      {/* Alert Messages */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <div className="font-medium">{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div className="font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Edit Profile Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Edit Donor Details</h2>
          <p className="text-xs text-slate-500">Keep your contact number and location up to date for emergency alerts.</p>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Blood Group
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none focus:border-red-500"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                City / Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Last Donation Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  value={formData.lastDonationDate}
                  onChange={(e) => setFormData({ ...formData, lastDonationDate: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold text-sm rounded-xl shadow-md shadow-red-600/30 flex items-center gap-2 transition-all"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DonorProfile;
