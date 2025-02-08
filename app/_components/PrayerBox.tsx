'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, X, Heart, Ban, DollarSign, Sparkles, Coins, PenTool, Star, Sparkle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Prayer {
  id: string;
  content: string;
  title: string;
  isOpen: boolean;
  isMonetary: boolean;
  amount?: number;
  currency?: Currency;
}

type Currency = typeof CURRENCIES[number]['value'];

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

const unfoldAnimation = {
  initial: { 
    rotateX: 0,
    transformOrigin: "top",
    height: "100%",
  },
  unfold: {
    rotateX: [0, -180, -180],
    transformOrigin: "top",
    height: ["100%", "100%", "auto"],
    transition: {
      duration: 1.2,
      times: [0, 0.5, 1],
      ease: "easeInOut"
    }
  }
};

const letterAnimation = {
  initial: { 
    y: -50,
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.6,
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const CURRENCIES = [
  // African Currencies
  { value: 'KES', label: 'Kenyan Shilling', symbol: 'KSh', group: 'Africa' },
  { value: 'TZS', label: 'Tanzanian Shilling', symbol: 'TSh', group: 'Africa' },
  { value: 'NGN', label: 'Nigerian Naira', symbol: '₦', group: 'Africa' },
  { value: 'UGX', label: 'Ugandan Shilling', symbol: 'USh', group: 'Africa' },
  { value: 'RWF', label: 'Rwandan Franc', symbol: 'RF', group: 'Africa' },
  { value: 'ETB', label: 'Ethiopian Birr', symbol: 'Br', group: 'Africa' },
  // International Currencies
  { value: 'USD', label: 'US Dollar', symbol: '$', group: 'International' },
  { value: 'EUR', label: 'Euro', symbol: '€', group: 'International' },
  { value: 'GBP', label: 'British Pound', symbol: '£', group: 'International' },
  { value: 'AUD', label: 'Australian Dollar', symbol: 'A$', group: 'International' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$', group: 'International' },
] as const;

export default function PrayerBox() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [newPrayer, setNewPrayer] = useState('');
  const [title, setTitle] = useState('');
  const [currentPrayer, setCurrentPrayer] = useState<Prayer | null>(null);
  const [isMonetary, setIsMonetary] = useState(true);
  const [amount, setAmount] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleIndex, setShuffleIndex] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(CURRENCIES[0].value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrayer.trim() || !title.trim()) return;
    if (isMonetary && (!amount.trim() || !selectedCurrency)) return;

    const prayer: Prayer = {
      id: Math.random().toString(36).substr(2, 9),
      content: newPrayer,
      title: title,
      isOpen: false,
      isMonetary,
      amount: isMonetary ? Number(amount) : undefined,
      currency: isMonetary ? selectedCurrency : undefined
    };

    setPrayers([...prayers, prayer]);
    setNewPrayer('');
    setTitle('');
    setAmount('');
    setIsMonetary(false);
    setSelectedCurrency(CURRENCIES[0].value);
  };

  const handleOpenPrayer = async () => {
    if (prayers.length === 0) return;
    
    const unopenedPrayers = prayers.filter(p => !p.isOpen);
    if (unopenedPrayers.length === 0) {
      setCurrentPrayer(null);
      return;
    }

    setIsShuffling(true);
    
    // Shuffle animation
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setShuffleIndex(Math.floor(Math.random() * unopenedPrayers.length));
    }

    const randomIndex = Math.floor(Math.random() * unopenedPrayers.length);
    setShuffleIndex(randomIndex);
    
    // Final selection
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsShuffling(false);
    setCurrentPrayer(unopenedPrayers[randomIndex]);
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

  const formatAmount = (amount: number | undefined, currency: string | undefined) => {
    if (!amount || !currency) return '';
    const currencyInfo = CURRENCIES.find(c => c.value === currency);
    return `${currencyInfo?.symbol} ${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-8 relative overflow-hidden bg-gradient-to-br from-[#1a237e]/10 via-[#311b92]/5 to-[#4a148c]/10">
          <div className="absolute inset-0 bg-[url('/stardust.png')] opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white/40 backdrop-blur-[2px]" />
          
          {/* Floating stars */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ 
                  x: Math.random() * 100 + "%", 
                  y: Math.random() * 100 + "%",
                  scale: 0
                }}
                animate={{ 
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.5,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
              >
                <Star className="h-4 w-4 text-primary/30" />
              </motion.div>
            ))}
          </div>

          <motion.div
            className="absolute -top-4 -right-4 text-primary/10 z-0"
            initial={{ scale: 0, rotate: 0 }}
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: 360,
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ 
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <Sparkle className="w-20 h-20" />
          </motion.div>
          
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div className="space-y-4">
              <h3 className="text-2xl font-serif text-center bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary">Write Your Prayer</h3>
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
                className="min-h-[200px] border-none bg-transparent font-handwriting text-xl leading-relaxed placeholder:text-primary/40 resize-none"
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
                  className="space-y-4"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-lg -m-1 blur-sm" />
                    <div className="relative bg-white/5 rounded-lg p-6 border border-primary/20">
                      <div className="flex flex-col space-y-6">
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
                          <span className="font-serif text-primary/90 text-lg">Financial Support Details</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label htmlFor="currency" className="text-sm text-primary/80 font-medium">Select Currency</Label>
                            <Select 
                              value={selectedCurrency} 
                              onValueChange={(value: Currency) => setSelectedCurrency(value)}
                            >
                              <SelectTrigger 
                                className="w-full bg-white/10 border-primary/20 focus:ring-primary/20 hover:bg-white/20 transition-colors"
                              >
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {Array.from(new Set(CURRENCIES.map(c => c.group))).map(group => (
                                  <div key={group} className="px-2 py-1.5">
                                    <div className="text-sm font-medium text-primary/60 mb-1">{group}</div>
                                    {CURRENCIES.filter(c => c.group === group).map((currency) => (
                                      <SelectItem 
                                        key={currency.value} 
                                        value={currency.value}
                                        className="font-serif hover:bg-primary/10"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-primary/90">{currency.symbol}</span>
                                          <span>{currency.label}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </div>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="amount" className="text-sm text-primary/80 font-medium">Enter Amount</Label>
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                <span className="text-primary/60 font-medium">
                                  {CURRENCIES.find(c => c.value === selectedCurrency)?.symbol}
                                </span>
                                <div className="h-4 w-px bg-primary/20" />
                              </div>
                              <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-12 w-full bg-white/10 border-primary/20 font-serif focus:ring-primary/20 hover:bg-white/20 transition-colors"
                              />
                              <motion.div
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary/40"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                              >
                                {selectedCurrency}
                              </motion.div>
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-primary/40 italic mt-2">
                          * All transactions are secure and encrypted
                        </div>
                      </div>
                    </div>
                  </div>
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
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a237e]/5 via-[#311b92]/10 to-[#4a148c]/5" />
          <div className="absolute inset-0 bg-[url('/stardust.png')] mix-blend-soft-light opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white/60 backdrop-blur-[1px]" />
          
          {/* Divine light rays */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
              animate={{
                x: ['-100%', '100%'],
                opacity: [0, 0.5, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "loop",
                ease: "linear"
              }}
            />
          </div>

          <div className="relative p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-serif bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary">Prayer Box</h3>
              <Button 
                onClick={handleOpenPrayer} 
                variant="outline" 
                className="font-serif border-2 hover:bg-primary/10 relative overflow-hidden group"
                disabled={isShuffling}
              >
                <span className="relative z-10">
                  {isShuffling ? 'Selecting...' : 'Open a Prayer'}
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 1 }}
                />
              </Button>
            </div>

            <AnimatePresence mode="wait">
              {isShuffling && (
                <motion.div
                  key="shuffle"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-sm"
                >
                  <motion.div
                    animate={{ 
                      rotateY: [0, 360],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="bg-primary/10 p-8 rounded-xl backdrop-blur-md"
                  >
                    <Mail className="h-12 w-12 text-primary animate-bounce" />
                  </motion.div>
                </motion.div>
              )}

              {currentPrayer && !isShuffling && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="relative"
                >
                  <Card className="p-0 overflow-hidden bg-[url('/old-paper.jpg')] bg-cover">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/10 to-primary/5"
                      variants={unfoldAnimation}
                      initial="initial"
                      animate="unfold"
                    />
                    
                    <motion.div 
                      className="relative p-8"
                      variants={letterAnimation}
                      initial="initial"
                      animate="animate"
                    >
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8">
                        <motion.div
                          className="w-full h-full bg-primary/20 rounded-full"
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

                      <button
                        onClick={() => setCurrentPrayer(null)}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary/20"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      <div className="pt-6">
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.8 }}
                        >
                          <h4 className="font-serif text-xl mb-4 text-primary/80">{currentPrayer.title}</h4>
                          <div className="relative">
                            <div className="absolute -left-6 top-0 w-1 h-full bg-primary/20 rounded-full" />
                            <p className="font-handwriting text-xl leading-relaxed mb-6 pl-4">{currentPrayer.content}</p>
                          </div>
                        </motion.div>

                        {currentPrayer.isMonetary && (
                          <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 1 }}
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
                                <div className="flex flex-col">
                                  <span className="font-serif text-primary/90">Support Needed</span>
                                  <span className="text-xs text-primary/50">
                                    {CURRENCIES.find(c => c.value === currentPrayer.currency)?.label}
                                  </span>
                                </div>
                              </div>
                              <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                className="flex items-baseline gap-2"
                              >
                                <span className="text-3xl font-bold font-serif text-primary">
                                  {formatAmount(currentPrayer.amount, currentPrayer.currency)}
                                </span>
                              </motion.div>
                            </div>
                          </motion.div>
                        )}

                        <motion.div 
                          className="flex gap-4"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 1.2 }}
                        >
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
                        </motion.div>
                      </div>
                    </motion.div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
              {prayers.map((prayer, index) => (
                <motion.div
                  key={prayer.id}
                  variants={envelope}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  exit="exit"
                  animate={isShuffling && !prayer.isOpen ? {
                    scale: shuffleIndex === index ? 1.1 : 1,
                    rotate: shuffleIndex === index ? [0, -5, 5, 0] : 0,
                    transition: { duration: 0.3 }
                  } : {}}
                  className="relative group"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={false}
                    animate={{ scale: [0.95, 1.05, 0.95] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  <Card className={`p-6 ${prayer.isOpen ? 'bg-secondary/50' : 'bg-[url(/envelope.jpg)] bg-cover'} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/40 opacity-50" />
                    <div className="relative z-10">
                      <Mail className={`h-8 w-8 mb-3 ${prayer.isOpen ? 'text-primary/50' : 'text-primary'}`} />
                      {prayer.isMonetary && (
                        <motion.div
                          variants={sparkleVariants}
                          initial="initial"
                          animate="animate"
                          className="absolute -top-1 -right-1"
                        >
                          <Sparkle className="h-5 w-5 text-primary" />
                        </motion.div>
                      )}
                    </div>
                    <h4 className="font-serif text-lg truncate relative z-10">{prayer.title}</h4>
                    {prayer.isOpen && (
                      <span className="text-sm font-serif text-primary mt-2 block relative z-10">Prayer Answered</span>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-[#2c1810] via-[#000000] to-[#1a1a1a]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-[#ffd700]">Choose Payment Method</DialogTitle>
            <DialogDescription className="font-serif text-[#ffd700]/70">
              Select how you'd like to send {formatAmount(currentPrayer?.amount, currentPrayer?.currency)}
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