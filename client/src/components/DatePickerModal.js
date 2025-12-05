import React, { useState, useEffect } from 'react';
import { formatDateForStorage, formatDateForDisplay, isSameDay } from '../utils/date';
import './DatePickerModal.css';
import { MONTHS, DAYS_OF_WEEK } from '../constants';

function DatePickerModal({ isOpen, onClose, value, onChange, label, minDate }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (isOpen) {
      if (value) {
        const date = new Date(value + 'T00:00:00');
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
          setCurrentMonth(date.getMonth());
          setCurrentYear(date.getFullYear());
        } else {
          const today = new Date();
          setSelectedDate(today);
          setCurrentMonth(today.getMonth());
          setCurrentYear(today.getFullYear());
        }
      } else {
        const today = new Date();
        setSelectedDate(today);
        setCurrentMonth(today.getMonth());
        setCurrentYear(today.getFullYear());
      }
    }
  }, [isOpen, value]);

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };


  const isDateDisabled = (date) => {
    if (!minDate) return false;
    const min = new Date(minDate + 'T00:00:00');
    min.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < min;
  };

  const isDateSelected = (date) => {
    if (!selectedDate) return false;
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    const normalizedSelected = new Date(selectedDate);
    normalizedSelected.setHours(0, 0, 0, 0);
    return isSameDay(normalizedDate, normalizedSelected);
  };

  const isToday = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    return (
      normalizedDate.getDate() === today.getDate() &&
      normalizedDate.getMonth() === today.getMonth() &&
      normalizedDate.getFullYear() === today.getFullYear()
    );
  };

  const handleDateClick = (day) => {
    const newDate = new Date(currentYear, currentMonth, day);
    newDate.setHours(0, 0, 0, 0);
    if (!isDateDisabled(newDate)) {
      setSelectedDate(newDate);
    }
  };

  const handleConfirm = () => {
    onChange(formatDateForStorage(selectedDate));
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
  };

  if (!isOpen) return null;

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const days = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <div className="date-picker-overlay" onClick={handleCancel}>
      <div className="date-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="date-picker-header">
          <h3>{label || 'Select Date'}</h3>
          <button className="date-picker-close" onClick={handleCancel}>×</button>
        </div>
        
        <div className="date-picker-body">
          <div className="date-picker-nav">
            <button className="date-nav-btn" onClick={goToPreviousMonth}>‹</button>
            <div className="date-picker-month-year">
              <span className="month-name">{MONTHS[currentMonth]}</span>
              <span className="year-name">{currentYear}</span>
            </div>
            <button className="date-nav-btn" onClick={goToNextMonth}>›</button>
          </div>

          <div className="date-picker-calendar">
            <div className="calendar-weekdays">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="weekday">{day}</div>
              ))}
            </div>
            <div className="calendar-days">
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="calendar-day empty"></div>;
                }
                
                const date = new Date(currentYear, currentMonth, day);
                const disabled = isDateDisabled(date);
                const selected = isDateSelected(date);
                const today = isToday(date);

                return (
                  <button
                    key={day}
                    className={`calendar-day ${selected ? 'selected' : ''} ${today ? 'today' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => handleDateClick(day)}
                    disabled={disabled}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="date-picker-display">
            <span className="date-display">{formatDateForDisplay(selectedDate)}</span>
          </div>

          <button className="date-picker-today" onClick={goToToday}>
            Go to Today
          </button>
        </div>
        
        <div className="date-picker-footer">
          <button className="date-picker-btn cancel" onClick={handleCancel}>
            Cancel
          </button>
          <button className="date-picker-btn confirm" onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default DatePickerModal;

