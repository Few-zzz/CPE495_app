import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Snowflake, 
  LayoutGrid, 
  Users, 
  DoorOpen, 
  Clock, 
  CheckCircle2, 
  Inbox,
  ThermometerSnowflake,
  Smile,
  ThermometerSun,
  MapPin
} from 'lucide-react';
import { sendVoteResult } from './firebase.ts';

type ZoneId = 'A' | 'B' | 'C' | 'D';
type Mood = 'cold' | 'fine' | 'hot';
type Screen = 'select' | 'main';

interface ZoneData {
  max: number;
  booked: number;
  icon: ReactNode;
  name: string;
  desc: string;
}

const INITIAL_ZONES: Record<ZoneId, ZoneData> = {
  A: { max: 20, booked: 12, icon: <Snowflake className="w-5 h-5" />, name: 'Zone A', desc: '(ใต้แอร์)' },
  B: { max: 20, booked: 5, icon: <LayoutGrid className="w-5 h-5" />, name: 'Zone B', desc: '(ริมหน้าต่าง)' },
  C: { max: 20, booked: 20, icon: <Users className="w-5 h-5" />, name: 'Zone C', desc: '(กลางห้อง)' },
  D: { max: 20, booked: 2, icon: <DoorOpen className="w-5 h-5" />, name: 'Zone D', desc: '(ใกล้ประตู)' },
};

const CYCLE_DURATION = 15;

