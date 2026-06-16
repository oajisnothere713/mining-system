import React from 'react';
import './Skeleton.css';

export default function Skeleton({ width, height, borderRadius = 4, style = {} }) {
  return (
    <div
      className="skeleton-loader"
      style={{
        width: width || '100%',
        height: height || 20,
        borderRadius: borderRadius,
        ...style,
      }}
    />
  );
}
