import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  ScanQrCode, 
  UserPlus, 
  LogOut, 
  LogIn, 
  User as UserIcon,
  Plus,
  Minus,
  Search,
  Trash2,
  X,
  Menu
} from 'lucide-react';
import { 
  db, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  addDoc,
  deleteDoc,
  getDocs,
  handleFirestoreError,
  OperationType
} from './lib/firebase';
import { Student } from './types';
import { Html5QrcodeScanner } from 'html5-qrcode';

// --- Components ---

const Leaderboard = ({ students, isAdmin, onEditStudent }: { students: Student[], isAdmin: boolean, onEditStudent: (s: Student) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-bold flex items-center gap-3 text-slate-800">
          <span className="w-2 h-6 bg-accent rounded-full"></span>
          لوحة المتصدرين
        </h2>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="بحث عن طالب..."
            className="pr-10 bg-white border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-white px-4 py-1.5 rounded-full border border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wide text-center">
          تحديث لحظي
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {filteredStudents.map((student, index) => (
          <motion.div
            key={student.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.01 }}
            className={index === 0 && !searchTerm ? 'rank-1-card' : 'modern-card flex items-center justify-between group cursor-default shadow-md hover:shadow-lg transition-all'}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg ${
                index === 0 && !searchTerm ? 'bg-white/20 text-white' : 
                index === 1 ? 'bg-yellow-100 text-yellow-700' : 
                index === 2 ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-400'
              }`}>
                {index + 1}
              </div>
              <div className={`w-10 h-10 rounded-full border-2 ${index === 0 && !searchTerm ? 'bg-white/30 border-white/50' : 'bg-slate-100 border-slate-200'}`}></div>
              <div className="flex items-center gap-2">
                <div>
                  <p className={`font-bold ${index === 0 && !searchTerm ? 'text-lg' : 'text-slate-700'}`}>{student.name}</p>
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${index === 0 && !searchTerm ? 'text-red-100' : 'text-slate-400'}`}>
                    {index === 0 && !searchTerm ? 'المركز الأول' : (student.grade || 'المستوى العام')}
                  </p>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => onEditStudent(student)}
                    className={`p-1.5 rounded-full transition-all active:scale-90 ${index === 0 && !searchTerm ? 'bg-white/20 hover:bg-white/40 text-white' : 'bg-primary/10 hover:bg-primary text-slate-900 ml-2'}`}
                    title="تعديل النقاط السريع"
                  >
                    <Plus size={16} strokeWidth={3} />
                  </button>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className={`font-black ${index === 0 && !searchTerm ? 'text-3xl' : 'text-xl text-slate-800'}`}>
                {student.points.toLocaleString()}
              </p>
              <p className={`text-[10px] font-bold ${index === 0 && !searchTerm ? 'text-red-100' : 'text-slate-400'}`}>
                نقطة إجمالية
              </p>
            </div>
          </motion.div>
        ))}
        {filteredStudents.length === 0 && (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <p className="text-slate-400 font-bold">لم يتم العثور على نتائج للبحث.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminActions = ({ 
  onAddStudent, 
  onOpenScanner,
  onResetPoints
}: { 
  onAddStudent: () => void, 
  onOpenScanner: () => void,
  onResetPoints: () => void
}) => (
  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h3 className="font-bold text-lg">ماسح الباركود (QR)</h3>
        <span className="px-2 py-1 bg-red-500 rounded text-[10px] uppercase font-bold animate-pulse">نشط</span>
      </div>
      <div className="aspect-video w-full bg-slate-800 rounded-xl relative overflow-hidden flex items-center justify-center border-2 border-white/20">
        <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-primary"></div>
        <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-primary"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-primary"></div>
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-primary"></div>
        <div className="text-center">
          <ScanQrCode className="w-12 h-12 text-white/20 mx-auto mb-2" />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">جاهز للمسح الضوئي</p>
        </div>
      </div>
      <button 
        onClick={onOpenScanner} 
        className="btn-primary w-full py-4 text-sm font-black shadow-lg shadow-primary/20 active:scale-95 transition-all"
      >
        تفعيل الكاميرا
      </button>
    </div>

    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-5 flex-1">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="font-bold text-slate-800 text-lg text-right">تسجيل سريع</h3>
          <p className="text-xs font-bold text-slate-400 mt-1 text-right">إضافة متسابق جديد للقاعدة</p>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center py-6 text-center">
          <UserPlus size={48} className="text-slate-100 mb-4" />
          <p className="text-sm text-slate-400 font-medium mb-6">يمكنك إضافة بيانات الطالب يدوياً وتوليد كود المعرف الخاص به.</p>
          <button 
            onClick={onAddStudent} 
            className="w-full border-2 border-slate-100 text-slate-600 py-3 rounded-xl font-black text-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            فتح نموذج التسجيل
          </button>
        </div>
      </div>
      
      <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex items-center justify-between">
        <div className="text-right">
          <p className="text-xs font-black text-red-600">تصفير النتائج</p>
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">مسح جميع النقاط للكل</p>
        </div>
        <button 
          onClick={onResetPoints}
          className="bg-white border border-red-200 text-red-500 px-4 py-2 rounded-lg text-xs font-black hover:bg-red-50 transition-all active:scale-90"
        >
          تصفير الكل
        </button>
      </div>
    </div>
  </div>
);

const ScannerModal = ({ onClose, onScanSuccess }: { onClose: () => void, onScanSuccess: (decodedText: string) => void }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scannerRef.current.render(
      (decodedText) => {
        onScanSuccess(decodedText);
        if (scannerRef.current) scannerRef.current.clear();
      },
      (error) => {
        // console.warn(error);
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-black/10 rounded-full text-black">
          <X size={24} />
        </button>
        <div className="p-6 text-center">
          <h3 className="text-xl font-bold mb-4 text-black">امسح كود الطالب</h3>
          <div id="reader" className="w-full"></div>
        </div>
      </div>
    </motion.div>
  );
};

const AddStudentModal = ({ onClose, onAdd }: { onClose: () => void, onAdd: (s: Partial<Student>) => void }) => {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');

  const generateQRCode = () => {
    return 'ST-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onAdd({ 
      name, 
      grade, 
      points: 0, 
      qrCode: generateQRCode() 
    });
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
    >
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-10 sm:pb-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">إضافة طالب جديد</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1 mr-1 text-slate-500 uppercase tracking-wider">اسم الطالب</label>
            <input 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="أدخل الاسم الثلاثي"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 mr-1 text-slate-500 uppercase tracking-wider">اسم الصف / المرحلة</label>
            <select 
              value={grade}
              onChange={e => setGrade(e.target.value)}
              required
            >
              <option value="">اختر المرحلة</option>
              <option value="المرحلة الابتدائية">المرحلة الابتدائية</option>
              <option value="المرحلة المتوسطة">المرحلة المتوسطة</option>
              <option value="المرحلة الثانوية">المرحلة الثانوية</option>
            </select>
          </div>
          <p className="text-[10px] text-slate-400 font-bold px-2">سيتم توليد كود الطالب (QR) تلقائياً عند الحفظ.</p>
          <button type="submit" className="w-full btn-primary mt-4">
            حفظ البيانات وتوليد الرمز
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

const StudentActionModal = ({ student, onClose, onUpdatePoints, onDelete }: { 
  student: Student, 
  onClose: () => void, 
  onUpdatePoints: (id: string, newPoints: number) => void,
  onDelete: (s: Student) => void
}) => {
  const [pointsChange, setPointsChange] = useState(5);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl"
      >
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
            <X size={24} />
          </button>
        </div>
        <div className="w-20 h-20 bg-slate-50 text-slate-200 mx-auto rounded-full flex items-center justify-center mb-4 border-2 border-slate-100 shadow-inner">
          <UserIcon size={40} />
        </div>
        <h3 className="text-2xl font-bold text-slate-800">{student.name}</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{student.grade || 'طالب'}</p>
        <p className="text-[10px] bg-slate-100 text-slate-500 rounded px-2 py-1 inline-block mt-2 font-mono">{student.qrCode}</p>
        
        <div className="bg-slate-50 rounded-2xl p-6 my-6 border border-slate-100">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">الرصيد الحالي</p>
          <p className="text-6xl font-black text-accent">{student.points}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[5, 10, 20].map(val => (
            <button 
              key={val}
              onClick={() => onUpdatePoints(student.id, student.points + val)}
              className="bg-primary/10 hover:bg-primary text-slate-900 py-3 rounded-xl font-black transition-all active:scale-95 border border-primary/20"
            >
              +{val}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mb-8 bg-slate-100/50 p-4 rounded-2xl border border-slate-100">
          <button 
            onClick={() => onUpdatePoints(student.id, student.points - pointsChange)}
            className="w-12 h-12 bg-white text-slate-400 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 shadow-sm transition-all active:scale-90"
          >
            <Minus size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            <input 
              type="number"
              value={pointsChange}
              onChange={e => setPointsChange(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-16 text-center text-xl font-black bg-white border-none shadow-sm h-12"
            />
          </div>

          <button 
            onClick={() => onUpdatePoints(student.id, student.points + pointsChange)}
            className="w-12 h-12 bg-primary text-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transition-all active:scale-90"
          >
            <Plus size={20} />
          </button>
        </div>
        
        <div className="flex flex-col gap-2">
          <button onClick={onClose} className="w-full py-4 text-slate-400 text-sm font-bold hover:bg-slate-50 rounded-xl transition-colors">
            إغلاق النافذة
          </button>
          <button 
            onClick={() => {
              onDelete(student);
            }} 
            className="w-full py-2 text-red-300 text-[10px] font-bold hover:text-red-500 transition-colors uppercase tracking-widest mt-4"
          >
            حذف المتسابق من النظام
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Login states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Modal states
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  useEffect(() => {
    // Check local storage for session
    const savedAdmin = localStorage.getItem('comp_admin_name');
    if (savedAdmin) {
      setIsAdmin(true);
      setAdminName(savedAdmin);
    }

    // Real-time leaderboard
    const studentCollection = 'students';
    const q = query(collection(db, studentCollection), orderBy('points', 'desc'));
    const unsubStudents = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
      setStudents(data);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, studentCollection);
      setIsLoading(false);
    });

    return () => {
      unsubStudents();
    };
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (loginPassword === '12357') {
      setIsAdmin(true);
      setAdminName(loginUsername || 'المشرف');
      localStorage.setItem('comp_admin_name', loginUsername || 'المشرف');
      setLoginError(false);
      setIsLoginModalOpen(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setAdminName('');
    localStorage.removeItem('comp_admin_name');
  };

  const addStudent = async (studentData: Partial<Student>) => {
    if (!isAdmin) return;
    const path = 'students';
    try {
      await addDoc(collection(db, path), {
        ...studentData,
        points: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const updatePoints = async (id: string, newPoints: number) => {
    if (!isAdmin) return;
    const path = `students/${id}`;
    try {
      await updateDoc(doc(db, path), {
        points: Math.max(0, newPoints),
        updatedAt: new Date().toISOString()
      });
      setSelectedStudent(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteStudent = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'students', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `students/${id}`);
    }
  };

  const resetAllPoints = async () => {
    if (!isAdmin) return;
    if (!confirm('هل أنت متأكد من تصفير نقاط جميع المتسابقين؟ لا يمكن التراجع عن هذه الخطوة.')) return;
    
    try {
      const studentCollection = 'students';
      const snapshot = await getDocs(collection(db, studentCollection));
      const promises = snapshot.docs.map(studentDoc => 
        updateDoc(doc(db, studentCollection, studentDoc.id), {
          points: 0,
          updatedAt: new Date().toISOString()
        })
      );
      await Promise.all(promises);
      alert('تم تصفير جميع النقاط بنجاح!');
    } catch (err) {
      console.error("Failed to reset points", err);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    setIsScanning(false);
    const student = students.find(s => s.qrCode === decodedText);
    if (student) {
      setSelectedStudent(student);
    } else {
      alert("لم يتم العثور على طالب بهذا الكود: " + decodedText);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-10 font-sans" dir="rtl">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-6xl mb-6"
        >
          🏆
        </motion.div>
        <p className="text-gray-400 font-bold animate-pulse">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20" dir="rtl">
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-slate-100 z-30 px-8 h-16 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div id="header-logo-container" className="w-14 h-14 flex items-center justify-center p-1">
            <img 
              id="header-logo" 
              src="/logo.png" 
              alt="صدارة فكرة" 
              className="w-full h-full object-contain drop-shadow-sm"
              onError={(e) => {
                // Fallback to a placeholder if logo.png is not found
                e.currentTarget.src = "https://api.dicebear.com/7.x/identicon/svg?seed=fekra";
              }}
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 id="header-title" className="text-xl font-black tracking-tight text-slate-800 bg-linear-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">صدارة فكرة</h1>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin ? (
            <>
              <div className="text-left ml-4 hidden sm:block">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-left">المسؤول الحالي</p>
                <p className="text-sm font-bold text-slate-700">{adminName}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-red-500 rounded text-[10px] uppercase font-bold text-white">نشط</span>
                <button onClick={handleLogout} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                  <LogOut size={20} />
                </button>
              </div>
            </>
          ) : (
            <button 
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              <LogIn size={16} />
              <span>تسجيل دخول المسؤول</span>
            </button>
          )}
        </div>
      </header>

      <main className="pt-24 px-6 max-w-4xl mx-auto flex flex-col gap-8">
        <div className="text-center mb-4">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black text-slate-800"
          >
            نقاط الموهوبين
          </motion.h2>
          <p className="text-slate-400 font-bold text-sm mt-2 flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
            تحديث مباشر وتلقائي للنتائج
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Leaderboard 
            students={students} 
            isAdmin={isAdmin} 
            onEditStudent={(s) => setSelectedStudent(s)} 
          />
          
          {isAdmin && (
            <AdminActions 
              onAddStudent={() => setIsAddingStudent(true)} 
              onOpenScanner={() => setIsScanning(true)}
              onResetPoints={resetAllPoints}
            />
          )}
        </div>

        <footer className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-widest gap-4">
           <div>صدارة فكرة © 2026</div>
           <div className="flex items-center gap-2">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
             البيانات مزامنة لحظياً
           </div>
        </footer>

          <AnimatePresence>
            {studentToDelete && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-red-50"
                >
                  <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trash2 size={40} />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-2">تأكيد الحذف</h3>
                  <p className="text-sm text-slate-400 font-bold mb-8">
                    هل أنت متأكد من حذف المتسابق <span className="text-red-500">"{studentToDelete.name}"</span>؟ سيتم مسح نقاطه وسجله نهائياً ولا يمكن التراجع.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => {
                        deleteStudent(studentToDelete.id);
                        setStudentToDelete(null);
                        setSelectedStudent(null);
                      }}
                      className="w-full bg-red-500 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-red-200 active:scale-95 transition-all"
                    >
                      نعم، احذف السجل
                    </button>
                    <button 
                      onClick={() => setStudentToDelete(null)}
                      className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
            {isLoginModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl relative"
              >
                <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-50 rounded-full">
                  <X size={20} />
                </button>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <LogIn size={32} />
                  </div>
                  <h3 className="text-xl font-black text-slate-800">دخول المسؤول</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">يرجى إدخال بيانات الاعتماد</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2 mr-1 text-right">اسم المسؤول</label>
                    <input 
                      type="text"
                      placeholder="أدخل الاسم"
                      value={loginUsername}
                      onChange={e => setLoginUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2 mr-1 text-right">كلمة المرور</label>
                    <input 
                      type="password"
                      placeholder="•••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  {loginError && <p className="text-accent text-[10px] font-bold text-right">كلمة المرور غير صحيحة.</p>}
                  <button 
                    type="submit"
                    className="btn-primary w-full flex items-center justify-center gap-4 py-4 text-sm font-black shadow-xl shadow-primary/30 mt-6"
                  >
                    <span>تسجيل الدخول</span>
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
          {isScanning && (
            <ScannerModal 
              onClose={() => setIsScanning(false)} 
              onScanSuccess={handleScanSuccess} 
            />
          )}
          {isAddingStudent && (
            <AddStudentModal 
              onClose={() => setIsAddingStudent(false)} 
              onAdd={addStudent} 
            />
          )}
          {selectedStudent && (
            <StudentActionModal 
              student={selectedStudent} 
              onClose={() => setSelectedStudent(null)} 
              onUpdatePoints={updatePoints} 
              onDelete={(s) => setStudentToDelete(s)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
