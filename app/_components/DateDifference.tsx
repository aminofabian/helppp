'use client'
import React, { useState, useEffect } from 'react';

interface DateDifferenceProps {
  deadline: Date;
  createdAt: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const DateDifference: React.FC<DateDifferenceProps> = ({ deadline, createdAt }) => {
  const calculateTimeLeft = (): TimeLeft => {
    const now = new Date();
    const createdDate = new Date(createdAt);
    const difference = now.getTime() - createdDate.getTime();
    
    console.log('Now:', now);
    console.log('Created At:', createdDate);
    console.log('Difference (ms):', difference);
    
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  };
  
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [createdAt]);
  
  useEffect(() => {
    console.log('Time Left:', timeLeft);
  }, [timeLeft]);
  
  let displayValue: number;
  let unit: string;
  
  if (timeLeft.days > 0) {
    displayValue = timeLeft.days;
    unit = 'd';
  } else if (timeLeft.hours > 0) {
    displayValue = timeLeft.hours;
    unit = 'h';
  } else if (timeLeft.minutes > 0) {
    displayValue = timeLeft.minutes;
    unit = 'min';
  } else {
    displayValue = timeLeft.seconds;
    unit = 'secs';
  }
  
  const countdownStyle = { '--v': displayValue.toString() } as React.CSSProperties;
  return (
    <div>
    <div className="flex gap-1 text-center auto-cols-max text-xs px-3 rounded-md lowercase text-primary hover:text-secondary cursor-pointer">
    <div className="flex">
    <span className="font-mono text-xs ">
    {displayValue}
    </span>
    {unit} ago
    </div>
    </div>
    </div>
  )
};