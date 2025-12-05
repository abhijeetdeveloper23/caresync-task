import React, { useState, useEffect } from 'react';
import './TimePickerModal.css';

function TimePickerModal({ isOpen, onClose, value, onChange, label }) {
  const [hours, setHours] = useState('09');
  const [minutes, setMinutes] = useState('00');
  const [period, setPeriod] = useState('AM');

  useEffect(() => {
    if (isOpen && value) {
      const timeStr = value.substring(0, 5);
      const [h, m] = timeStr.split(':');
      const hour24 = parseInt(h, 10);
      
      if (hour24 === 0) {
        setHours('12');
        setPeriod('AM');
      } else if (hour24 === 12) {
        setHours('12');
        setPeriod('PM');
      } else if (hour24 > 12) {
        setHours(String(hour24 - 12).padStart(2, '0'));
        setPeriod('PM');
      } else {
        setHours(h.padStart(2, '0'));
        setPeriod('AM');
      }
      setMinutes(m || '00');
    }
  }, [isOpen, value]);

  const handleConfirm = () => {
    let hour24 = parseInt(hours, 10);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    const timeString = `${String(hour24).padStart(2, '0')}:${minutes}:00`;
    onChange(timeString);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  const hourOptions = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 1;
    return String(hour).padStart(2, '0');
  });

  const minuteOptions = ['00', '15', '30', '45'];

  return (
    <div className="time-picker-overlay" onClick={handleCancel}>
      <div className="time-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="time-picker-header">
          <h3>{label || 'Select Time'}</h3>
          <button className="time-picker-close" onClick={handleCancel}>×</button>
        </div>
        
        <div className="time-picker-body">
          <div className="time-picker-selectors">
            <div className="time-selector-group">
              <label>Hour</label>
              <div className="time-selector-scroll">
                {hourOptions.map((hour) => (
                  <button
                    key={hour}
                    className={`time-option ${hours === hour ? 'selected' : ''}`}
                    onClick={() => setHours(hour)}
                  >
                    {hour}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="time-selector-group">
              <label>Minute</label>
              <div className="time-selector-scroll">
                {minuteOptions.map((min) => (
                  <button
                    key={min}
                    className={`time-option ${minutes === min ? 'selected' : ''}`}
                    onClick={() => setMinutes(min)}
                  >
                    {min}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="time-selector-group">
              <label>Period</label>
              <div className="time-selector-scroll">
                <button
                  className={`time-option period-option ${period === 'AM' ? 'selected' : ''}`}
                  onClick={() => setPeriod('AM')}
                >
                  AM
                </button>
                <button
                  className={`time-option period-option ${period === 'PM' ? 'selected' : ''}`}
                  onClick={() => setPeriod('PM')}
                >
                  PM
                </button>
              </div>
            </div>
          </div>
          
          <div className="time-picker-display">
            <span className="time-display">
              {hours}:{minutes} {period}
            </span>
          </div>
        </div>
        
        <div className="time-picker-footer">
          <button className="time-picker-btn cancel" onClick={handleCancel}>
            Cancel
          </button>
          <button className="time-picker-btn confirm" onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default TimePickerModal;

