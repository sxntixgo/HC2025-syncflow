import React, { useState } from 'react';
import './FlagCard.css';

const FlagCard = ({ flag, level, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(flag);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy flag:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = flag;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="flag-overlay">
      <div className="flag-card">
        <div className="flag-header">
          <h2 className="flag-title">🏁 CTF Flag Unlocked!</h2>
          <button className="flag-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="flag-content">
          <div className="flag-level">
            <span className="flag-level-label">Level {level} Completed</span>
          </div>
          
          <div className="flag-container">
            <div className="flag-text-container">
              <code className="flag-text">{flag}</code>
            </div>
            <button 
              className={`flag-copy-btn ${copied ? 'copied' : ''}`}
              onClick={copyToClipboard}
              title="Copy flag to clipboard"
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          
          <div className="flag-info">
            <p className="flag-description">
              Congratulations! You've successfully completed level {level} of the SyncFlow Challenge.
              Copy this flag and submit it to your CTF platform.
            </p>
          </div>
        </div>
        
        <div className="flag-footer">
          <button className="flag-close-bottom-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlagCard;