import Image from 'next/image';

const JoinCircleModal = ({ isOpen, onClose, circleData }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white rounded-lg max-w-md w-full overflow-hidden">
    <div className="bg-green-500 p-6 relative">
    <button 
    onClick={onClose} 
    className="absolute top-2 right-2 text-white text-xl"
    >
    ×
    </button>
    <div className="flex items-end">
    <div className="w-24 h-24 bg-white rounded-full overflow-hidden border-4 border-white">
    <Image 
    src={circleData.creatorImage} 
    alt="Creator" 
    width={96} 
    height={96} 
    className="object-cover"
    />
    </div>
    <div className="ml-4 text-white">
    <h2 className="text-2xl font-bold">{circleData.name}</h2>
    <p className="text-sm opacity-80">Created by {circleData.creatorName}</p>
    </div>
    </div>
    </div>
    <div className="p-6">
    <h3 className="text-xl font-bold mb-4">Wait! Do you have 28 seconds to start for free?</h3>
    <p className="mb-4">Build a home for your community, run events, sell courses, and share content — all under your own brand.</p>
    <button 
    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
    >
    Start free 14-day trial
    </button>
    <div className="flex justify-between mt-4">
    {['G', 'Product Hunt', 'App Store'].map((platform, index) => (
      <div key={index} className="text-center">
      <div className="flex justify-center">
      {'★'.repeat(5)}
      </div>
      <p className="text-sm mt-1">{platform === 'G' ? '4.9' : '4.8'}</p>
      </div>
    ))}
    </div>
    </div>
    </div>
    </div>
  );
};

export default JoinCircleModal;