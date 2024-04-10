'use client'
import React, { useState, useEffect } from 'react';

interface DateDifferenceProps {
  deadline: Date;
  createdAt: Date;
}

const DateDifference: React.FC<DateDifferenceProps> = ({ deadline, createdAt }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date() - +new Date(createdAt);
    let timeLeft = {};
    
    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }
    
    return timeLeft as { days?: number, hours?: number, minutes?: number, seconds?: number };
  };
  
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  let displayValue, unit;
  
  if (timeLeft.days && timeLeft.days >= 1) {
    displayValue = timeLeft.days;
    unit = 'd';
  } else if (timeLeft.hours && timeLeft.hours >= 1) {
    displayValue = timeLeft.hours;
    unit = 'h';
  } else if (timeLeft.minutes && timeLeft.minutes >= 1) {
    displayValue = timeLeft.minutes;
    unit = 'min';
  } else {
    displayValue = timeLeft.seconds || 0;
    unit = 'sec';
  }
  
  const countdownStyle = { '--v': displayValue.toString() } as React.CSSProperties;
  
  return (
    <div>
    <div className="flex gap-1 text-center auto-cols-max text-xs px-3 rounded-md">
    <div className="flex bg-neutral rounded-box text-neutral-content">
    <span className="countdown font-mono text-xs">
    <span style={countdownStyle}>{displayValue}</span>
    </span>
    {unit} ago
    </div>
    </div>
    </div>
    );
  };
  
  export default DateDifference;
  