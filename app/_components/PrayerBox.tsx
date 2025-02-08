'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, X, Heart, Ban, DollarSign, Sparkles, Coins } from 'lucide-react';
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
        <Card className="p-6 relative overflow-hidden">
          <motion.div
            className="absolute -top-4 -right-4 text-primary/10 z-0"
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          >
            <Sparkles className="w-20 h-20" />
          </motion.div>
          
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Submit a Prayer</h3>
              <Input
                placeholder="Prayer Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
              />
              <Textarea
                placeholder="Write your prayer here..."
                value={newPrayer}
                onChange={(e) => setNewPrayer(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isMonetary}
                  onCheckedChange={setIsMonetary}
                  id="monetary-mode"
                />
                <Label htmlFor="monetary-mode">This prayer needs financial support</Label>
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
                    className="w-full mt-2"
                  />
                </motion.div>
              )}
            </div>
            <Button type="submit" className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              Submit Prayer
            </Button>
          </form>
        </Card>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Prayer Box</h3>
              <Button onClick={handleOpenPrayer} variant="outline">
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
                  <Card className="p-6 bg-secondary">
                    <button
                      onClick={() => setCurrentPrayer(null)}
                      className="absolute top-2 right-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <h4 className="font-semibold mb-2">{currentPrayer.title}</h4>
                    <p className="mb-4">{currentPrayer.content}</p>
                    {currentPrayer.isMonetary && (
                      <motion.div 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="mb-4 p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-lg border border-primary/20 backdrop-blur-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Coins className="h-5 w-5 text-primary" />
                              <motion.div
                                className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"
                                animate={{
                                  scale: [1, 1.2, 1],
                                  opacity: [0.5, 1, 0.5]
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">Support Needed</span>
                          </div>
                          <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="flex items-baseline gap-1"
                          >
                            <span className="text-xs text-primary/70">KES</span>
                            <span className="text-xl font-bold text-primary">{currentPrayer.amount?.toLocaleString()}</span>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                    <div className="flex gap-2">
                      <Button onClick={() => handleAnswer('accept')} className="flex-1">
                        <Heart className="mr-2 h-4 w-4" />
                        I'll Help
                      </Button>
                      <Button onClick={() => handleAnswer('impossible')} variant="outline" className="flex-1">
                        <Ban className="mr-2 h-4 w-4" />
                        Mark Impossible
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                  <Card className={`p-4 ${prayer.isOpen ? 'bg-secondary/50' : 'bg-primary/5'}`}>
                    <div className="relative">
                      <Mail className={`h-6 w-6 mb-2 ${prayer.isOpen ? 'text-primary/50' : 'text-primary'}`} />
                      {prayer.isMonetary && (
                        <motion.div
                          variants={sparkleVariants}
                          initial="initial"
                          animate="animate"
                          className="absolute -top-1 -right-1"
                        >
                          <DollarSign className="h-4 w-4 text-primary" />
                        </motion.div>
                      )}
                    </div>
                    <h4 className="font-semibold truncate">{prayer.title}</h4>
                    {prayer.isOpen && (
                      <span className="text-xs text-primary">Prayer Answered</span>
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
            <DialogTitle>Choose Payment Method</DialogTitle>
            <DialogDescription>
              Select how you'd like to send KES {currentPrayer?.amount}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mpesa" id="mpesa" />
                <Label htmlFor="mpesa">M-Pesa</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bank" id="bank" />
                <Label htmlFor="bank">Bank Transfer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card">Credit/Debit Card</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePayment}
              disabled={!selectedPaymentMethod}
            >
              Proceed to Pay
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 