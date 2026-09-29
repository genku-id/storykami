'use client';
import React, { useState, useEffect, useRef } from 'react';
import { toDDMMYYYY, toYYYYMMDD, formatIndonesianDate, parseDateComponents } from '@/utils/dateHelper';

export default function DateInputField({
  label = 'Tanggal (DD/MM/YYYY)',
  value = '',
  onChange,
  placeholder = 'DD/MM/YYYY (contoh: 22/11/2026)',
  disabled = false
}) {
  // Tampilkan nilai selalu dalam format DD/MM/YYYY
  const [displayValue, setDisplayValue] = useState(() => toDDMMYYYY(value));
  const hiddenDateInputRef = useRef(null);

  useEffect(() => {
    setDisplayValue(toDDMMYYYY(value));
  }, [value]);

  // Nilai ISO untuk input type="date"
  const isoValue = toYYYYMMDD(value || displayValue);

  // Tanggal terformat Indonesia untuk preview konfirmasi (misal: "Minggu, 22 November 2026")
  const datePreview = parseDateComponents(displayValue) ? formatIndonesianDate(displayValue) : null;

  // Tangani ketikan manual dari user
  const handleTextChange = (e) => {
    let raw = e.target.value;

    // Filter karakter yang diizinkan: angka, slash, dash
    raw = raw.replace(/[^\d\/\-]/g, '');

    // Jika user mengetik 8 digit angka tanpa pembatas (misal: 22112026), auto-format jadi 22/11/2026
    const onlyDigits = raw.replace(/\D/g, '');
    let formatted = raw;

    if (onlyDigits.length === 8 && !raw.includes('/') && !raw.includes('-')) {
      formatted = `${onlyDigits.slice(0, 2)}/${onlyDigits.slice(2, 4)}/${onlyDigits.slice(4, 8)}`;
    }

    setDisplayValue(formatted);

    // Kirim perubahan ke parent form
    if (onChange) {
      // Jika format sudah valid DD/MM/YYYY, kirim nilai terformat
      const comp = parseDateComponents(formatted);
      if (comp) {
        onChange(toDDMMYYYY(formatted));
      } else {
        onChange(formatted);
      }
    }
  };

  const handleBlur = () => {
    // Saat kursor keluar, rapikan jika tanggal valid
    const comp = parseDateComponents(displayValue);
    if (comp) {
      const normalized = toDDMMYYYY(displayValue);
      setDisplayValue(normalized);
      if (onChange) onChange(normalized);
    }
  };

  // Tangani pemilihan tanggal dari popup kalender
  const handleCalendarPick = (e) => {
    const pickedIso = e.target.value; // YYYY-MM-DD
    if (pickedIso) {
      const dmy = toDDMMYYYY(pickedIso);
      setDisplayValue(dmy);
      if (onChange) onChange(dmy);
    }
  };

  const triggerCalendar = () => {
    if (hiddenDateInputRef.current) {
      if (typeof hiddenDateInputRef.current.showPicker === 'function') {
        hiddenDateInputRef.current.showPicker();
      } else {
        hiddenDateInputRef.current.focus();
        hiddenDateInputRef.current.click();
      }
    }
  };

  return (
    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
      <label className="wim-label" style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>Format: Tanggal/Bulan/Tahun</span>
      </label>

      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          value={displayValue}
          onChange={handleTextChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={10}
          className="wim-input"
          style={{
            paddingRight: '48px',
            letterSpacing: displayValue ? '0.5px' : 'normal',
            fontWeight: displayValue ? 500 : 400
          }}
        />

        {/* Tombol Kalender */}
        <div
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            borderRadius: '6px',
            background: 'rgba(0, 0, 0, 0.03)',
            border: '1px solid var(--border)',
            transition: 'background 0.2s',
            zIndex: 2
          }}
          title="Buka Kalender"
          onClick={triggerCalendar}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>

          {/* Native Date Picker Input as Transparent Overlay */}
          <input
            ref={hiddenDateInputRef}
            type="date"
            value={isoValue || ''}
            onChange={handleCalendarPick}
            disabled={disabled}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0,
              width: '100%',
              height: '100%',
              cursor: disabled ? 'not-allowed' : 'pointer'
            }}
            tabIndex={-1}
            aria-label="Pilih tanggal dari kalender"
          />
        </div>
      </div>

      {/* Preview Konfirmasi Tanggal Bahasa Indonesia */}
      {datePreview ? (
        <div style={{
          marginTop: '0.4rem',
          fontSize: '0.8rem',
          color: '#15803d',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 500
        }}>
          <span>🗓️</span>
          <span>{datePreview}</span>
        </div>
      ) : displayValue ? (
        <div style={{
          marginTop: '0.4rem',
          fontSize: '0.78rem',
          color: '#b91c1c',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>⚠️</span>
          <span>Format tanggal belum lengkap (contoh: 22/11/2026)</span>
        </div>
      ) : null}
    </div>
  );
}
