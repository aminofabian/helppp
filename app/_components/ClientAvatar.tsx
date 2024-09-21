'use client';

import React from 'react';
import ReactNiceAvatar, { genConfig } from 'react-nice-avatar';

interface ClientAvatarProps {
  className?: string;
}

export function ClientAvatar({ className }: ClientAvatarProps) {
  const config = genConfig();
  return <ReactNiceAvatar className={className} {...config} />;
}
