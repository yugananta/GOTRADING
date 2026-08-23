
export const playSound = (type: 'default' | 'telegram' | 'whatsapp' | 'dana' = 'default') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioCtx.currentTime;

    const playNote = (freq: number, startTime: number, duration: number, gainValue: number = 0.5, oscType: OscillatorType = 'sine') => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      // Add a second oscillator for extra "nyaring" (piercing) effect with higher harmonics
      const osc2 = audioCtx.createOscillator();
      const gainNode2 = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc2.connect(gainNode2);
      gainNode2.connect(audioCtx.destination);
      
      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, startTime);
      
      osc2.type = 'sawtooth'; // Sawtooth adds sharp harmonics for "nyaring" feel
      osc2.frequency.setValueAtTime(freq * 2, startTime); // One octave higher
      
      // Envelope for main oscillator
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(gainValue, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      // Envelope for harmonic oscillator (shorter and sharper)
      gainNode2.gain.setValueAtTime(0, startTime);
      gainNode2.gain.linearRampToValueAtTime(gainValue * 0.3, startTime + 0.005);
      gainNode2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.5);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
      
      osc2.start(startTime);
      osc2.stop(startTime + duration);
    };

    if (type === 'telegram') {
      // Telegram style: High-pitched single energetic ping (even louder)
      playNote(1200, now, 0.4, 0.8, 'sine');
      playNote(1800, now + 0.01, 0.3, 0.5, 'sine');
      return;
    }

    if (type === 'whatsapp') {
      // WhatsApp style: Classic two-note friendly chime (louder and sharper)
      playNote(1108.73, now, 0.4, 0.7, 'sine'); // C#6
      playNote(1318.51, now + 0.08, 0.5, 0.6, 'sine'); // E6
      return;
    }

    if (type === 'dana') {
      // DANA style: Energetic high-frequency ringing (very piercing)
      playNote(2000, now, 0.15, 0.8, 'triangle');
      playNote(1500, now + 0.05, 0.3, 0.6, 'sine');
      return;
    }

    // Default: High-pitched double-chime "ding-ding!" (sharper)
    playNote(1300, now, 0.2, 0.8, 'sine');
    playNote(1600, now + 0.08, 0.4, 0.7, 'triangle');
    
  } catch (e) {
    console.warn("Audio context failed", e);
  }
};
