import React, { useState, useEffect } from 'react';
import { getProviders, getAvailableSlots, bookAppointment } from '../api';
import DatePickerModal from './DatePickerModal';
import ToastContainer from './ToastContainer';
import { formatDateForDisplay } from '../utils/date';
import { localSelectionToUTC } from '../utils/tz';
import { providerSlotToBrowserLabel } from '../utils/tz';

function PatientBooking() {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [allSlots, setAllSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [bookingForm, setBookingForm] = useState({
    patient_name: '',
    patient_email: '',
  });

  // Date picker modal state
  const [datePickerState, setDatePickerState] = useState({
    isOpen: false,
  });

  // Toast management functions
  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    if (selectedProvider && selectedDate) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvider, selectedDate]);

  const loadProviders = async () => {
    try {
      const response = await getProviders();
      setProviders(response.data);
    } catch (err) {
      console.error('Failed to load providers:', err);
      setError('Failed to load providers');
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedProvider || !selectedDate) return;

    setLoading(true);
    setError(null);
    setSelectedSlot(null);

    try {
      const response = await getAvailableSlots(selectedProvider, selectedDate);
      setAvailableSlots(response.data.available_slots || []);
      setBookedSlots(response.data.booked_slots || []);
      setAllSlots(response.data.all_slots || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load available slots');
      setAvailableSlots([]);
      setBookedSlots([]);
      setAllSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedProvider || !selectedDate || !selectedSlot) {
      setError('Please select a provider, date, and time slot');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const providerObj = providers.find(p => p.id === selectedProvider);
      const providerTZ = providerObj?.time_zone || undefined;
      const startISO = localSelectionToUTC(selectedDate, selectedSlot, providerTZ);
      await bookAppointment({
        provider_id: selectedProvider,
        patient_name: bookingForm.patient_name,
        patient_email: bookingForm.patient_email,
        start: startISO,
      });

      const successMessage = 'Appointment booked successfully!';
      setSuccess(successMessage);
      showToast(successMessage, 'success', 5000);
      setBookingForm({ patient_name: '', patient_email: '' });
      setSelectedSlot(null);
      // Reload available slots to reflect the booking
      await loadAvailableSlots();
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to book appointment';
      setError(errorMessage);
      showToast(errorMessage, 'error', 6000);
      
      if (err.response?.status === 409) {
        await loadAvailableSlots();
        setSelectedSlot(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Set today's date as minimum selectable date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="card">
        <h2>📅 Book an Appointment</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0', fontSize: '0.875rem' }}>
          Select a provider, choose your preferred date and time, and book your appointment
        </p>
      </div>

      {success && (
        <div className="success-message">
          <strong>Success!</strong> {success}
        </div>
      )}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="card">
        <h3>Step 1: Choose Provider & Date</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Select Provider</label>
            <select
              value={selectedProvider || ''}
              onChange={(e) => setSelectedProvider(parseInt(e.target.value) || null)}
            >
              <option value="">-- Select Provider --</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name} {provider.specialty ? `(${provider.specialty})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Date</label>
            <input
              type="text"
              readOnly
              value={selectedDate ? formatDateForDisplay(selectedDate) : ''}
              onClick={() => setDatePickerState({ isOpen: true })}
              placeholder="Click to select date"
              required
              style={{ cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>

      {selectedProvider && selectedDate && (
        <div className="card">
          <h3>Step 2: Choose Time Slot</h3>
          {loading ? (
            <div className="loading">Loading available slots...</div>
          ) : allSlots.length === 0 ? (
            <div className="info-message">
              No time slots are available for the chosen date. Please try a different date or select another provider.
            </div>
          ) : (
            <>
              <p style={{ marginBottom: '12px', fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                {availableSlots.length} available slot{availableSlots.length !== 1 ? 's' : ''}
                {bookedSlots.length > 0 && ` • ${bookedSlots.length} booked`}:
              </p>
              <div className="slot-grid">
                {allSlots.map((slotData) => {
                  const slot = slotData.time || slotData;
                  const isAvailable = slotData.available !== undefined ? slotData.available : availableSlots.includes(slot);
                  const isBooked = !isAvailable;
                  const providerObj = providers.find(p => p.id === selectedProvider);
                  const label = providerObj ? providerSlotToBrowserLabel(selectedDate, slot, providerObj.time_zone) : slot.substring(0,5);
                  
                  return (
                    <button
                      key={slot}
                      type="button"
                      className={`slot-button ${selectedSlot === slot ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                      onClick={() => !isBooked && setSelectedSlot(slot)}
                      disabled={isBooked}
                      title={isBooked ? 'This slot is already booked' : 'Click to select'}
                    >
                      <span>{label}</span>
                      {isBooked && <span className="booked-badge">Booked</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {selectedSlot && (
        <div className="card">
          <h3>Step 3: Patient Information</h3>
          <form onSubmit={handleBooking}>
            <div className="form-row">
              <div className="form-group">
                <label>Patient Name</label>
                <input
                  type="text"
                  value={bookingForm.patient_name}
                  onChange={(e) => setBookingForm({ ...bookingForm, patient_name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="form-group">
                <label>Patient Email</label>
                <input
                  type="email"
                  value={bookingForm.patient_email}
                  onChange={(e) => setBookingForm({ ...bookingForm, patient_email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>
            <button type="submit" className="button" disabled={loading}>
              {loading ? '⏳ Booking...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      )}

      <DatePickerModal
        isOpen={datePickerState.isOpen}
        onClose={() => setDatePickerState({ isOpen: false })}
        value={selectedDate}
        onChange={(date) => {
          setSelectedDate(date);
          setDatePickerState({ isOpen: false });
        }}
        label="Select Appointment Date"
        minDate={today}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default PatientBooking;

