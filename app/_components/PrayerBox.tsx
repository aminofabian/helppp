'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, X, Heart, Ban, DollarSign, Sparkles, Coins, PenTool } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';

interface Prayer {
  id: string;
  content: string;
  title: string;
  isOpen: boolean;
  isMonetary: boolean;
  amount?: number;
}

const envelope = {
  initial: { rotateY: 0, scale: 1 },
  hover: { 
    rotateY: 15,
    scale: 1.05,
    transition: { duration: 0.3 }
  },
  tap: { 
    rotateY: 30,
    scale: 0.95,
    transition: { duration: 0.2 }
  },
  exit: { 
    rotateY: 90,
    scale: 0,
    opacity: 0,
    transition: { duration: 0.5 }
  }
};

const sparkleVariants = {
  initial: { scale: 0, rotate: 0 },
  animate: { 
    scale: [0, 1, 0],
    rotate: [0, 180, 360],
    transition: { 
      duration: 1.5,
      repeat: Infinity,
      repeatType: "loop" as const
    }
  }
};

export default function PrayerBox() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [newPrayer, setNewPrayer] = useState('');
  const [title, setTitle] = useState('');
  const [currentPrayer, setCurrentPrayer] = useState<Prayer | null>(null);
  const [isMonetary, setIsMonetary] = useState(false);
  const [amount, setAmount] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrayer.trim() || !title.trim()) return;

    const prayer: Prayer = {
      id: Math.random().toString(36).substr(2, 9),
      content: newPrayer,
      title: title,
      isOpen: false,
      isMonetary,
      amount: isMonetary ? Number(amount) : undefined
    };

    setPrayers([...prayers, prayer]);
    setNewPrayer('');
    setTitle('');
    setAmount('');
    setIsMonetary(false);
  };

  const handleOpenPrayer = () => {
    if (prayers.length === 0) return;
    
    const unopenedPrayers = prayers.filter(p => !p.isOpen);
    if (unopenedPrayers.length === 0) {
      setCurrentPrayer(null);
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * unopenedPrayers.length);
    const selectedPrayer = unopenedPrayers[randomIndex];
    setCurrentPrayer(selectedPrayer);
  };

  const handleAnswer = (answer: 'accept' | 'impossible') => {
    if (!currentPrayer) return;
    
    if (answer === 'accept' && currentPrayer.isMonetary) {
      setShowPaymentModal(true);
      return;
    }
    
    if (answer === 'accept') {
      setPrayers(prayers.map(p => 
        p.id === currentPrayer.id 
          ? { ...p, isOpen: true }
          : p
      ));
    }
    setCurrentPrayer(null);
  };

  const handlePayment = () => {
    if (!currentPrayer) return;
    
    setPrayers(prayers.map(p => 
      p.id === currentPrayer.id 
        ? { ...p, isOpen: true }
        : p
    ));
    setShowPaymentModal(false);
    setCurrentPrayer(null);
    setSelectedPaymentMethod('');
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-8 relative overflow-hidden bg-[url('/old-paper.jpg')] bg-cover">
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/80 backdrop-blur-sm" />
          <motion.div
            className="absolute -top-4 -right-4 text-primary/10 z-0"
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          >
            <PenTool className="w-20 h-20" />
          </motion.div>
          
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div className="space-y-4">
              <h3 className="text-2xl font-serif text-center">Write Your Prayer</h3>
              <Input
                placeholder="Prayer Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border-none bg-transparent text-lg font-serif placeholder:text-primary/40"
              />
              <Textarea
                placeholder="Dear Lord..."
                value={newPrayer}
                onChange={(e) => setNewPrayer(e.target.value)}
                className="min-h-[200px] border-none bg-transparent font-serif text-lg leading-relaxed placeholder:text-primary/40 resize-none"
              />
              <div className="flex items-center space-x-2 justify-end">
                <Switch
                  checked={isMonetary}
                  onCheckedChange={setIsMonetary}
                  id="monetary-mode"
                />
                <Label htmlFor="monetary-mode" className="font-serif">Financial Support Needed</Label>
              </div>
              {isMonetary && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Input
                    type="number"
                    placeholder="Amount needed (KES)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full mt-2 bg-transparent border-primary/20 font-serif"
                  />
                </motion.div>
              )}
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button type="submit" className="w-full bg-primary/90 hover:bg-primary font-serif text-lg py-6">
                <Mail className="mr-2 h-5 w-5" />
                Seal & Send Prayer
              </Button>
            </motion.div>
          </form>
        </Card>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/wooden-texture.jpg')] bg-cover opacity-30" />
          <div className="relative p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-serif">Prayer Box</h3>
              <Button 
                onClick={handleOpenPrayer} 
                variant="outline" 
                className="font-serif border-2 hover:bg-primary/10"
              >
                Open a Prayer
              </Button>
            </div>

            <AnimatePresence mode="wait">
              {currentPrayer && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
                  animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                  exit={{ scale: 0.8, opacity: 0, rotateY: -90 }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="relative"
                >
                  <Card className="p-8 bg-[url('/old-paper.jpg')] bg-cover">
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
                    <div className="relative">
                      <button
                        onClick={() => setCurrentPrayer(null)}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary/20"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <h4 className="font-serif text-xl mb-4">{currentPrayer.title}</h4>
                      <p className="font-serif text-lg leading-relaxed mb-6">{currentPrayer.content}</p>
                      {currentPrayer.isMonetary && (
                        <motion.div 
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="mb-6 p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl border border-primary/20 backdrop-blur-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Coins className="h-6 w-6 text-primary" />
                                <motion.div
                                  className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"
                                  animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.5, 1, 0.5]
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                />
                              </div>
                              <span className="font-serif text-primary/70">Support Needed</span>
                            </div>
                            <motion.div
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                              className="flex items-baseline gap-2"
                            >
                              <span className="text-sm font-serif text-primary/70">KES</span>
                              <span className="text-2xl font-bold font-serif text-primary">{currentPrayer.amount?.toLocaleString()}</span>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                      <div className="flex gap-4">
                        <Button 
                          onClick={() => handleAnswer('accept')} 
                          className="flex-1 bg-primary/90 hover:bg-primary font-serif text-lg py-6"
                        >
                          <Heart className="mr-2 h-5 w-5" />
                          I'll Help
                        </Button>
                        <Button 
                          onClick={() => handleAnswer('impossible')} 
                          variant="outline" 
                          className="flex-1 font-serif text-lg py-6 border-2"
                        >
                          <Ban className="mr-2 h-5 w-5" />
                          Mark Impossible
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
              {prayers.map((prayer) => (
                <motion.div
                  key={prayer.id}
                  variants={envelope}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  exit="exit"
                  className="relative"
                >
                  <Card className={`p-6 ${prayer.isOpen ? 'bg-secondary/50' : 'bg-[url(/envelope.jpg)] bg-cover'}`}>
                    <div className="relative">
                      <Mail className={`h-8 w-8 mb-3 ${prayer.isOpen ? 'text-primary/50' : 'text-primary'}`} />
                      {prayer.isMonetary && (
                        <motion.div
                          variants={sparkleVariants}
                          initial="initial"
                          animate="animate"
                          className="absolute -top-1 -right-1"
                        >
                          <DollarSign className="h-5 w-5 text-primary" />
                        </motion.div>
                      )}
                    </div>
                    <h4 className="font-serif text-lg truncate">{prayer.title}</h4>
                    {prayer.isOpen && (
                      <span className="text-sm font-serif text-primary mt-2 block">Prayer Answered</span>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Choose Payment Method</DialogTitle>
            <DialogDescription className="font-serif">
              Select how you'd like to send KES {currentPrayer?.amount?.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mpesa" id="mpesa" />
                <Label htmlFor="mpesa" className="font-serif">M-Pesa</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bank" id="bank" />
                <Label htmlFor="bank" className="font-serif">Bank Transfer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="font-serif">Credit/Debit Card</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="font-serif">
              Cancel
            </Button>
            <Button 
              onClick={handlePayment}
              disabled={!selectedPaymentMethod}
              className="font-serif"
            >
              Proceed to Pay
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 