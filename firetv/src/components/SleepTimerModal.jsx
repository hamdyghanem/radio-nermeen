import React from 'react';
import { Moon, X } from 'lucide-react';
import { useRadio } from '../context/RadioContext';

export default function SleepTimerModal({ isOpen, onClose }) {
  const { startSleepTimer, cancelSleepTimer, timerRemaining } = useRadio();

  if (!isOpen) return null;

  const handleSelect = (mins) => {
    startSleepTimer(mins);
    onClose();
  };

  const handleCancel = () => {
    cancelSleepTimer();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3><Moon size={20} /> مؤقت النوم</h3>
          <button className="close-modal" onClick={onClose}><X size={20} /></button>
        </div>
        <p className="modal-sub">اختر وقتاً لإيقاف الراديو تلقائياً لتستمتعا بنوم هادئ:</p>

        <div className="timer-options">
          <button className="timer-opt" onClick={() => handleSelect(15)}>15 دقيقة</button>
          <button className="timer-opt" onClick={() => handleSelect(30)}>30 دقيقة</button>
          <button className="timer-opt" onClick={() => handleSelect(45)}>45 دقيقة</button>
          <button className="timer-opt" onClick={() => handleSelect(60)}>ساعة واحدة</button>
          <button className="timer-opt" onClick={() => handleSelect(90)}>ساعة ونصف</button>

          {timerRemaining > 0 && (
            <button className="timer-opt cancel-timer" onClick={handleCancel}>
              إلغاء المؤقت الحالي
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
