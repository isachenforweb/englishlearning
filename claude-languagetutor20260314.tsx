import { useState, useEffect, useRef } from "react";
import { Send, BookOpen, Target, TrendingUp, MessageSquare, CheckCircle, Languages, ChevronDown, ChevronUp } from "lucide-react";

const CEFR_LEVELS = ["A0","A1","A2","B1","B2"];
const CEFR_COLORS = { A0:"bg-gray-400", A1:"bg-green-400", A2:"bg-teal-400", B1:"bg-blue-400", B2:"bg-purple-500" };
const TOTAL_WEEKS = 104;
const B2_VOCAB_TARGET = 5000;

const defaultGoals = {
  english: [
    { id: 1, text: "兩年內達到 CEFR B2 程度", completed: false, progress: 0 },
    { id: 2, text: "詞彙量達到 B2 標準（目標 5,000 字）", completed: false, progress: 0, dynamic: "vocab" },
    { id: 3, text: "IELTS 目標 6.5｜L:- R:- W:- S:-", completed: false, progress: 0, dynamic: "ielts" }
  ],
  spanish: [
    { id: 1, text: "學會西班牙語字母與發音", completed: false, progress: 0 },
    { id: 2, text: "掌握基本問候語（hola, gracias, adiós）", completed: false, progress: 0 },
    { id: 3, text: "學習數字 1-20 與基本顏色", completed: false, progress: 0 }
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
  english:  { name: "English", flag: "🇺🇸" },
  spanish:  { name: "Spanish", flag: "🇪🇸" },
  japanese: { name: "Japanese", flag: "🇯🇵" },
  korean:   { name: "Korean", flag: "🇰🇷" }
};

const beginnerResources = {
  spanish: [
    { title: "Dreaming Spanish - Beginner", type: "影片", why: "全西語沉浸式學習，適合零基礎建立語感" },
    { title: "Easy Spanish Reader", type: "Book", why: "三階段漸進式西語讀本，適合初學者" },
    { title: "Espanol en marcha 1", type: "Book", why: "歐洲廣泛使用的西語初級教材" }
  ],
  japanese: [
    { title: "Tofugu - Learn Hiragana", type: "網站", why: "最完整的平假名學習指南，附記憶法" },
    { title: "NHK Web Easy", type: "新聞", why: "用簡單日語撰寫的新聞，適合初學者閱讀練習" },
    { title: "Genki I", type: "Book", why: "最廣泛使用的日語初級教材" }
  ],
  korean: [
    { title: "Talk To Me In Korean - Level 1", type: "網站", why: "免費韓語課程，從韓文字母開始系統學習" },
    { title: "Korean From Zero! Book 1", type: "Book", why: "英語母語者設計的韓語零基礎入門書" },
    { title: "TTMIK Graded Readers Level 1", type: "Book", why: "韓語初學者分級讀本，搭配音檔使用" }
  ]
};

const beginnerNote = {
  spanish: "先從字母發音與基礎詞彙開始，建立聽說能力",
  japanese: "先從平假名與片假名開始，打好文字基礎再進入閱讀",
  korean: "先從韓文字母（한글）開始，學會拼音規則再進入閱讀"
};

function cefrToIdx(c) { return CEFR_LEVELS.indexOf(c); }

function getNextMilestone(currentCEFR) {
  const idx = cefrToIdx(currentCEFR);
  if (idx < 0) return "A1";
  return CEFR_LEVELS[Math.min(idx + 1, CEFR_LEVELS.length - 1)];
}

function getMilestoneByWeek(weekNum) {
  return CEFR_LEVELS[Math.min(4, Math.floor((weekNum / TOTAL_WEEKS) * 5))];
}

function thisSunday() {
  const d = new Date();
  d.setDate(d.getDate() + (7 - d.getDay()) % 7);
  return d.toISOString().slice(0, 10);
}

function weeksRemaining(startDate) {
  const elapsed = Math.floor((new Date() - new Date(startDate)) / (7 * 24 * 3600 * 1000));
  return Math.max(0, TOTAL_WEEKS - elapsed);
}

function TestModal({ onClose, onSave }) {
  const [step, setStep] = useState("links");
  const [cefr, setCefr] = useState("");
  const [score, setScore] = useState("");
  const links = [
    { name: "British Council - Free CEFR Test", url: "https://www.britishcouncil.org/english/online/free-online-tests" },
    { name: "Cambridge English Quick Check", url: "https://www.cambridgeenglish.org/test-your-english/" },
    { name: "EF Standard English Test (EF SET)", url: "https://www.efset.org/" }
  ];
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        <div className="p-4 border-b">
          <h2 className="text-base font-bold text-gray-800">本週程度測試</h2>
          <p className="text-xs text-gray-500 mt-0.5">前往外部測試後回來輸入結果</p>
        </div>
        {step === "links" ? (
          <div className="p-4 space-y-2">
            {links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noreferrer"
                className="flex items-center justify-between p-3 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors">
                <span className="text-sm text-blue-700">{l.name}</span>
                <span className="text-blue-400 ml-2">arrows</span>
              </a>
            ))}
            <button onClick={() => setStep("input")}
              className="w-full mt-2 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              我測試完了，輸入結果
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">CEFR 等級</p>
              <div className="flex gap-2">
                {CEFR_LEVELS.map(l => (
                  <button key={l} onClick={() => setCefr(l)}
                    className={"flex-1 py-2 rounded-lg border-2 text-sm font-bold transition-colors " + (cefr === l ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 text-gray-600 hover:border-blue-400")}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">分數（選填）</p>
              <input value={score} onChange={e => setScore(e.target.value)} placeholder="例：IELTS 5.0 / EF SET 54"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep("links")} className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm">返回</button>
              <button disabled={!cefr} onClick={() => onSave(cefr, score)}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-40">儲存結果</button>
            </div>
          </div>
        )}
        <div className="px-4 pb-4">
          <button onClick={onClose} className="w-full py-1.5 text-gray-400 text-sm hover:text-gray-600">取消</button>
        </div>
      </div>
    </div>
  );
}

export default function LanguageTutor() {
  const [selectedLanguage, setSelectedLanguage] = useState("english");
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState({
    proficiencyLevel: "Beginner", totalMessages: 0,
    vocabEstimate: 0, grammarAccuracy: 0,
    ielts: { L: null, R: null, W: null, S: null }
  });
  const [learningGoals, setLearningGoals] = useState(defaultGoals.english);
  const [feedback, setFeedback] = useState(null);
  const [showLessonMode, setShowLessonMode] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState(new Set());
  const [lexileData, setLexileData] = useState({ lexileRange: null, cefr: null, recommendations: [] });
  const [storageReady, setStorageReady] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [weeklyProgress, setWeeklyProgress] = useState(null);
  const [progressExpanded, setProgressExpanded] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try { const r = await window.storage.get("userProfile2"); if (r) { setUserProfile(JSON.parse(r.value)); } } catch(e) {}
      try { const r = await window.storage.get("learningGoals"); if (r) setLearningGoals(JSON.parse(r.value)); } catch(e) {}
      try { const r = await window.storage.get("lexileData"); if (r) setLexileData(JSON.parse(r.value)); } catch(e) {}
      try { const r = await window.storage.get("selectedLanguage"); if (r) setSelectedLanguage(r.value); } catch(e) {}
      try { const r = await window.storage.get("weeklyProgress"); if (r) setWeeklyProgress(JSON.parse(r.value)); } catch(e) {}
      setStorageReady(true);
    };
    load();
  }, []);

  useEffect(() => { if (!storageReady) return; window.storage.set("userProfile2", JSON.stringify(userProfile)).catch(() => {}); }, [userProfile, storageReady]);
  useEffect(() => { if (!storageReady) return; window.storage.set("learningGoals", JSON.stringify(learningGoals)).catch(() => {}); }, [learningGoals, storageReady]);
  useEffect(() => { if (!storageReady) return; window.storage.set("lexileData", JSON.stringify(lexileData)).catch(() => {}); }, [lexileData, storageReady]);
  useEffect(() => { if (!storageReady) return; window.storage.set("selectedLanguage", selectedLanguage).catch(() => {}); }, [selectedLanguage, storageReady]);
  useEffect(() => { if (!storageReady || !weeklyProgress) return; window.storage.set("weeklyProgress", JSON.stringify(weeklyProgress)).catch(() => {}); }, [weeklyProgress, storageReady]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Update dynamic goals text whenever userProfile changes
  useEffect(() => {
    if (selectedLanguage !== "english") return;
    setLearningGoals(prev => prev.map(g => {
      if (g.dynamic === "vocab") {
        const est = userProfile.vocabEstimate || 0;
        const pct = Math.min(100, Math.round((est / B2_VOCAB_TARGET) * 100));
        return { ...g, text: "詞彙量達到 B2 標準（目前約 " + est + " / 5,000 字）", progress: pct };
      }
      if (g.dynamic === "ielts") {
        const { L, R, W, S } = userProfile.ielts || {};
        const fmt = v => v !== null && v !== undefined ? v.toFixed(1) : "-";
        const scores = [L, R, W, S].filter(v => v !== null && v !== undefined);
        const avg = scores.length > 0 ? (scores.reduce((a,b) => a+b, 0) / scores.length) : null;
        const pct = avg !== null ? Math.min(100, Math.round(((avg - 1) / 8) * 100)) : 0;
        return { ...g, text: "IELTS 目標 6.5｜L:" + fmt(L) + " R:" + fmt(R) + " W:" + fmt(W) + " S:" + fmt(S), progress: pct };
      }
      return g;
    }));
  }, [userProfile, selectedLanguage]);

  useEffect(() => {
    if (!showLessonMode || isLoading) return;
    const start = async () => {
      setIsLoading(true);
      setMessages([]);
      const langName = languages[selectedLanguage].name;
      const goals = defaultGoals[selectedLanguage].map(g => g.text).join("; ");
      const prompt = "You are an expert language tutor. Student learns " + langName + ". Goals: " + goals + ". Start a structured lesson: introduce topic with Today's Focus label, explain, give example, end with practice prompt. Respond ONLY valid JSON: {\"tutorResponse\":\"...\",\"englishTranslation\":\"...\",\"feedback\":{\"positive\":[],\"corrections\":[],\"suggestions\":[]},\"grammarAnalysis\":{\"accuracy\":0,\"detectedLevel\":\"Beginner\",\"strengths\":[],\"improvements\":[]},\"vocabularyUsed\":[],\"progressNotes\":\"Lesson started\"}";
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }) });
        const data = await res.json();
        const parsed = JSON.parse(data.content.map(i => i.text || "").join("").replace(/```json|```/g, "").trim());
        setMessages([{ id: Date.now(), text: parsed.tutorResponse, englishTranslation: parsed.englishTranslation, sender: "tutor", timestamp: new Date() }]);
        setFeedback(null);
      } catch(e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    start();
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

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;
    const userMsg = { id: Date.now(), text: currentMessage, sender: "user", timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setCurrentMessage("");
    setIsLoading(true);
    try {
      const history = [...messages, userMsg];
      const level = history.length < 10 ? "Beginner" : history.length < 20 ? "Intermediate" : "Advanced";
      const langName = languages[selectedLanguage].name;
      const goals = learningGoals.map(g => g.text).join("; ");
      const histStr = JSON.stringify(history.slice(-5).map(m => ({ sender: m.sender, text: m.text })));
      const isEng = selectedLanguage === "english";

      const prompt = showLessonMode
        ? "Expert language tutor, STRUCTURED LESSON in " + langName + ". Goals: " + goals + ". History: " + histStr + ". User: " + currentMessage + ". Level: " + level + ". Focus ONE skill, teach+example+practice, mini-summary. JSON only: {\"tutorResponse\":\"response with Today's Focus label\",\"englishTranslation\":\"...\",\"feedback\":{\"positive\":[],\"corrections\":[],\"suggestions\":[]},\"grammarAnalysis\":{\"accuracy\":85,\"detectedLevel\":\"" + level + "\",\"strengths\":[],\"improvements\":[]},\"vocabularyUsed\":[],\"progressNotes\":\"\"}"
        : "Friendly conversation partner for " + langName + ". Goals: " + goals + ". History: " + histStr + ". User: " + currentMessage + ". Level: " + level + ". Natural chat, weave corrections gently. JSON only: {\"tutorResponse\":\"natural response\",\"englishTranslation\":\"...\",\"feedback\":{\"positive\":[],\"corrections\":[],\"suggestions\":[]},\"grammarAnalysis\":{\"accuracy\":85,\"detectedLevel\":\"" + level + "\",\"strengths\":[],\"improvements\":[]},\"vocabularyUsed\":[],\"progressNotes\":\"\"}";

      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }) });
      const data = await res.json();
      const parsed = JSON.parse(data.content.map(i => i.text || "").join("").replace(/```json|```/g, "").trim());

      setMessages(prev => [...prev, { id: Date.now() + 1, text: parsed.tutorResponse, englishTranslation: parsed.englishTranslation, sender: "tutor", timestamp: new Date() }]);
      setFeedback(parsed.feedback);

      // For English: run dynamic assessment every 3 messages
      if (isEng && (userProfile.totalMessages + 1) % 3 === 0) {
        const histLong = JSON.stringify(history.slice(-8).map(m => ({ sender: m.sender, text: m.text })));
        const assessPrompt = "Assess this English learner based on their conversation. History: " + histLong + ". Current CEFR: " + parsed.grammarAnalysis.detectedLevel + ". Grammar accuracy: " + parsed.grammarAnalysis.accuracy + "%. Estimate: (1) total active vocabulary size as integer, (2) IELTS band estimates for each skill 1.0-9.0 based on evidence from conversation (use null if not enough evidence), (3) Lexile range. JSON only: {\"vocabEstimate\":1200,\"ielts\":{\"L\":null,\"R\":null,\"W\":4.5,\"S\":4.0},\"lexileRange\":\"600L-800L\",\"cefr\":\"A2\",\"recommendations\":[{\"title\":\"\",\"type\":\"Book\",\"lexile\":\"\",\"why\":\"\"},{\"title\":\"\",\"type\":\"Article\",\"lexile\":\"\",\"why\":\"\"},{\"title\":\"\",\"type\":\"News\",\"lexile\":\"\",\"why\":\"\"}]}";
        try {
          const ar = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, messages: [{ role: "user", content: assessPrompt }] }) });
          const ad = await ar.json();
          const ap = JSON.parse(ad.content.map(i => i.text || "").join("").replace(/```json|```/g, "").trim());
          setUserProfile(prev => ({ ...prev, totalMessages: prev.totalMessages + 1, proficiencyLevel: parsed.grammarAnalysis.detectedLevel, grammarAccuracy: parsed.grammarAnalysis.accuracy, vocabEstimate: ap.vocabEstimate || prev.vocabEstimate, ielts: { L: ap.ielts.L, R: ap.ielts.R, W: ap.ielts.W, S: ap.ielts.S } }));
          setLexileData({ lexileRange: ap.lexileRange, cefr: ap.cefr, recommendations: ap.recommendations || [] });
        } catch(e) { console.error(e); setUserProfile(prev => ({ ...prev, totalMessages: prev.totalMessages + 1, proficiencyLevel: parsed.grammarAnalysis.detectedLevel, grammarAccuracy: parsed.grammarAnalysis.accuracy })); }
      } else {
        setUserProfile(prev => ({ ...prev, totalMessages: prev.totalMessages + 1, proficiencyLevel: parsed.grammarAnalysis.detectedLevel, grammarAccuracy: parsed.grammarAnalysis.accuracy }));
      }

    } catch(e) {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: "I'm having trouble responding. Let's continue practising!", sender: "tutor", timestamp: new Date() }]);
    } finally { setIsLoading(false); }
  };

  const handleLanguageChange = (lang) => { setSelectedLanguage(lang); setMessages([]); setFeedback(null); setTranslatedMessages(new Set()); setLearningGoals(defaultGoals[lang]); };
  const toggleTranslation = (id) => { setTranslatedMessages(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }); };
  const toggleGoal = (id) => setLearningGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed, progress: g.completed ? g.progress : 100 } : g));
  const addGoal = () => { const t = prompt("輸入你的學習目標："); if (t && t.trim()) setLearningGoals(prev => [...prev, { id: Date.now(), text: t.trim(), completed: false, progress: 0 }]); };

  const log = weeklyProgress ? weeklyProgress.weeklyLog || [] : [];
  const latestCEFR = log.length > 0 ? log[log.length - 1].cefr : null;
  const remaining = weeklyProgress ? weeksRemaining(weeklyProgress.startDate) : TOTAL_WEEKS;
  const elapsed = TOTAL_WEEKS - remaining;
  const onTrack = latestCEFR ? cefrToIdx(latestCEFR) >= cefrToIdx(getMilestoneByWeek(elapsed)) : null;
  const nextMilestone = latestCEFR ? getNextMilestone(latestCEFR) : "A1";
  const needsTest = thisSunday() !== (log.length > 0 ? log[log.length - 1].sunday : null);
  const profColor = { Beginner: "text-green-600 bg-green-100", Intermediate: "text-yellow-600 bg-yellow-100", Advanced: "text-red-600 bg-red-100" }[userProfile.proficiencyLevel] || "text-green-600 bg-green-100";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {showTestModal && <TestModal onClose={() => setShowTestModal(false)} onSave={handleSaveTest} />}

      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b p-3 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h1 className="text-lg font-bold text-gray-800">Language Tutor</h1>
            </div>
            <select value={selectedLanguage} onChange={e => handleLanguageChange(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500">
              {Object.entries(languages).map(([c, l]) => <option key={c} value={c}>{l.flag} {l.name}</option>)}
            </select>
            <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + profColor}>{userProfile.proficiencyLevel}</span>
          </div>
          <div className="flex rounded-md border border-gray-300 overflow-hidden text-sm">
            <button onClick={() => setShowLessonMode(false)} className={"px-3 py-1.5 font-medium transition-colors " + (!showLessonMode ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50")}>💬 Chat</button>
            <button onClick={() => setShowLessonMode(true)} className={"px-3 py-1.5 font-medium border-l border-gray-300 transition-colors " + (showLessonMode ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50")}>📖 Lesson</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">{languages[selectedLanguage].flag}</div>
              <h2 className="text-lg font-semibold text-gray-700 mb-1">Ready to practise {languages[selectedLanguage].name}?</h2>
              <p className="text-sm text-gray-500">Start a conversation and I will help you learn!</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={"flex " + (msg.sender === "user" ? "justify-end" : "justify-start")}>
              <div onClick={msg.sender === "tutor" ? () => toggleTranslation(msg.id) : undefined}
                className={"max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative group " + (msg.sender === "user" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 cursor-pointer")}>
                {msg.sender === "tutor" && <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"><Languages className="h-3 w-3 text-gray-400" /></div>}
                <p className="pr-3 text-sm">{msg.sender === "tutor" && translatedMessages.has(msg.id) ? (msg.englishTranslation || msg.text) : msg.text}</p>
                {msg.sender === "tutor" && translatedMessages.has(msg.id) && <p className="text-xs mt-1 text-gray-400 italic">English translation</p>}
                <p className={"text-xs mt-1 " + (msg.sender === "user" ? "text-blue-200" : "text-gray-400")}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1">{[0,0.1,0.2].map((d,i) => <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: d + "s"}} />)}</div>
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white border-t p-3 shrink-0">
          <div className="flex gap-2">
            <input value={currentMessage} onChange={e => setCurrentMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder={"Type in " + languages[selectedLanguage].name + "..."}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500" disabled={isLoading} />
            <button onClick={sendMessage} disabled={isLoading || !currentMessage.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-72 bg-white border-l border-gray-200 flex flex-col overflow-y-auto shrink-0">

        {/* Progress Overview */}
        <div className="p-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm"><TrendingUp className="h-4 w-4" /> Progress Overview</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Messages</span><span className="font-medium">{userProfile.totalMessages}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Accuracy</span><span className="font-medium">{userProfile.grammarAccuracy}%</span></div>
          </div>
        </div>

        {/* Learning Goals */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm"><Target className="h-4 w-4" /> Learning Goals</h3>
            <button onClick={addGoal} className="text-blue-600 text-xs hover:text-blue-700">+ 新增</button>
          </div>
          <div className="space-y-2">
            {learningGoals.map(goal => (
              <div key={goal.id} className="p-2 bg-gray-50 rounded-md">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={"text-xs leading-snug " + (goal.completed ? "line-through text-gray-400" : "text-gray-700")}>{goal.text}</p>
                    <div className="mt-1.5">
                      <div className="flex justify-between text-xs text-gray-400 mb-0.5"><span>進度</span><span>{goal.progress}%</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{width: goal.progress + "%"}} /></div>
                    </div>
                    {goal.dynamic === "ielts" && userProfile.ielts && (
                      <div className="mt-2 grid grid-cols-4 gap-1">
                        {[["L", userProfile.ielts.L], ["R", userProfile.ielts.R], ["W", userProfile.ielts.W], ["S", userProfile.ielts.S]].map(([k, v]) => (
                          <div key={k} className="text-center bg-white rounded border border-gray-200 py-1">
                            <p className="text-xs text-gray-400">{k}</p>
                            <p className="text-xs font-bold text-blue-600">{v !== null && v !== undefined ? v.toFixed(1) : "—"}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => toggleGoal(goal.id)} className="shrink-0 mt-0.5">
                    {goal.completed ? <CheckCircle className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* B2 Weekly Progress */}
        {selectedLanguage === "english" && (
          <div className="border-b border-gray-200">
            <button onClick={() => setProgressExpanded(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                🎯 B2 兩年進度追蹤
                {needsTest && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-normal">本週待測</span>}
              </span>
              {progressExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>
            {progressExpanded && (
              <div className="px-3 pb-3 space-y-3">
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-400">目前程度</p>
                    <p className={"text-sm font-bold " + (onTrack === true ? "text-green-600" : onTrack === false ? "text-orange-500" : "text-gray-400")}>{latestCEFR || "—"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-400">剩餘週數</p>
                    <p className="text-sm font-bold text-blue-600">{remaining}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-400">近期目標</p>
                    <p className="text-sm font-bold text-purple-600">{nextMilestone}</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    {CEFR_LEVELS.map(l => <span key={l}>{l}</span>)}
                  </div>
                  <div className="flex gap-0.5">
                    {CEFR_LEVELS.map((l, i) => (
                      <div key={l} className={"flex-1 h-3 rounded transition-all duration-500 " + (latestCEFR && i <= cefrToIdx(latestCEFR) ? CEFR_COLORS[l] : "bg-gray-200")} />
                    ))}
                  </div>
                  {onTrack !== null && (
                    <p className={"text-xs mt-1 " + (onTrack ? "text-green-600" : "text-orange-500")}>
                      {onTrack ? "進度符合預期" : "建議加強練習頻率"}
                    </p>
                  )}
                </div>
                {log.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">歷次測試紀錄</p>
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {[...log].reverse().map((e, i) => (
                        <div key={i} className="flex justify-between items-center text-xs bg-gray-50 rounded px-2 py-1">
                          <span className="text-gray-400">{e.sunday}</span>
                          <span className={"font-bold px-1.5 py-0.5 rounded text-white text-xs " + (CEFR_COLORS[e.cefr] || "bg-gray-400")}>{e.cefr}</span>
                          {e.score && <span className="text-gray-400">{e.score}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={() => setShowTestModal(true)}
                  className={"w-full py-2 rounded-lg text-xs font-medium transition-colors " + (needsTest ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-600")}>
                  {needsTest ? "📋 進行本週測試" : "📋 補充測試紀錄"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className="p-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm"><MessageSquare className="h-4 w-4" /> Feedback</h3>
            {feedback.positive && feedback.positive.length > 0 && <div className="mb-2"><p className="text-xs font-medium text-green-600 mb-1">Great job!</p>{feedback.positive.map((t,i) => <p key={i} className="text-xs text-green-700 bg-green-50 p-1.5 rounded mb-1">{t}</p>)}</div>}
            {feedback.corrections && feedback.corrections.length > 0 && <div className="mb-2"><p className="text-xs font-medium text-orange-600 mb-1">Corrections:</p>{feedback.corrections.map((t,i) => <p key={i} className="text-xs text-orange-700 bg-orange-50 p-1.5 rounded mb-1">{t}</p>)}</div>}
            {feedback.suggestions && feedback.suggestions.length > 0 && <div><p className="text-xs font-medium text-blue-600 mb-1">Try this:</p>{feedback.suggestions.map((t,i) => <p key={i} className="text-xs text-blue-700 bg-blue-50 p-1.5 rounded mb-1">{t}</p>)}</div>}
          </div>
        )}

        {/* Reading */}
        <div className="p-3">
          <h3 className="font-semibold text-gray-800 mb-2 text-sm">📚 {selectedLanguage === "english" ? "推估閱讀程度" : "初學者學習資源"}</h3>
          {selectedLanguage !== "english" ? (
            <div className="space-y-2">
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-2.5">
                <p className="text-xs font-medium text-yellow-700 mb-0.5">目前階段</p>
                <p className="text-xs text-yellow-800">{beginnerNote[selectedLanguage]}</p>
              </div>
              <p className="text-xs font-medium text-gray-500">推薦學習資源</p>
              {(beginnerResources[selectedLanguage] || []).map((r, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-2 bg-white">
                  <div className="flex justify-between items-start gap-1">
                    <p className="text-xs font-medium text-gray-800 flex-1">{r.title}</p>
                    <span className="text-xs bg-gray-100 text-gray-500 rounded px-1 whitespace-nowrap">{r.type}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{r.why}</p>
                </div>
              ))}
            </div>
          ) : !lexileData.lexileRange ? (
            <p className="text-xs text-gray-400">對話 3 則後自動推估藍思值與推薦讀物</p>
          ) : (
            <div className="space-y-2">
              <div className="bg-blue-50 rounded-lg p-2.5 flex justify-between">
                <div><p className="text-xs text-gray-400">藍思值</p><p className="text-base font-bold text-blue-700">{lexileData.lexileRange}</p></div>
                <div className="text-right"><p className="text-xs text-gray-400">CEFR</p><p className="text-base font-bold text-green-700">{lexileData.cefr}</p></div>
              </div>
              <p className="text-xs font-medium text-gray-500">推薦讀物</p>
              {(lexileData.recommendations || []).map((r, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-2 bg-white">
                  <div className="flex justify-between items-start gap-1">
                    <p className="text-xs font-medium text-gray-800 flex-1">{r.title}</p>
                    <span className={"text-xs px-1 py-0.5 rounded-full whitespace-nowrap " + (r.type === "Book" ? "bg-purple-100 text-purple-700" : r.type === "Article" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700")}>{r.type}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{r.why}</p>
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