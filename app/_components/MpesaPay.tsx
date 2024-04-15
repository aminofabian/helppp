'use client'
import React, { useState } from 'react';
import { handleMpesa } from '../actions';
import { SubmitButton } from './SubmitButtons';

const MpesaPay = ({requestId}: {requestId:string}) => {
  const numbers = [20, 50, 100, 200, 500, 1000, 2000];
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(amount.toString());
  };
  
  const handleEditClick = () => {
    setEditMode(true);
  };
  
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(event.target.value);
    setSelectedAmount(parseInt(event.target.value));
  };
  
  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(event.target.value);
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
    <button onClick={handleEditClick} className="mr-2 w-full px-4 py-2 bg-orange-400 text-white rounded">
    Add a Custom Amount
    </button>
    
    <input
    type="tel"
    placeholder="Enter Phone Number"
    name='phoneNumber'
    className="px-6 py-2 font-medium bg-primary text-white w-fit transition-all shadow-[3px_3px_0px_orange] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] rounded-md focus:border-primary mr-2"
    value={phoneNumber as string}
    onChange={handlePhoneChange}
    />
    </div>
    </div>
    <div className="h-fit rounded-lg bg-slate-50 w-full">
    <div className="container h-full flex flex-col justify-center items-center">
    <h2 className="text-xs text-primary border font-semibold justify-center items-center my-3 px-3 rounded-md ring-1 ring-primary">
    {selectedAmount ? `${selectedAmount / 50} p` : '0'}
    </h2>
    {editMode ? (
      <input
      type="number"
      className="px-6 py-2 font-medium bg-primary text-white w-fit transition-all shadow-[3px_3px_0px_orange] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] rounded-md focus:border-primary"
      value={customAmount}
      onChange={handleInputChange}
      placeholder="Enter Custom Amount"
      />
    ) : (
      <button className="px-6 py-2 font-medium bg-primary text-white w-fit transition-all shadow-[3px_3px_0px_orange] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] rounded-md">
      {selectedAmount ? `${selectedAmount}/=` : 'Select an amount'}
      </button>
    )}
    </div>
    </div>
    </div>
    <form action={ handleMpesa} className='w-full my-5 flex'>
    
    <input className="hidden" name='amount' value={selectedAmount as number} readOnly />    
    <input className="hidden" name='requestId' value={requestId as string} readOnly />    
    <input className="hidden" name='phoneNumber' value={phoneNumber as string} readOnly />    

    
    <SubmitButton ButtonName='Pay With Mpesa' />
    
    </form>
    </div>
  );
};

export default MpesaPay;

