import { useState, useEffect, useRef } from "react";
import { Send, BookOpen, Target, TrendingUp, MessageSquare, CheckCircle, Languages, ChevronDown, ChevronUp } from "lucide-react";

const CEFR_LEVELS = ["A0","A1","A2","B1","B2"];
const CEFR_COLORS = { A0:"bg-gray-400", A1:"bg-green-400", A2:"bg-teal-400", B1:"bg-blue-400", B2:"bg-purple-500" };
const TOTAL_WEEKS = 104; // 2 years

const defaultGoals = {
  english: [
    { id: 1, text: "兩年內達到 CEFR B2 程度", completed: false, progress: 0 },
    { id: 2, text: "持續擴充英語詞彙量", completed: false, progress: 0 },
    { id: 3, text: "準備 IELTS 考試", completed: false, progress: 0 }
  ],
  spanish: [
    { id: 1, text: "學會西班牙語字母與發音", completed: false, progress: 0 },
    { id: 2, text: "掌握基本問候語（hola, gracias, adiós）", completed: false, progress: 0 },
    { id: 3, text: "學習數字 1–20 與基本顏色", completed: false, progress: 0 }
  ],
  japanese: [
    { id: 1, text: "學會平假名（全46字）", completed: false, progress: 0 },
    { id: 2, text: "學會片假名（全46字）", completed: false, progress: 0 },
    { id: 3, text: "掌握基本問候語（こんにちは、ありがとう）", completed: false, progress: 0 }
  ],
  korean: [
    { id: 1, text: "學會韓文字母母音與子音", completed: false, progress: 0 },
    { id: 2, text: "練習拼讀簡單的韓文音節", completed: false, progress: 0 },
    { id: 3, text: "掌握基本問候語（안녕하세요、감사합니다）", completed: false, progress: 0 }
  ]
};

const languages = {
  english:  { name: "English (英語)",    flag: "🇺🇸" },
  spanish:  { name: "Spanish (Español)", flag: "🇪🇸" },
  japanese: { name: "Japanese (日本語)", flag: "🇯🇵" },
  korean:   { name: "Korean (한국어)",   flag: "🇰🇷" }
};

const beginnerResources = {
  spanish: [
    { title: "Dreaming Spanish — Beginner", type: "影片", why: "全西語沉浸式學習，適合零基礎建立語感" },
    { title: "Easy Spanish Reader", type: "Book", why: "三階段漸進式西語讀本，適合初學者" },
    { title: "Español en marcha 1", type: "Book", why: "歐洲廣泛使用的西語初級教材" }
  ],
  japanese: [
    { title: "Tofugu — Learn Hiragana", type: "網站", why: "最完整的平假名學習指南，附記憶法" },
    { title: "NHK Web Easy", type: "新聞", why: "用簡單日語撰寫的新聞，適合初學者閱讀練習" },
    { title: "Genki I (初級日本語)", type: "Book", why: "最廣泛使用的日語初級教材" }
  ],
  korean: [
    { title: "Talk To Me In Korean — Level 1", type: "網站", why: "免費韓語課程，從韓文字母開始系統學習" },
    { title: "Korean From Zero! Book 1", type: "Book", why: "英語母語者設計的韓語零基礎入門書" },
    { title: "TTMIK Graded Readers Level 1", type: "Book", why: "韓語初學者分級讀本，搭配音檔使用" }
  ]
};

const beginnerNote = {
  spanish: "先從字母發音與基礎詞彙開始，建立聽說能力",
  japanese: "先從平假名與片假名開始，打好文字基礎再進入閱讀",
  korean: "先從韓文字母（한글）開始，學會拼音規則再進入閱讀"
};

// Return Sunday of the current week (YYYY-MM-DD)
function thisSunday() {
  const d = new Date();
  d.setDate(d.getDate() + (7 - d.getDay()) % 7);
  return d.toISOString().slice(0, 10);
}

function weeksRemaining(startDate) {
  const start = new Date(startDate);
  const now = new Date();
  const elapsed = Math.floor((now - start) / (7 * 24 * 3600 * 1000));
  return Math.max(0, TOTAL_WEEKS - elapsed);
}

function cefrToIdx(c) { return CEFR_LEVELS.indexOf(c); }

