import React, { useState } from 'react';
import { runFetch, testPopulate, checkConsistency, fixConsistency, clearAllCache, getCacheInfo } from '../api';

export default function Admin() {
  const [logs, setLogs] = useState({});
  const [loading, setLoading] = useState({});
  const [consistencyReport, setConsistencyReport] = useState(null);
  const [cacheInfo, setCacheInfo] = useState(null);

  const handleFetch = async (freq) => {
    setLoading(prev => ({ ...prev, [freq]: true }));
    try {
      const result = await runFetch(freq);
      setLogs(prev => ({ ...prev, [freq]: result.log }));
    } catch (error) {
      setLogs(prev => ({ ...prev, [freq]: `Error: ${error.message}` }));
    } finally {
      setLoading(prev => ({ ...prev, [freq]: false }));
    }
  };

  const handleTestPopulate = async () => {
    setLoading(prev => ({ ...prev, populate: true }));
    try {
      const result = await testPopulate();
      setLogs(prev => ({ ...prev, populate: result.log }));
    } catch (error) {
      setLogs(prev => ({ ...prev, populate: `Error: ${error.message}` }));
    } finally {
      setLoading(prev => ({ ...prev, populate: false }));
    }
  };

  const handleCheckConsistency = async () => {
    setLoading(prev => ({ ...prev, consistency: true }));
    try {
      const result = await checkConsistency();
      setConsistencyReport(result.report);
    } catch (error) {
      setLogs(prev => ({ ...prev, consistency: `Error: ${error.message}` }));
    } finally {
      setLoading(prev => ({ ...prev, consistency: false }));
    }
  };

  const handleFixConsistency = async () => {
    if (!window.confirm('This will delete orphaned records. Are you sure?')) {
      return;
    }
    
    setLoading(prev => ({ ...prev, fixConsistency: true }));
    try {
      const result = await fixConsistency();
      setLogs(prev => ({ ...prev, fixConsistency: result.message }));
      // Refresh consistency report after fixing
      await handleCheckConsistency();
    } catch (error) {
      setLogs(prev => ({ ...prev, fixConsistency: `Error: ${error.message}` }));
    } finally {
      setLoading(prev => ({ ...prev, fixConsistency: false }));
    }
  };

  const handleClearCache = () => {
    if (window.confirm('Clear all cached data? This will force fresh data loading.')) {
      clearAllCache();
      setCacheInfo(null);
      setLogs(prev => ({ ...prev, cache: 'Cache cleared successfully' }));
    }
  };

  const handleShowCacheInfo = () => {
    const info = getCacheInfo();
    setCacheInfo(info);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Admin Panel</h1>
      
      <div style={{ 
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, #1e1e1e 0%, #252525 100%)',
        border: '1px solid #374151',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}>
        <h2>Test Data Population</h2>
        <button 
          onClick={handleTestPopulate}
          disabled={loading.populate}
          style={{ 
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: loading.populate ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            opacity: loading.populate ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!loading.populate) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
          }}
        >
          {loading.populate ? 'Populating...' : '🚀 Populate All Test Data'}
        </button>
        {logs.populate && (
          <pre style={{ 
            marginTop: '1rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
            border: '1px solid #374151',
            borderRadius: '12px',
            maxHeight: '400px',
            overflow: 'auto',
            color: '#a0a0a0',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
          }}>
            {logs.populate}
          </pre>
        )}
      </div>

      <div style={{ 
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, #1e1e1e 0%, #252525 100%)',
        border: '1px solid #374151',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}>
        <h2>Cache Management</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button 
            onClick={handleShowCacheInfo}
            style={{ 
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            📊 Show Cache Info
          </button>
          <button 
            onClick={handleClearCache}
            style={{ 
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            🗑️ Clear All Cache
          </button>
        </div>

        {cacheInfo && (
          <div style={{ 
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
            border: '1px solid #374151',
            borderRadius: '12px',
            color: '#a0a0a0',
            fontSize: '0.875rem'
          }}>
            <h3 style={{ color: '#ffffff', marginBottom: '1rem' }}>Cache Information:</h3>
            {Object.entries(cacheInfo).map(([key, info]) => (
              <div key={key} style={{ marginBottom: '0.5rem' }}>
                <strong>{key}:</strong> {info.age}s old, {Math.round(info.size / 1024)}KB
              </div>
            ))}
          </div>
        )}

        {logs.cache && (
          <div style={{ 
            marginTop: '1rem',
            padding: '1rem',
            background: '#10b981',
            color: 'white',
            borderRadius: '8px'
          }}>
            {logs.cache}
          </div>
        )}
      </div>

      <div style={{ 
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, #1e1e1e 0%, #252525 100%)',
        border: '1px solid #374151',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}>
        <h2>Database Consistency</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button 
            onClick={handleCheckConsistency}
            disabled={loading.consistency}
            style={{ 
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: loading.consistency ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              opacity: loading.consistency ? 0.6 : 1
            }}
          >
            {loading.consistency ? 'Checking...' : '🔍 Check Consistency'}
          </button>
          <button 
            onClick={handleFixConsistency}
            disabled={loading.fixConsistency}
            style={{ 
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: loading.fixConsistency ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              opacity: loading.fixConsistency ? 0.6 : 1
            }}
          >
            {loading.fixConsistency ? 'Fixing...' : '🧹 Fix Orphaned Records'}
          </button>
        </div>
        
        {logs.consistency && (
          <pre style={{ 
            marginTop: '1rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
            border: '1px solid #374151',
            borderRadius: '12px',
            maxHeight: '300px',
            overflow: 'auto',
            color: '#a0a0a0',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
          }}>
            {logs.consistency}
          </pre>
        )}

        {logs.fixConsistency && (
          <pre style={{ 
            marginTop: '1rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
            border: '1px solid #374151',
            borderRadius: '12px',
            maxHeight: '200px',
            overflow: 'auto',
            color: '#a0a0a0',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
          }}>
            {logs.fixConsistency}
          </pre>
        )}

        {consistencyReport && (
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ color: '#ffffff', marginBottom: '1rem' }}>Consistency Report:</h3>
            <div style={{ 
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
              border: '1px solid #374151',
              borderRadius: '12px',
              color: '#a0a0a0',
              fontSize: '0.875rem',
              lineHeight: '1.5'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Generated:</strong> {new Date(consistencyReport.timestamp).toLocaleString()}
              </div>
              
              {consistencyReport.referential_integrity.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#ef4444' }}>Referential Integrity Issues:</strong>
                  <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                    {consistencyReport.referential_integrity.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {consistencyReport.data_quality.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#f59e0b' }}>Data Quality Issues:</strong>
                  <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                    {consistencyReport.data_quality.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {consistencyReport.data_freshness.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#3b82f6' }}>Data Freshness Issues:</strong>
                  <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                    {consistencyReport.data_freshness.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div>
                <strong style={{ color: '#10b981' }}>Table Sizes:</strong>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                  {consistencyReport.table_sizes.map((info, index) => (
                    <li key={index}>{info}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ 
        background: 'linear-gradient(135deg, #1e1e1e 0%, #252525 100%)',
        border: '1px solid #374151',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}>
        <h2>Manual Fetch Triggers</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {['daily', 'weekly', 'quarterly', 'annual'].map(freq => (
            <button
              key={freq}
              onClick={() => handleFetch(freq)}
              disabled={loading[freq]}
              style={{ 
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: loading[freq] ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                opacity: loading[freq] ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading[freq]) {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}
            >
              {loading[freq] ? 'Running...' : `Run ${freq}`}
            </button>
          ))}
        </div>
        
        {Object.entries(logs).filter(([key]) => key !== 'populate').map(([freq, log]) => (
          <div key={freq} style={{ marginTop: '1.5rem' }}>
            <h3 style={{ 
              color: '#ffffff',
              marginBottom: '1rem',
              fontSize: '1.25rem',
              fontWeight: '600'
            }}>
              {freq.charAt(0).toUpperCase() + freq.slice(1)} Log:
            </h3>
            <pre style={{ 
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
              border: '1px solid #374151',
              borderRadius: '12px',
              maxHeight: '300px',
              overflow: 'auto',
              color: '#a0a0a0',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
            }}>
              {log}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
