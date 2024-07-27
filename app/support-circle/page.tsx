'use client'

import { useState } from 'react';
import JoinCircleModal from '../_components/(Support-Circle)/JoinCircle';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const circleData = {
    name: "Your Circle Name",
    creatorName: "John Doe",
    creatorImage: "/path/to/creator-image.jpg",
  };
  
  return (
    <div>
    <button onClick={() => setIsModalOpen(true)}>Open Join Circle Modal</button>
    <JoinCircleModal 
    isOpen={isModalOpen} 
    onClose={() => setIsModalOpen(false)} 
    circleData={circleData}
    />
    </div>
  );
}