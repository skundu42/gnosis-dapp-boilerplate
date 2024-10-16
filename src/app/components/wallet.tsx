import React from 'react';
import { DynamicWidget } from '../lib/dynamic';

export const DynamicWidgetButton: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', marginBottom: '20px' }}>
        <DynamicWidget />
    </div>
  );
};
