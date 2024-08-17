'use client';

import React, { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const Counter: React.FC<{ deadline: Date; createdAt: Date; }> = ({ deadline, createdAt }) => {
  const calculateTimeLeft = (): TimeLeft => {
    const difference = +new Date(deadline) - +new Date();
    let timeLeft: TimeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    };
    
    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }
    
    return timeLeft;
  };
  
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [deadline, createdAt]);
  
  const textColorClass = timeLeft.days < 3 ? 'text-red-500' : 'text-primary';
  
  return (
    <>
    <div className={`flex gap-1 text-center auto-cols-max uppercase text-xs ${timeLeft.days < 3 ? 'text-red-500 border border-red-500 px-3 rounded-md' : 'border border-primary px-3 rounded-md uppercase text-xs'}`}>
    <div className={`flex flex-col p-1 ${textColorClass}`}>
    <div className="countdown font-mono text-xs">
    <div style={{ '--value': timeLeft.days } as React.CSSProperties}>{timeLeft.days}</div>
    </div>
    days
    </div>
    <div className={`flex flex-col p-1 ${textColorClass}`}>
    <div className="countdown font-mono text-xs">
    <div style={{ '--value': timeLeft.hours } as React.CSSProperties}>{timeLeft.hours}</div>
    </div>
    hours
    </div>
    <div className={`flex flex-col p-1 ${textColorClass}`}>
    <div className="countdown font-mono text-xs">
    <div style={{ '--value': timeLeft.minutes as unknown as number } as React.CSSProperties}>{timeLeft.minutes}</div>
    </div>
    mins
    </div>
    <div className={`flex flex-col p-1 ${textColorClass}`}>
    <div className="countdown font-mono text-xs">
    <div style={{ '--value': timeLeft.seconds } as React.CSSProperties}>{timeLeft.seconds}</div>
    </div>
    secs
    </div>
    </div>
    </>
  );
};

export default Counter;