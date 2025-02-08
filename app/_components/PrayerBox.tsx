'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, X, Heart, Ban } from 'lucide-react';

interface Prayer {
  id: string;
  content: string;
  title: string;
  isOpen: boolean;
}

export default function PrayerBox() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [newPrayer, setNewPrayer] = useState('');
  const [title, setTitle] = useState('');
  const [currentPrayer, setCurrentPrayer] = useState<Prayer | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrayer.trim() || !title.trim()) return;

    const prayer: Prayer = {
      id: Math.random().toString(36).substr(2, 9),
      content: newPrayer,
      title: title,
      isOpen: false
    };

    setPrayers([...prayers, prayer]);
    setNewPrayer('');
    setTitle('');
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
    
    setPrayers(prayers.map(p => 
      p.id === currentPrayer.id 
        ? { ...p, isOpen: true }
        : p
    ));
    setCurrentPrayer(null);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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
          </div>
          <Button type="submit" className="w-full">
            <Mail className="mr-2 h-4 w-4" />
            Submit Prayer
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Prayer Box</h3>
            <Button onClick={handleOpenPrayer} variant="outline">
              Open a Prayer
            </Button>
          </div>

          <AnimatePresence>
            {currentPrayer && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
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
                  <div className="flex gap-2">
                    <Button onClick={() => handleAnswer('accept')} className="flex-1">
                      <Heart className="mr-2 h-4 w-4" />
                      I'll Pray
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
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <Card className={`p-4 ${prayer.isOpen ? 'bg-secondary/50' : 'bg-primary/5'}`}>
                  <Mail className={`h-6 w-6 mb-2 ${prayer.isOpen ? 'text-primary/50' : 'text-primary'}`} />
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
    </div>
  );
} 