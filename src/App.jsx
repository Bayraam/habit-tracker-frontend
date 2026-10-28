import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { api } from './api';
import { Flame, LogOut, Plus, RefreshCw, Trophy, ShoppingCart, ShieldCheck, CheckCircle, X } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/api';

function App() {
  const [habits, setHabits] = useState([]);
  const [selectedHabitForLog, setSelectedHabitForLog] = useState(null);

  // Provjeravamo localStorage pri pokretanju
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('currentUser'));
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Forma za login/register state
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authEmail, setAuthEmail] = useState('');


  const [leaderboard, setLeaderboard] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [habitType, setHabitType] = useState('BOOLEAN');
  const [frequency, setFrequency] = useState('DAILY');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');

  // State za praćenje trenutne teme
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      loadHabits();
      loadLeaderboard();
    }
  }, [isLoggedIn]);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegisterMode ? '/users/register' : '/users/login';
    const payload = isRegisterMode
      ? { username: authUsername, email: authEmail, password: authPassword }
      : { username: authUsername, password: authPassword };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        toast.error('Greška: ' + errorMsg);
        return;
      }

      const userData = await response.json();
      setCurrentUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setIsLoggedIn(true);
      toast.success(isRegisterMode ? 'Uspješna registracija!' : 'Uspješna prijava!');
    } catch (error) {
      console.error('Greška pri komunikaciji sa serverom:', error);
      toast.error('Ne mogu se povezati sa serverom.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setIsLoggedIn(false);
  };

  const loadHabits = async () => {
    if (!currentUser) return;
    try {
      const response = await api.getHabits(currentUser.id);
      const data = await response.json();
      if (Array.isArray(data)) {
        setHabits(data);
      } else if (data && Array.isArray(data.content)) {
        setHabits(data.content);
      } else {
        setHabits([]);
      }
    } catch (err) {
      console.error("Greška pri učitavanju navika:", err);
      setHabits([]);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/leaderboard`);
      if (res.ok) {
        const users = await res.json();
        setLeaderboard(users);
        if (currentUser) {
          const me = users.find(u => u.id === currentUser.id);
          if (me) {
            setCurrentUser(me);
            localStorage.setItem('currentUser', JSON.stringify(me));
          }
        }
      }
    } catch (e) {
      console.error('Greška pri učitavanju rang liste:', e);
    }
  };

  const handleCreateHabit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning("Unesite naziv navike!");
      return;
    }

    // Ovdje mapiramo BOOLEAN u YES_NO jer baza podataka ima taj constraint
    let finalHabitType = habitType;
    if (finalHabitType === 'BOOLEAN') {
      finalHabitType = 'YES_NO';
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      habitType: finalHabitType,
      frequency: frequency,
      targetValue: habitType === 'QUANTITATIVE' && targetValue !== "" ? parseFloat(targetValue) : null,
      unit: habitType === 'QUANTITATIVE' ? unit.trim() : null,
      active: true
    };

    try {
      const response = await api.createHabit(currentUser.id, payload);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Greška sa servera pri kreiranju:", errorText);
        throw new Error(errorText || "Greška pri kreiranju navike.");
      }

      toast.success("Navika uspješno kreirana!");

      setTitle('');
      setDescription('');
      setHabitType('BOOLEAN');
      setFrequency('DAILY');
      setTargetValue('');
      setUnit('');
      setShowAddModal(false);

      loadHabits(); // Učitava listu da se odmah prikaže na ekranu
    } catch (err) {
      console.error("Catch greška:", err);
      toast.error("Greška: Navika nije spašena na serveru.");
    }
  };

  const handleDeleteHabit = async (habitId) => {
    if (!confirm('Jeste li sigurni da želite izbrisati ovu naviku?')) return;
    try {
      await api.deleteHabit(habitId);
      toast.success("Navika obrisana!");
      loadHabits();
    } catch (err) {
      toast.error("Greška pri brisanju navike.");
    }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHabitForLog) return;

    const formData = new FormData(e.target);
    const loggedValue = formData.get('loggedValue') !== "" ? parseFloat(formData.get('loggedValue')) : null;
    const rating = formData.get('rating') !== "" ? parseInt(formData.get('rating'), 10) : 10;
    const reflection = formData.get('reflection') ? formData.get('reflection').trim() : "";

    const payload = {
      habitId: selectedHabitForLog.id,
      loggedValue: loggedValue,
      rating: rating,
      reflection: reflection
    };

    try {
      const response = await api.logHabit(selectedHabitForLog.id, payload);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Greška sa servera");
      }

      toast.success("Aktivnost uspješno zabilježena!");

      if (selectedHabitForLog.frequency === 'ONCE') {
        await api.deleteHabit(selectedHabitForLog.id);
      }

      setSelectedHabitForLog(null);
      loadHabits();
      loadLeaderboard();
    } catch (err) {
      toast.error("Greška: Navika je možda već zabilježena za danas.");
    }
  };

  const buyStreakFreeze = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/buy-streak-freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        toast.success('Uspješno ste kupili 1x Streak Freeze! 🛡️');
        loadLeaderboard();
      } else {
        const errorMsg = await response.text();
        toast.error('Kupovina nije uspjela: ' + errorMsg);
      }
    } catch (error) {
      toast.error('Došlo je do greške pri povezivanju sa serverom.');
    }
  };

  const getLeagueBadgeColor = (league) => {
    switch ((league || '').toUpperCase()) {
      case 'PLATINUM': return 'bg-yellow-400 text-black';
      case 'SILVER': return 'bg-gray-300 text-black';
      case 'GOLD': return 'bg-amber-400 text-black';
      default: return 'bg-amber-500 text-black';
    }
  };

  // AKO KORISNIK NIJE PRIJAVLJEN, PRIKAŽI LOGIN / REGISTER EKRAN
  if (!isLoggedIn || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full space-y-6">
          <div className="text-center">
            <Flame className="w-10 h-10 text-orange-500 fill-orange-500 mx-auto mb-2" />
            <h2 className="text-2xl font-bold text-gray-800">
              {isRegisterMode ? 'Registracija' : 'Prijava'}
            </h2>
          </div>

          <form onSubmit={handleAuth} className="space-y-4 text-sm">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Korisničko ime</label>
              <input
                type="text"
                className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                required
              />
            </div>

            {isRegisterMode && (
              <div>
                <label className="block font-medium text-gray-700 mb-1">Email adresa</label>
                <input
                  type="email"
                  className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="block font-medium text-gray-700 mb-1">Lozinka</label>
              <input
                type="password"
                className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition"
            >
              {isRegisterMode ? 'Registruj se' : 'Prijavi se'}
            </button>
          </form>

          <div className="text-center text-xs text-gray-600">
            {isRegisterMode ? (
              <p>Već imate račun? <button onClick={() => setIsRegisterMode(false)} className="text-blue-600 font-semibold hover:underline">Prijavite se</button></p>
            ) : (
              <p>Nemate račun? <button onClick={() => setIsRegisterMode(true)} className="text-blue-600 font-semibold hover:underline">Registrujte se</button></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // GLAVNI DASHBOARD KAD JE KORISNIK PRIJAVLJEN
  return (
    <div className={`min-h-screen p-6 transition-colors duration-200 ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <ToastContainer position="top-right" autoClose={3000} />

      <header className="bg-gray-900 text-white px-6 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
          <span>Habit Tracker</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span>Korisnik: <strong>{currentUser.username}</strong></span>
          <span className={`font-bold px-2 py-0.5 rounded text-xs ${getLeagueBadgeColor(currentUser.league)}`}>
            {currentUser.league || 'BRONZE'}
          </span>
          <span className="bg-blue-600 font-bold px-2 py-0.5 rounded text-xs">
            {currentUser.points || 0} XP
          </span>

          {/* Prekidač za temu */}
          {/* Prekidač za temu */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">☀️ Day</span>
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={toggleTheme}
              className="toggle bg-white border-gray-400 checked:bg-black checked:border-black"
            />
            <span className="text-sm font-semibold">🌙 Night</span>
          </div>


          <button
            onClick={handleLogout}
            className="border border-white/40 hover:bg-white/10 px-3 py-1 rounded text-xs flex items-center gap-1 ml-2"
          >
            <LogOut className="w-3 h-3" /> Odjava
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-600 text-white rounded-lg p-5 text-center shadow">
            <p className="text-xs font-semibold uppercase tracking-wider">Ukupno bodova</p>
            <p className="text-3xl font-extrabold mt-1">{currentUser.points || 0}</p>
          </div>

          <div className="bg-amber-400 text-black rounded-lg p-5 text-center shadow">
            <p className="text-xs font-semibold uppercase tracking-wider">Trenutna Liga</p>
            <p className="text-3xl font-black mt-1 uppercase tracking-wide">{currentUser.league || 'BRONZE'}</p>
          </div>

          <div className="bg-cyan-500 text-white rounded-lg p-5 text-center shadow">
            <p className="text-xs font-semibold uppercase tracking-wider">Aktivni Streak Freeze</p>
            <p className="text-2xl font-extrabold mt-1">{currentUser.streakFreezeCount || 0} 🛡️</p>
          </div>
        </div>

        <div className={`rounded-lg p-6 shadow-sm border transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 text-white border-gray-800' : 'bg-white text-gray-900 border-gray-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-2xl font-bold transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Moje Navike</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-md text-sm flex items-center gap-1 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Nova Navika
            </button>
          </div>

          {habits.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">
              Nemate još kreiranih navika. Kliknite na "+ Nova Navika" da dodate prvu!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {habits.map((habit) => {
                const rawType = habit.habitType || habit.type;
                const isQuant = rawType === 'QUANTITATIVE';
                const streakVal = habit.currentStreak ?? habit.streak ?? 0;

                return (
                  <div key={habit.id} className={`p-4 border rounded-lg transition-colors duration-200 flex flex-col justify-between ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'}`}>
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{habit.title}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${isQuant ? 'bg-cyan-100 text-cyan-800' : 'bg-blue-100 text-blue-800'}`}>
                          {isQuant ? 'Kvantitativna' : 'Da / Ne'}
                        </span>
                      </div>
                      {habit.description && <p className="text-xs text-gray-500 mt-0.5">{habit.description}</p>}
                      {isQuant && <p className="text-xs text-muted mt-1">Cilj: {habit.targetValue} {habit.unit || ''}</p>}
                      <p className="text-xs mt-2 font-semibold text-orange-600">🔥 Streak: {streakVal} dana</p>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                      <button
                        onClick={() => setSelectedHabitForLog(habit)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-xs flex items-center justify-center gap-1 transition font-medium"
                      >
                        <CheckCircle className="w-4 h-4" /> Zabilježi napredak
                      </button>
                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg text-xs transition"
                        title="Obriši"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={`rounded-lg p-6 shadow-sm border transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 text-white border-gray-800' : 'bg-white text-gray-900 border-gray-200'}`}>
          <div className="bg-gray-800 text-white px-5 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2 font-semibold">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Rang Lista (Leaderboard)</span>
            </div>
            <button onClick={loadLeaderboard} className="border border-white/30 hover:bg-white/10 text-xs px-2.5 py-1 rounded flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Osveži
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold text-xs">
                <tr>
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Korisnik</th>
                  <th className="py-3 px-4 text-center">Bodovi</th>
                  <th className="py-3 px-4 text-right">Liga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaderboard.map((item, index) => {
                  const isMe = item.id === currentUser.id;
                  return (
                    <tr key={item.id || index} className={isMe ? "bg-blue-100 font-bold text-blue-900" : "hover:bg-gray-50"}>
                      <td className="py-2.5 px-4 text-gray-500">{index + 1}</td>
                      <td className="py-2.5 px-4 font-semibold">{item.username} {isMe ? '(Ti)' : ''}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="bg-blue-600 text-white font-bold text-xs px-2.5 py-0.5 rounded-full">
                          {item.points || 0} XP
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className={`font-bold text-xs px-2.5 py-0.5 rounded ${getLeagueBadgeColor(item.league)}`}>
                          {item.league || 'BRONZE'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`rounded-lg p-6 shadow-sm border transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 text-white border-gray-800' : 'bg-white text-gray-900 border-gray-200'}`}>
          <div className={`flex justify-center items-center gap-2 text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            <ShoppingCart className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            <span>Prodavnica</span>
          </div>

          <div className={`text-sm flex items-center justify-center gap-1 mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <span>Imate:</span>
            <strong className="text-blue-600">{currentUser.streakFreezeCount || 0}</strong>
            <ShieldCheck className="w-4 h-4 text-blue-600 inline" />
            <span>Streak Freeze</span>
          </div>

          <p className={`text-xs max-w-md mx-auto text-center mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
            1x Streak Freeze automatski štiti tvoje streakove u ponoć ako zaboraviš unijeti naviku. Cijena: <strong>15 XP</strong>.
          </p>

          <div className="flex flex-col items-center mt-4">
            <button
              onClick={buyStreakFreeze}
              className="bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs px-6 py-2.5 rounded shadow-sm transition"
            >
              Kupi Streak Freeze (15 XP)
            </button>
          </div>
        </div>
      </main>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl p-6 shadow-xl w-full max-w-md transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 text-white border border-gray-800' : 'bg-white text-gray-900'}`}>
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className={`text-lg font-bold transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Dodaj novu naviku</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="p-5 space-y-4 text-sm">
              <div>
                <label className={`block font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Naziv navike</label>
                <input
                  type="text"
                  className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                  placeholder="npr. Čitanje knjige"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className={`block font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Opis</label>
                <textarea
                  rows="2"
                  className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className={`block font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Tip navike</label>
                <select
                  className={`w-full p-2 border rounded-lg transition-colors duration-200 ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                  value={habitType}
                  onChange={(e) => setHabitType(e.target.value)}
                >
                  <option value="BOOLEAN">Da / Ne (Obična)</option>
                  <option value="QUANTITATIVE">Kvantitativna (Sa ciljem/količinom)</option>
                </select>
              </div>

              <div>
                <label className={`block font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Učestalost (Ponavljanje)</label>
                <select
                  className={`w-full p-2 border rounded-lg transition-colors duration-200 ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <option value="DAILY">Svaki dan</option>
                  <option value="ONCE">Samo danas (obriši nakon izvođenja)</option>
                  <option value="WEEKLY">Sedmično</option>
                  <option value="MONTHLY">Mjesečno</option>
                  <option value="YEARLY">Godišnje</option>
                </select>
              </div>

              {habitType === 'QUANTITATIVE' && (
                <>
                  <div>
                    <label className={`block font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Ciljna vrijednost</label>
                    <input
                      type="number"
                      step="0.1"
                      className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                      placeholder="npr. 20"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={`block font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Jedinica mjere</label>
                    <input
                      type="text"
                      className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                      placeholder="npr. stranica, minuta, km"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition">
                  Zatvori
                </button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
                  Sačuvaj naviku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedHabitForLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl p-6 shadow-xl w-full max-w-md transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 text-white border border-gray-800' : 'bg-white text-gray-900'}`}>
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className={`text-lg font-bold transition-colors duration-200 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Zabilježi napredak</h3>
              <button onClick={() => setSelectedHabitForLog(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="space-y-4 text-sm">
              {(selectedHabitForLog.habitType === 'QUANTITATIVE' || selectedHabitForLog.type === 'QUANTITATIVE') && (
                <div>
                  <label className={`block font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Ostvarena količina ({selectedHabitForLog.unit || ''})</label>
                  <input
                    type="number"
                    step="0.1"
                    name="loggedValue"
                    defaultValue={selectedHabitForLog.targetValue || 1}
                    className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                    required
                  />
                </div>
              )}

              <div>
                <label className={`block font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Ocjena dana (1 - 10)</label>
                <input
                  type="number"
                  name="rating"
                  min="1"
                  max="10"
                  defaultValue="10"
                  className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                  required
                />
              </div>

              <div>
                <label className={`block font-medium mb-1 transition-colors duration-200 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Kratki komentar / bilješka</label>
                <textarea
                  name="reflection"
                  rows="2"
                  placeholder="Kako je prošlo danas?"
                  className={`w-full p-2 border rounded-lg ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setSelectedHabitForLog(null)} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                  Odustani
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
                  Sačuvaj napredak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;