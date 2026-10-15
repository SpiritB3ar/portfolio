// components/DatePicker.tsx
"use client"
import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

type CustomDatePickerProps = {
    value: Date | null;
    onChange: (date: Date | null) => void;
    label?: string; // Make label optional
    error?: { message: string };
};

// Fully controlled: no mirrored state, `value` is the single source of truth.
const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, label, error }) => {
    const handleDateChange = (date: Date | null) => {
        onChange(date);
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <DatePicker
                selected={value}
                onChange={handleDateChange}
                dateFormat="dd-MM-yyyy"
                showYearDropdown
            />
            {error && <p className="text-red-600 text-sm mt-1">{error.message}</p>}
        </div>
    );
};

export default CustomDatePicker;
