import React from 'react';

export default function Stepper({ steps, activeStep }) {
  return (
    <div className="flex gap-md justify-center">
      {steps.map((label, idx) => (
        <div 
          key={label} 
          className={`pill ${idx === activeStep ? 'pill-primary' : ''}`}
          style={{
            background: idx === activeStep ? 'var(--primary)' : 'var(--bg)',
            color: idx === activeStep ? 'white' : 'var(--muted)',
            fontWeight: idx === activeStep ? '600' : '500',
            borderColor: idx === activeStep ? 'var(--primary)' : 'var(--border)'
          }}
        >
          {label}
        </div>
      ))}
    </div>
  );
} 