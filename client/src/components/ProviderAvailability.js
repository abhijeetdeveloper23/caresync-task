import React, { useState, useEffect } from 'react';
import { createProvider, submitAvailability, getProviders } from '../api';
import TimePickerModal from './TimePickerModal';
import ToastContainer from './ToastContainer';
import { FaTrash, FaRegCalendarAlt } from 'react-icons/fa';
import { formatTimeForInput } from '../utils/time';
import { getBrowserZone } from '../utils/tz';
import { DAYS } from '../constants';

function ProviderAvailability() {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Provider form state
  const [providerForm, setProviderForm] = useState({
    name: '',
    email: '',
    specialty: '',
    time_zone: getBrowserZone(),
  });

  // Availability form state
  const [availability, setAvailability] = useState([]);

  // Helper to find first unused day value
  const getFirstUnusedDay = () => {
    const used = availability.map((b) => b.day_of_week);
    const unusedDay = DAYS.find((d) => !used.includes(d.value));
    return unusedDay ? unusedDay.value : null;
  };
  const [toasts, setToasts] = useState([]);
  
  // Toast management functions
  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };
  
  // Time picker modal state
  const [timePickerState, setTimePickerState] = useState({
    isOpen: false,
    blockIndex: null,
    field: null, 
    label: '',
  });

  useEffect(() => {
    loadProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProviders = async () => {
    try {
      const response = await getProviders();
      setProviders(response.data);
    } catch (err) {
      console.error('Failed to load providers:', err);
      showToast('Failed to load providers', 'error');
    }
  };

  const handleProviderSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await createProvider(providerForm);
      const successMessage = `Provider "${response.data.name}" created successfully!`;
      setSuccess(successMessage);
      showToast(successMessage, 'success', 5000);
      setProviderForm({ name: '', email: '', specialty: '', time_zone: getBrowserZone() });
      await loadProviders();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to create provider';
      setError(errorMessage);
      showToast(errorMessage, 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAvailabilityBlock = () => {
    const nextDay = getFirstUnusedDay();
    if (nextDay === null) {
      showToast('All days already have availability blocks.', 'info');
      return;
    }
    setAvailability([
      ...availability,
      { day_of_week: nextDay, start_time: '09:00:00', end_time: '17:00:00' },
    ]);
  };

  const handleRemoveAvailabilityBlock = (index) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const handleUpdateAvailabilityBlock = (index, field, value) => {
    const updated = [...availability];
    updated[index][field] = value;
    setAvailability(updated);
  };

  const handleAvailabilitySubmit = async (e) => {
    e.preventDefault();
    if (!selectedProvider) {
      setError('Please select a provider');
      return;
    }

    if (availability.length === 0) {
      setError('Please add at least one availability block');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await submitAvailability({
        provider_id: selectedProvider,
        availability,
      });
      setSuccess('Availability submitted successfully!');
      showToast('Availability submitted successfully!', 'success', 5000);
      setAvailability([]);
      setSelectedProvider(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit availability');
      showToast(err.response?.data?.error || 'Failed to submit availability', 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>👨‍⚕️ Provider Portal</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0', fontSize: '0.875rem' }}>
          Manage your profile and set your availability schedule
        </p>
      </div>

      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="card">
        <h3>Step 1: Create Provider Profile</h3>
        <form onSubmit={handleProviderSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Provider Name</label>
              <input
                type="text"
                value={providerForm.name}
                onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                placeholder="Dr. John Smith"
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={providerForm.email}
                onChange={(e) => setProviderForm({ ...providerForm, email: e.target.value })}
                placeholder="doctor@example.com"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Specialty (optional)</label>
            <input
              type="text"
              value={providerForm.specialty}
              onChange={(e) => setProviderForm({ ...providerForm, specialty: e.target.value })}
              placeholder="Cardiology, General Practice, etc."
            />
          </div>
          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Creating...' : 'Create Provider'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Step 2: Set Your Availability</h3>
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label>Select Provider</label>
          <select
            value={selectedProvider || ''}
            onChange={(e) => setSelectedProvider(parseInt(e.target.value))}
          >
            <option value="">-- Select Provider --</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name} {provider.specialty ? `(${provider.specialty})` : ''}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleAvailabilitySubmit}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <button type="button" className="button" onClick={handleAddAvailabilityBlock}>
              ➕ Add Availability Block
            </button>
          </div>

          {availability.map((block, index) => (
            <div key={index} className="availability-block">
              <h4 className="availability-block-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaRegCalendarAlt /> Block {index + 1}
                </span>
                <button
                  type="button"
                  className="delete-icon"
                  onClick={() => handleRemoveAvailabilityBlock(index)}
                  title="Delete this block"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#e11d48' }}
                >
                  <FaTrash size={16} />
                </button>
              </h4>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Day of Week</label>
                <select
                  value={block.day_of_week}
                  onChange={(e) =>
                    handleUpdateAvailabilityBlock(index, 'day_of_week', parseInt(e.target.value))
                  }
                >
                  {DAYS.map((day) => (
                    <option
                      key={day.value}
                      value={day.value}
                      disabled={
                        availability.some(
                          (b, i) => i !== index && b.day_of_week === day.value
                        )
                      }
                    >
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="time-inputs">
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="text"
                    readOnly
                    value={formatTimeForInput(block.start_time) || ''}
                    onClick={() => setTimePickerState({
                      isOpen: true,
                      blockIndex: index,
                      field: 'start_time',
                      label: 'Start Time',
                    })}
                    placeholder="Click to select time"
                    required
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="text"
                    readOnly
                    value={formatTimeForInput(block.end_time) || ''}
                    onClick={() => setTimePickerState({
                      isOpen: true,
                      blockIndex: index,
                      field: 'end_time',
                      label: 'End Time',
                    })}
                    placeholder="Click to select time"
                    required
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          ))}

          {availability.length > 0 && (
            <button type="submit" className="button button-success" disabled={loading || !selectedProvider}>
              {loading ? 'Submitting...' : 'Submit Availability'}
            </button>
          )}
        </form>
      </div>

      {timePickerState.isOpen && timePickerState.blockIndex !== null && (
        <TimePickerModal
          isOpen={timePickerState.isOpen}
          onClose={() => setTimePickerState({ ...timePickerState, isOpen: false })}
          value={availability[timePickerState.blockIndex]?.[timePickerState.field]}
          onChange={(time) => {
            handleUpdateAvailabilityBlock(timePickerState.blockIndex, timePickerState.field, time);
            setTimePickerState({ ...timePickerState, isOpen: false });
          }}
          label={timePickerState.label}
        />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default ProviderAvailability;

