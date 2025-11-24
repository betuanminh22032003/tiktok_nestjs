'use client';

import React from 'react';

export interface NumberFormatterProps {
  value: number;
  className?: string;
  animated?: boolean;
}

export const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

export const NumberFormatter: React.FC<NumberFormatterProps> = ({
  value,
  className = '',
  animated = false,
}) => {
  const [displayValue, setDisplayValue] = React.useState(animated ? 0 : value);

  React.useEffect(() => {
    if (!animated) {
      setDisplayValue(value);
      return;
    }

    const duration = 1000; // 1 second animation
    const steps = 60;
    const increment = (value - displayValue) / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue((prev) => prev + increment);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, animated, displayValue]);

  return (
    <span className={`font-semibold tabular-nums ${className}`}>
      {formatNumber(Math.round(displayValue))}
    </span>
  );
};

export default NumberFormatter;