// Milestones: evenly spread A0→B2 across 104 weeks
function getMilestone(weekNum) {
  const idx = Math.min(4, Math.floor((weekNum / TOTAL_WEEKS) * 5));
  return CEFR_LEVELS[idx];
}

// Weekly test modal
function WeeklyTestModal({ onClose, onSave }) {
  const [step, setStep] = useState("prompt"); // prompt | input
  const [cefr, setCefr] = useState("");
  const [score, setScore] = useState("");

  const externalLinks = [
    { name: "British Council — Free CEFR Test", url: "https://www.britishcouncil.org/english/online/free-online-tests" },
    { name: "Cambridge English Quick Check", url: "https://www.cambridgeenglish.org/test-your-english/" },
    { name: "EF Standard English Test", url: "https://www.efset.org/" }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">📋 本週程度測試</h2>
          <p className="text-sm text-gray-500 mt-1">前往外部測試後，回來輸入結果</p>
        </div>
        {step === "prompt" ? (
          <div className="p-5 space-y-3">
            <p className="text-sm text-gray-700 font-medium">推薦免費測試網站：</p>
            {externalLinks.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noreferrer"
                className="flex items-center justify-between p-3 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                <span className="text-sm text-blue-700 font-medium">{l.name}</span>
                <span className="text-blue-400 text-xs">↗</span>
              </a>
            ))}
            <button onClick={() => setStep("input")}
              className="w-full mt-2 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              我測試完了，輸入結果 →
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">CEFR 等級</label>
              <div className="flex gap-2 flex-wrap">
                {CEFR_LEVELS.map(l => (
                  <button key={l} onClick={() => setCefr(l)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-bold transition-colors ${cefr === l ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 text-gray-600 hover:border-blue-400"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">測試分數（選填，如 IELTS Band / EF分數）</label>
              <input type="text" value={score} onChange={e => setScore(e.target.value)}
                placeholder="例：IELTS 5.0 / EF 54"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep("prompt")} className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">← 返回</button>
              <button disabled={!cefr} onClick={() => onSave(cefr, score)}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors">
                儲存結果
              </button>
            </div>
          </div>
        )}
        <div className="px-5 pb-4">
          <button onClick={onClose} className="w-full py-2 text-gray-400 text-sm hover:text-gray-600">取消</button>
        </div>
      </div>
    </div>
  );
}

// Progress chart inside sidebar
function ProgressChart({ weeklyProgress, onOpenTest }) {
  const [expanded, setExpanded] = useState(false);
  if (!weeklyProgress) return null;

  const remaining = weeksRemaining(weeklyProgress.startDate);
  const elapsed = TOTAL_WEEKS - remaining;
  const log = weeklyProgress.weeklyLog || [];
  const latestCEFR = log.length > 0 ? log[log.length - 1].cefr : "A0";
  const targetMilestone = getMilestone(elapsed + 4); // next 4 weeks target
  const onTrack = cefrToIdx(latestCEFR) >= cefrToIdx(getMilestone(elapsed));
  const lastTestSunday = log.length > 0 ? log[log.length - 1].sunday : null;
  const needsTest = thisSunday() !== lastTestSunday;

  return (
    <div className="border-t border-gray-200">
      <button onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-500" /> B2 兩年進度追蹤
          {needsTest && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">本週待測</span>}
        </span>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-500">目前程度</p>
              <p className={`text-base font-bold ${onTrack ? "text-green-600" : "text-orange-500"}`}>{latestCEFR}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-500">剩餘週數</p>
              <p className="text-base font-bold text-blue-600">{remaining}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-500">近期目標</p>
              <p className="text-base font-bold text-purple-600">{targetMilestone}</p>
            </div>
          </div>

          {/* CEFR progress bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>A0</span><span>A1</span><span>A2</span><span>B1</span><span>B2</span>
            </div>
            <div className="flex gap-1">
              {CEFR_LEVELS.map((l, i) => {
                const current = cefrToIdx(latestCEFR);
                const filled = i <= current;
                return (
                  <div key={l} className={`flex-1 h-3 rounded ${filled ? CEFR_COLORS[l] : "bg-gray-200"} transition-all duration-500`} />
                );
              })}
            </div>
            <p className={`text-xs mt-1 ${onTrack ? "text-green-600" : "text-orange-500"}`}>
              {onTrack ? "✅ 進度符合預期" : "⚠️ 建議加強練習頻率"}
            </p>
          </div>

          {/* Weekly log */}
          {log.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">歷次測試紀錄</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {[...log].reverse().map((entry, i) => (
                  <div key={i} className="flex justify-between items-center text-xs bg-gray-50 rounded px-2 py-1">
                    <span className="text-gray-500">{entry.sunday}</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-white text-xs ${CEFR_COLORS[entry.cefr] || "bg-gray-400"}`}>{entry.cefr}</span>
                    {entry.score && <span className="text-gray-400">{entry.score}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test button */}
          <button onClick={onOpenTest}
            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${needsTest ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}>
            {needsTest ? "📋 進行本週測試" : "📋 補充測試紀錄"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function LanguageTutor() {
  const [selectedLanguage, setSelectedLanguage] = useState("english");
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState({
    proficiencyLevel: "Beginner",
    totalMessages: 0,
    vocabularyCount: new Set(),
    grammarAccuracy: 0
  });
  const [learningGoals, setLearningGoals] = useState(defaultGoals.english);
  const [feedback, setFeedback] = useState(null);
  const [showLessonMode, setShowLessonMode] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState(new Set());
  const [lexileData, setLexileData] = useState({ lexileRange: null, cefr: null, recommendations: [] });
  const [storageReady, setStorageReady] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [weeklyProgress, setWeeklyProgress] = useState(null);
  const messagesEndRef = useRef(null);

  // Load persisted data
  useEffect(() => {
    const load = async () => {
      try { const r = await window.storage.get("userProfile"); if (r) { const p = JSON.parse(r.value); p.vocabularyCount = new Set(p.vocabularyCount || []); setUserProfile(p); } } catch(e) {}
      try { const r = await window.storage.get("learningGoals"); if (r) setLearningGoals(JSON.parse(r.value)); } catch(e) {}
      try { const r = await window.storage.get("lexileData"); if (r) setLexileData(JSON.parse(r.value)); } catch(e) {}
      try { const r = await window.storage.get("selectedLanguage"); if (r) setSelectedLanguage(r.value); } catch(e) {}
      try { const r = await window.storage.get("weeklyProgress"); if (r) setWeeklyProgress(JSON.parse(r.value)); } catch(e) {}
      setStorageReady(true);
    };
    load();
  }, []);

  useEffect(() => { if (!storageReady) return; window.storage.set("userProfile", JSON.stringify({ ...userProfile, vocabularyCount: [...userProfile.vocabularyCount] })).catch(() => {}); }, [userProfile, storageReady]);
  useEffect(() => { if (!storageReady) return; window.storage.set("learningGoals", JSON.stringify(learningGoals)).catch(() => {}); }, [learningGoals, storageReady]);
  useEffect(() => { if (!storageReady) return; window.storage.set("lexileData", JSON.stringify(lexileData)).catch(() => {}); }, [lexileData, storageReady]);
  useEffect(() => { if (!storageReady) return; window.storage.set("selectedLanguage", selectedLanguage).catch(() => {}); }, [selectedLanguage, storageReady]);
  useEffect(() => { if (!storageReady || !weeklyProgress) return; window.storage.set("weeklyProgress", JSON.stringify(weeklyProgress)).catch(() => {}); }, [weeklyProgress, storageReady]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Auto-start lesson
  useEffect(() => {
    if (!showLessonMode || isLoading) return;
    const startLesson = async () => {
      setIsLoading(true);
      const langName = languages[selectedLanguage].name;
      const prompt = `You are an expert language tutor. The student wants to learn ${langName}. Their goals: ${defaultGoals[selectedLanguage].map(g => g.text).join("; ")}.
This is the START of a new lesson session. Introduce yourself briefly, state today's lesson topic, explain the key point, give an example, and end with a practice prompt.
Respond ONLY with valid JSON:
{"tutorResponse":"lesson intro in ${langName} with 🎯 Today's Focus label","englishTranslation":"English translation","feedback":{"positive":[],"corrections":[],"suggestions":[]},"grammarAnalysis":{"accuracy":0,"detectedLevel":"Beginner","strengths":[],"improvements":[]},"vocabularyUsed":[],"progressNotes":"Lesson started"}`;
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }) });
        const data = await res.json();
        const parsed = JSON.parse(data.content.map(i => i.text || "").join("").replace(/```json|```/g, "").trim());
        setMessages([{ id: Date.now(), text: parsed.tutorResponse, englishTranslation: parsed.englishTranslation, sender: "tutor", timestamp: new Date() }]);
        setFeedback(null);
      } catch(e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    setMessages([]);
    startLesson();
  }, [showLessonMode]);

  const handleSaveTest = (cefr, score) => {
    const sunday = thisSunday();
    setWeeklyProgress(prev => {
      const base = prev || { startDate: new Date().toISOString().slice(0, 10), weeklyLog: [] };
      const log = base.weeklyLog.filter(e => e.sunday !== sunday);
      return { ...base, weeklyLog: [...log, { sunday, cefr, score }] };
    });
    setShowTestModal(false);
  };

  const getProficiencyColor = (l) => ({ Beginner: "text-green-600 bg-green-100", Intermediate: "text-yellow-600 bg-yellow-100", Advanced: "text-red-600 bg-red-100" }[l] || "text-green-600 bg-green-100");

  const analyzeProficiency = (h) => h.length < 10 ? "Beginner" : h.length < 20 ? "Intermediate" : "Advanced";

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;
    const userMsg = { id: Date.now(), text: currentMessage, sender: "user", timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setCurrentMessage("");
    setIsLoading(true);
    try {
      const history = [...messages, userMsg];
      const level = analyzeProficiency(history);
      const langName = languages[selectedLanguage].name;
      const prompt = showLessonMode ? `You are an expert IELTS and language tutor running a STRUCTURED LESSON. Student goals: ${learningGoals.map(g => g.text).join("; ")}.
History: ${JSON.stringify(history.slice(-5).map(m => ({ sender: m.sender, text: m.text })))}
User message: "${currentMessage}" Level: ${level}
Focus on ONE grammar/vocabulary/IELTS skill. Teach: explain, example, practice prompt. End with mini-summary.
Respond ONLY valid JSON: {"tutorResponse":"in ${langName} with 🎯 Today's Focus","englishTranslation":"English","feedback":{"positive":[],"corrections":[],"suggestions":[]},"grammarAnalysis":{"accuracy":85,"detectedLevel":"${level}","strengths":[],"improvements":[]},"vocabularyUsed":[],"progressNotes":""}` :
`You are a friendly conversation partner for ${langName}. Goals: ${learningGoals.map(g => g.text).join("; ")}.
History: ${JSON.stringify(history.slice(-5).map(m => ({ sender: m.sender, text: m.text })))}
User message: "${currentMessage}" Level: ${level}
Natural flowing chat. Weave corrections gently. Be concise.
Respond ONLY valid JSON: {"tutorResponse":"natural in ${langName}","englishTranslation":"English","feedback":{"positive":[],"corrections":[],"suggestions":[]},"grammarAnalysis":{"accuracy":85,"detectedLevel":"${level}","strengths":[],"improvements":[]},"vocabularyUsed":[],"progressNotes":""}`;

      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }) });
      const data = await res.json();
      const parsed = JSON.parse(data.content.map(i => i.text || "").join("").replace(/```json|```/g, "").trim());
      setMessages(prev => [...prev, { id: Date.now() + 1, text: parsed.tutorResponse, englishTranslation: parsed.englishTranslation, sender: "tutor", timestamp: new Date() }]);
      setFeedback(parsed.feedback);
      setUserProfile(prev => ({ ...prev, totalMessages: prev.totalMessages + 1, proficiencyLevel: parsed.grammarAnalysis.detectedLevel, grammarAccuracy: parsed.grammarAnalysis.accuracy, vocabularyCount: new Set([...prev.vocabularyCount, ...(parsed.vocabularyUsed || [])]) }));

      if (selectedLanguage === "english" && (userProfile.totalMessages + 1) % 3 === 0) {
        const lp = `Estimate Lexile reading level. Conversation: ${JSON.stringify(history.slice(-6).map(m => ({ sender: m.sender, text: m.text })))} Proficiency: ${parsed.grammarAnalysis.detectedLevel}, Accuracy: ${parsed.grammarAnalysis.accuracy}%
Respond ONLY valid JSON: {"lexileRange":"e.g. 600L–800L","cefr":"e.g. A2","recommendations":[{"title":"","type":"Book/Article/News","lexile":"","why":""},{"title":"","type":"","lexile":"","why":""},{"title":"","type":"","lexile":"","why":""}]}`;
        try {
          const lr = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: lp }] }) });
          const ld = await lr.json();
          setLexileData(JSON.parse(ld.content.map(i => i.text || "").join("").replace(/```json|```/g, "").trim()));
        } catch(e) { console.error(e); }
      }
    } catch(e) {
      console.error(e);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: "I'm sorry, I'm having trouble responding right now. Let's continue practising!", sender: "tutor", timestamp: new Date() }]);
    } finally { setIsLoading(false); }
  };

  const handleLanguageChange = (lang) => { setSelectedLanguage(lang); setMessages([]); setFeedback(null); setTranslatedMessages(new Set()); setLearningGoals(defaultGoals[lang] || defaultGoals.english); };
  const toggleTranslation = (id) => { setTranslatedMessages(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }); };
  const toggleGoal = (id) => { setLearningGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed, progress: g.completed ? g.progress : 100 } : g)); };
  const addGoal = () => { const t = prompt("輸入你的學習目標："); if (t?.trim()) setLearningGoals(prev => [...prev, { id: Date.now(), text: t.trim(), completed: false, progress: 0 }]); };

  return (
    <div className="flex h-screen bg-gray-50">
      {showTestModal && <WeeklyTestModal onClose={() => setShowTestModal(false)} onSave={handleSaveTest} />}

      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2"><BookOpen className="h-6 w-6 text-blue-600" /><h1 className="text-xl font-bold text-gray-800">Language Tutor</h1></div>
              <select value={selectedLanguage} onChange={e => handleLanguageChange(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                {Object.entries(languages).map(([code, l]) => <option key={code} value={code}>{l.flag} {l.name}</option>)}
              </select>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProficiencyColor(userProfile.proficiencyLevel)}`}>{userProfile.proficiencyLevel}</span>
            </div>
            <div className="flex rounded-md border border-gray-300 overflow-hidden">
              <button onClick={() => setShowLessonMode(false)} className={`px-4 py-2 text-sm font-medium transition-colors ${!showLessonMode ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>💬 Chat</button>
              <button onClick={() => setShowLessonMode(true)} className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${showLessonMode ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>📖 Lesson</button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">{languages[selectedLanguage].flag}</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Ready to practise {languages[selectedLanguage].name}?</h2>
              <p className="text-gray-500">Start a conversation and I'll help you learn with personalised feedback!</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div onClick={msg.sender === "tutor" ? () => toggleTranslation(msg.id) : undefined}
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group ${msg.sender === "user" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 cursor-pointer"}`}>
                {msg.sender === "tutor" && <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"><Languages className="h-3 w-3 text-gray-400" /></div>}
                <p className="pr-4">{msg.sender === "tutor" && translatedMessages.has(msg.id) ? msg.englishTranslation || msg.text : msg.text}</p>
                {msg.sender === "tutor" && translatedMessages.has(msg.id) && <p className="text-xs mt-1 text-gray-500 italic">English translation</p>}
                <p className={`text-xs mt-1 ${msg.sender === "user" ? "text-blue-100" : "text-gray-500"}`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1">{[0, 0.1, 0.2].map((d, i) => <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />)}</div>
                <span className="text-sm text-gray-500">Tutor is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input type="text" value={currentMessage} onChange={e => setCurrentMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder={`Type your message in ${languages[selectedLanguage].name}...`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" disabled={isLoading} />
            <button onClick={sendMessage} disabled={isLoading || !currentMessage.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"><Send className="h-5 w-5" /></button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
        {/* Progress */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Progress Overview</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Messages:</span><span className="font-medium">{userProfile.totalMessages}</span></div>
            <div className="flex justify-between"><span>Vocabulary:</span><span className="font-medium">{userProfile.vocabularyCount.size} words</span></div>
            <div className="flex justify-between"><span>Accuracy:</span><span className="font-medium">{userProfile.grammarAccuracy}%</span></div>
          </div>
        </div>

        {/* Goals */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Target className="h-5 w-5" /> Learning Goals</h3>
            <button onClick={addGoal} className="text-blue-600 hover:text-blue-700 text-sm font-medium">+ 新增</button>
          </div>
          <div className="space-y-2">
            {learningGoals.map(goal => (
              <div key={goal.id} className="p-2 bg-gray-50 rounded-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className={`text-sm ${goal.completed ? "line-through text-gray-400" : "text-gray-700"}`}>{goal.text}</p>
                    <div className="mt-1">
                      <div className="flex justify-between text-xs text-gray-500 mb-1"><span>進度</span><span>{goal.progress}%</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${goal.progress}%` }} /></div>
                    </div>
                  </div>
                  <button onClick={() => toggleGoal(goal.id)} className="mt-1 shrink-0">
                    {goal.completed ? <CheckCircle className="h-4 w-4 text-green-600" /> : <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Progress Chart — English only */}
        {selectedLanguage === "english" && (
          <ProgressChart weeklyProgress={weeklyProgress} onOpenTest={() => setShowTestModal(true)} />
        )}

        {/* Feedback */}
        {feedback && (
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Feedback</h3>
            {feedback.positive?.length > 0 && <div className="mb-2"><p className="text-xs font-medium text-green-600 mb-1">Great job!</p>{feedback.positive.map((t, i) => <p key={i} className="text-sm text-green-700 bg-green-50 p-2 rounded mb-1">{t}</p>)}</div>}
            {feedback.corrections?.length > 0 && <div className="mb-2"><p className="text-xs font-medium text-orange-600 mb-1">Small corrections:</p>{feedback.corrections.map((t, i) => <p key={i} className="text-sm text-orange-700 bg-orange-50 p-2 rounded mb-1">{t}</p>)}</div>}
            {feedback.suggestions?.length > 0 && <div><p className="text-xs font-medium text-blue-600 mb-1">Try this:</p>{feedback.suggestions.map((t, i) => <p key={i} className="text-sm text-blue-700 bg-blue-50 p-2 rounded mb-1">{t}</p>)}</div>}
          </div>
        )}

        {/* Reading / Resources */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-800 mb-2">📚 {selectedLanguage === "english" ? "推估閱讀程度" : "初學者學習資源"}</h3>
          {selectedLanguage !== "english" ? (
            <div className="space-y-2">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"><p className="text-xs font-medium text-yellow-700 mb-1">📝 目前階段</p><p className="text-sm text-yellow-800">{beginnerNote[selectedLanguage]}</p></div>
              <p className="text-xs font-medium text-gray-600 mt-2">推薦學習資源</p>
              {(beginnerResources[selectedLanguage] || []).map((r, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-2 bg-white">
                  <div className="flex justify-between items-start gap-1"><p className="text-sm font-medium text-gray-800 flex-1">{r.title}</p><span className="text-xs bg-gray-100 text-gray-600 rounded px-1 whitespace-nowrap">{r.type}</span></div>
                  <p className="text-xs text-gray-500 mt-1">{r.why}</p>
                </div>
              ))}
            </div>
          ) : !lexileData.lexileRange ? (
            <p className="text-xs text-gray-400">對話 3 則後自動推估藍思值與推薦讀物</p>
          ) : (
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-lg p-3 flex justify-between items-center">
                <div><p className="text-xs text-gray-500">推估藍思值</p><p className="text-lg font-bold text-blue-700">{lexileData.lexileRange}</p></div>
                <div className="text-right"><p className="text-xs text-gray-500">CEFR</p><p className="text-lg font-bold text-green-700">{lexileData.cefr}</p></div>
              </div>
              <p className="text-xs font-medium text-gray-600">推薦讀物</p>
              {(lexileData.recommendations || []).map((r, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-2 bg-white">
                  <div className="flex justify-between items-start gap-1"><p className="text-sm font-medium text-gray-800 flex-1">{r.title}</p><span className={`text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap ${r.type === "Book" ? "bg-purple-100 text-purple-700" : r.type === "Article" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{r.type}</span></div>
                  <p className="text-xs text-gray-500 mt-1">{r.why}</p>
                </div>
              ))}
              <p className="text-xs text-gray-400">每 3 則對話更新一次</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}