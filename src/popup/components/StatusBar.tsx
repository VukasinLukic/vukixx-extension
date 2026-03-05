import React from 'react';

interface StatusBarProps {
  connected: boolean | null;
  queueCount: number;
}

export function StatusBar({ connected, queueCount }: StatusBarProps) {
  const statusClass =
    connected === null ? 'checking' : connected ? 'connected' : 'disconnected';

  const statusText =
    connected === null ? 'Checking...' : connected ? 'Connected' : 'Disconnected';

  return (
    <div className="vkx-status">
      <div className="vkx-status__indicator">
        <div className={`vkx-status__dot vkx-status__dot--${statusClass}`} />
        {statusText}
      </div>
      {queueCount > 0 && (
        <div className="vkx-status__queue">
          {queueCount} queued
        </div>
      )}
    </div>
  );
}
