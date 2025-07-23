import React from 'react';

export default function Stepper({ steps, activeStep }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
      {steps.map((label, idx) => (
        <div key={label} style={{
          padding: '0.5rem 1.5rem',
          borderRadius: '20px',
          background: idx === activeStep ? '#3b82f6' : '#222',
          color: idx === activeStep ? '#fff' : '#aaa',
          fontWeight: idx === activeStep ? 'bold' : 'normal',
          border: idx === activeStep ? '2px solid #3b82f6' : '1px solid #333',
          transition: 'all 0.2s',
        }}>
          {label}
        </div>
      ))}
    </div>
  );
} 