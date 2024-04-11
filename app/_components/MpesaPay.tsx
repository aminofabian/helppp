'use client'

import React, { useState } from 'react';

const MpesaPay = () => {
  const numbers = [20, 25, 50, 75, 100, 125, 150, 175, 200];
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
  };
  
  const handleEditClick = () => {
    setEditMode(true);
  };
  
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAmount(parseInt(event.target.value));
  };
  
  return (
    <div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_120px] lg:gap-8">
    <div className="h-fit rounded-lg bg-gray-200">
    <div className="grid grid-cols-3 md:grid-cols-5 gap-5 justify-between mx-5 my-5">
    {numbers.map((number, index) => (
      <button
      key={index}
      onClick={() => handleAmountSelect(number)}
      className="mr-2 px-4 py-2 bg-primary text-white rounded border-lime-200"
      >
      {number}
      </button>
      ))}
      <button
      onClick={handleEditClick}
      className="mr-2 w-full px-4 py-2 bg-orange-400 text-white rounded"
      >
      Add a Custom Amount      </button>
      </div>
      </div>
      <div className="h-fit rounded-lg bg-slate-50 w-full">
      <div className='container h-full flex flex-col justify-center items-center'>
      <h2 className='text-xs text-primary border font-semibold justify-center items-center my-3 px-3 rounded-md ring-1 ring-primary'>
      {selectedAmount ? `${selectedAmount / 50} p` : "0"}
      </h2>
      {editMode ? (
        <input
        type="number"
        className="px-6 py-2 font-medium bg-primary text-white w-fit transition-all shadow-[3px_3px_0px_orange] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] rounded-md focus:border-primary"
        value={selectedAmount ?? ''}
        onChange={handleInputChange}
        />
        ) : (
          <button className="px-6 py-2 font-medium bg-primary text-white w-fit transition-all shadow-[3px_3px_0px_orange] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] rounded-md">
          {selectedAmount ? `${selectedAmount}/=` : "Select an amount"}
          </button>
          )}
          </div>
          </div>
          </div>
          </div>
          );
        };
        
        
        export default MpesaPay;
        