export default function App() {
  const [screen, setScreen] = useState<Screen>('select');
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(null);
  const [myBookedZone, setMyBookedZone] = useState<ZoneId | null>(null);
  const [zones, setZones] = useState(INITIAL_ZONES);
  
  // Voting State
  const [cycleTimeRemaining, setCycleTimeRemaining] = useState(CYCLE_DURATION);
  const [currentCycleNumber, setCurrentCycleNumber] = useState(1);
  const [tempSelectedMood, setTempSelectedMood] = useState<Mood | null>(null);
  const [finalRecordedMood, setFinalRecordedMood] = useState<Mood | null>(null);
  const [isCycleActive, setIsCycleActive] = useState(false);
  const [voteSubmitMessage, setVoteSubmitMessage] = useState<string | null>(null);

  // Form State
  const [location, setLocation] = useState({ bldg: 'ตึก 05', floor: 'ชั้น 09', room: '03' });

  const startVotingCycle = useCallback(() => {
    setCycleTimeRemaining(CYCLE_DURATION);
    setFinalRecordedMood(null);
    setTempSelectedMood(null);
    setIsCycleActive(true);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (screen === 'main' && isCycleActive && cycleTimeRemaining > 0) {
      interval = setInterval(() => {
        setCycleTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (cycleTimeRemaining === 0 && isCycleActive) {
      setIsCycleActive(false);
      // Process results
      setTimeout(() => {
        setCurrentCycleNumber((prev) => prev + 1);
        startVotingCycle();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [screen, isCycleActive, cycleTimeRemaining, startVotingCycle]);

  const handleSelectZone = (zoneId: ZoneId) => {
    if (zones[zoneId].booked >= zones[zoneId].max && myBookedZone !== zoneId) {
      alert("ขออภัยครับ โซนนี้ที่นั่งเต็มแล้ว 🙇‍♂️");
      return;
    }
    setSelectedZone(zoneId);
  };

  const handleConfirmSeat = () => {
    if (!selectedZone) return;
    
    if (myBookedZone !== selectedZone) {
      setZones(prev => {
        const next = { ...prev };
        if (myBookedZone) next[myBookedZone].booked -= 1;
        next[selectedZone].booked += 1;
        return next;
      });
      setMyBookedZone(selectedZone);
    }
    
    setScreen('main');
    startVotingCycle();
  };

  const handleLeaveRoom = () => {
    if (window.confirm("คุณต้องการออกจากห้องเรียนและคืนที่นั่งใช่หรือไม่?")) {
      if (myBookedZone) {
        setZones(prev => ({
          ...prev,
          [myBookedZone]: { ...prev[myBookedZone], booked: prev[myBookedZone].booked - 1 }
        }));
        setMyBookedZone(null);
      }
      setSelectedZone(null);
      setScreen('select');
      setIsCycleActive(false);
    }
  };

  const handleSubmitVote = async () => {
    if (!tempSelectedMood || cycleTimeRemaining <= 0 || !selectedZone) return;

    setFinalRecordedMood(tempSelectedMood);
    setVoteSubmitMessage('กำลังส่งผลโหวตไปยัง Firebase...');

    const success = await sendVoteResult(selectedZone, tempSelectedMood, location, currentCycleNumber);
    setVoteSubmitMessage(success ? 'ส่งผลโหวตขึ้น Firebase สำเร็จ ✅' : 'ส่งผลโหวตขึ้น Firebase ไม่สำเร็จ ❌');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4 font-sans">
      <div className="w-full max-w-[390px] h-[844px] bg-[#f4f7f6] rounded-[40px] shadow-[0_20px_40px_rgba(0,0,0,0.1),_inset_0_0_0_10px_#ffffff,_inset_0_0_0_11px_#e2e8f0] relative overflow-hidden flex flex-col">
        
        <AnimatePresence mode="wait">
          {screen === 'select' ? (
            <motion.div 
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col p-6 pt-10 overflow-y-auto"
            >
              <h1 className="text-2xl font-bold text-text-dark mb-1">Hello Student 👋</h1>
              <p className="text-sm text-text-gray mb-6">ระบุตำแหน่งที่นั่งของคุณ</p>

              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">ตึกอาคาร</label>
                    <select 
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-text-dark font-semibold text-sm outline-none appearance-none text-center shadow-sm"
                      value={location.bldg}
                      onChange={(e) => setLocation({...location, bldg: e.target.value})}
                    >
                      <option>ตึก 05</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">ชั้น</label>
                    <select 
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-text-dark font-semibold text-sm outline-none appearance-none text-center shadow-sm"
                      value={location.floor}
                      onChange={(e) => setLocation({...location, floor: e.target.value})}
                    >
                      <option>ชั้น 09</option>
                      <option>ชั้น 06</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-text-gray uppercase tracking-wider">ห้องเรียน</label>
                    <select 
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-text-dark font-semibold text-sm outline-none appearance-none text-center shadow-sm"
                      value={location.room}
                      onChange={(e) => setLocation({...location, room: e.target.value})}
                    >
                      <option value="03">ห้อง 03</option>
                      <option value="09">ห้อง 09</option>
                    </select>
                  </div>
                </div>
              </div>

              <h2 className="text-base font-semibold text-text-dark mb-3">เลือกโซนที่นั่ง</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {(Object.entries(zones) as [ZoneId, ZoneData][]).map(([id, data]) => {
                  const available = data.max - data.booked;
                  const isFull = available <= 0 && myBookedZone !== id;
                  const isSelected = selectedZone === id;

                  /*return (
                    <button
                      key={id}
                      onClick={() => handleSelectZone(id)}
                      disabled={isFull}
                      className={`
                        relative flex flex-col items-center p-4 rounded-3xl transition-all duration-200 border-2 text-center shadow-[0_4px_6px_rgba(0,0,0,0.02)]
                        ${isSelected ? 'border-primary-blue bg-[#eff6ff]' : 'border-slate-200 bg-white'}
                        ${isFull ? 'opacity-60 cursor-not-allowed bg-slate-100' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_15px_rgba(0,0,0,0.05)] active:scale-95'}
                      `}
                    >
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors
                        ${isSelected ? 'bg-primary-blue text-white' : 'bg-slate-100 text-slate-600'}
                      `}>
                        {data.icon}
                      </div>
                      <span className="font-bold text-sm text-text-dark">{data.name}</span>
                      <span className="text-[10px] font-medium text-blue-400 mb-2">{data.desc}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-text-gray">
                        <div className={`w-1.5 h-1.5 rounded-full ${isFull ? 'bg-[#ff8b94]' : 'bg-[#a8e6cf]'}`} />
                        <span>{isFull ? 'เต็ม (0 ที่นั่ง)' : `ว่าง ${available} ที่นั่ง`}</span>
                      </div>
                    </button>
                  );*/

                return (
                  <button
                    key={id}
                    onClick={() => handleSelectZone(id)}
                    disabled={isFull}
                    className={`
                      relative flex flex-col items-center p-4 rounded-3xl transition-all duration-200 border-2 text-center shadow-[0_4px_6px_rgba(0,0,0,0.02)]
                      ${isSelected ? 'border-sky-300 bg-sky-50' : 'border-slate-100 bg-white'}
                      ${isFull ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_15px_rgba(0,0,0,0.05)] active:scale-95'}
                  `}
  >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors
                    ${isSelected ? 'bg-sky-400 text-white' : 'bg-slate-100 text-slate-500'}
                    `}>
                    {data.icon}
                  </div>

                  <span className="font-bold text-sm text-slate-700">{data.name}</span>
                  <span className="text-[10px] font-medium text-sky-500/80 mb-2">{data.desc}</span>

 
                  <div className={`
                    px-2.5 py-1 rounded-full text-[9px] font-bold flex items-center gap-1.5
                    ${isFull ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'}
                   `}>
                  <div className={`w-1 h-1 rounded-full ${isFull ? 'bg-slate-400' : 'bg-emerald-500'} ${!isFull && 'animate-pulse'}`} />
                  <span>{isFull ? 'เต็ม (0 ที่นั่ง)' : `ว่าง ${available} ที่นั่ง`}</span>
                  </div>
                  </button>
                  );


                })}
              </div>

              <button 
                onClick={handleConfirmSeat}
                disabled={!selectedZone}
                className="w-full py-4 bg-primary-blue text-white rounded-2xl font-bold text-lg shadow-[0_4px_10px_rgba(37,99,235,0.3)] transition-all active:scale-95 disabled:bg-slate-300 disabled:text-slate-100 disabled:shadow-none mt-auto"
              >
                ยืนยันที่นั่ง (Confirm)
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="main"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col p-6 pt-10 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 bg-white p-2.5 rounded-2xl shadow-[0_2px_5px_rgba(0,0,0,0.02)] border border-slate-200">
                <button 
                  onClick={handleLeaveRoom}
                  className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-text-dark active:scale-90 transition-transform"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 px-3">
                  <div className="flex items-center gap-1 text-[13px] font-bold text-text-dark">
                    <MapPin className="w-3 h-3 text-primary-blue" />
                    <span>{location.bldg} | {location.floor} | ห้อง {location.room}</span>
                  </div>
                </div>
                <div className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors
                  ${cycleTimeRemaining > 0 ? 'bg-white text-text-dark border-slate-200' : 'bg-slate-100 text-text-gray border-slate-200'}
                `}>
                  <Clock className={`w-3 h-3 ${cycleTimeRemaining > 0 ? 'text-primary-blue' : ''}`} />
                  <span>{cycleTimeRemaining > 0 ? formatTime(cycleTimeRemaining) : 'ปิดรับโหวต'}</span>
                </div>
              </div>

              <div className="flex flex-col items-center mb-8">
                <div className="w-36 h-36 bg-white rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.05),_inset_0_0_0_8px_#f1f5f9] flex flex-col items-center justify-center border border-slate-200">
                  <span className="text-5xl font-black text-text-dark leading-none">{selectedZone}</span>
                  <span className="text-[10px] font-bold text-text-gray uppercase tracking-widest mt-2">Your Seat Zone</span>
                </div>
              </div>

              <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_6px_rgba(0,0,0,0.02)] border border-slate-200 mb-4">
                <h3 className="text-sm font-bold text-text-dark text-center mb-4">
                  คุณรู้สึกอย่างไรบ้าง?
                </h3>
                <div className="flex justify-between gap-2">
                  <MoodButton 
                    mood="cold" 
                    icon={<ThermometerSnowflake className="w-7 h-7" />} 
                    label="หนาวจัด" 
                    active={tempSelectedMood === 'cold'} 
                    disabled={cycleTimeRemaining <= 0}
                    onClick={() => setTempSelectedMood('cold')}
                  />
                  <MoodButton 
                    mood="fine" 
                    icon={<Smile className="w-7 h-7" />} 
                    label="พอดี" 
                    active={tempSelectedMood === 'fine'} 
                    disabled={cycleTimeRemaining <= 0}
                    onClick={() => setTempSelectedMood('fine')}
                  />
                  <MoodButton 
                    mood="hot" 
                    icon={<ThermometerSun className="w-7 h-7" />} 
                    label="ร้อนไป" 
                    active={tempSelectedMood === 'hot'} 
                    disabled={cycleTimeRemaining <= 0}
                    onClick={() => setTempSelectedMood('hot')}
                  />
                </div>
              </div>

              {/* Status Card */}
              <AnimatePresence>
                {(finalRecordedMood || cycleTimeRemaining === 0) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`
                      p-4 rounded-2xl border border-slate-200 border-l-4 shadow-[0_10px_20px_rgba(0,0,0,0.05)] mb-4
                      ${cycleTimeRemaining === 0 
                        ? 'bg-white border-l-fine' 
                        : 'bg-white border-l-primary-blue'}
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {cycleTimeRemaining === 0 ? (
                        <CheckCircle2 className="w-5 h-5 text-fine" />
                      ) : (
                        <Inbox className="w-5 h-5 text-text-gray" />
                      )}
                      <span className={`text-sm font-bold ${cycleTimeRemaining === 0 ? 'text-fine' : 'text-text-dark'}`}>
                        {cycleTimeRemaining === 0 ? 'ส่งข้อมูลไปยัง Dashboard เรียบร้อย' : 'บันทึกข้อมูลแล้ว'}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-gray leading-relaxed">
                      {cycleTimeRemaining === 0 
                        ? `ข้อมูลของ Zone ${selectedZone} ถูกส่งไปยังระบบส่วนกลางเรียบร้อยแล้ว Dashboard จะทำการวิเคราะห์และสั่งการอุปกรณ์ต่อไป`
                        : 'ระบบบันทึกความรู้สึกของคุณแล้ว จะทำการส่งข้อมูลไปยัง Dashboard ส่วนกลาง เมื่อหมดรอบเวลาการโหวตปัจจุบัน...'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-auto space-y-3">
                <button 
                  onClick={handleSubmitVote}
                  disabled={!tempSelectedMood || cycleTimeRemaining <= 0 || !!finalRecordedMood}
                  className="w-full py-4 bg-primary-blue text-white rounded-2xl font-bold text-lg shadow-[0_4px_10px_rgba(37,99,235,0.3)] transition-all active:scale-95 disabled:bg-slate-300 disabled:text-slate-100 disabled:shadow-none"
                >
                  {finalRecordedMood ? 'ข้อมูลถูกบันทึกแล้ว ✓' : cycleTimeRemaining <= 0 ? 'ประมวลผลเสร็จสิ้น' : 'ส่งผลโหวต'}
                </button>
                {voteSubmitMessage && (
                  <div className="text-sm text-center text-slate-600">{voteSubmitMessage}</div>
                )}
                <button 
                  onClick={handleLeaveRoom}
                  className="w-full py-3 bg-transparent text-hot border-2 border-hot rounded-2xl font-bold text-sm transition-all active:scale-95 active:bg-red-50"
                >
                  ออกจากห้อง (คืนที่นั่ง)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

function MoodButton({ 
  mood, 
  icon, 
  label, 
  active, 
  onClick, 
  disabled 
}: { 
  mood: Mood; 
  icon: ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void;
  disabled: boolean;
}) {
  const activeBg = {
    cold: 'bg-cold text-white border-sky-700 shadow-[0_4px_12px_rgba(14,165,233,0.4)]',
    fine: 'bg-fine text-white border-emerald-700 shadow-[0_4px_12px_rgba(16,185,129,0.4)]',
    hot: 'bg-hot text-white border-rose-700 shadow-[0_4px_12px_rgba(244,63,94,0.4)]',
  };

  const activeLabel = {
    cold: 'text-cold',
    fine: 'text-fine',
    hot: 'text-hot',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-2 flex-1 group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className={`
        w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all duration-300 border-2
        ${active ? activeBg[mood] : 'bg-slate-100 text-slate-400 border-transparent'}
        ${active ? 'scale-105' : ''}
        ${!disabled && !active ? 'group-active:scale-90' : ''}
      `}>
        {icon}
      </div>
      <span className={`text-[11px] font-bold transition-colors ${active ? activeLabel[mood] : 'text-text-gray'}`}>
        {label}
      </span>
    </button>
  );
}
