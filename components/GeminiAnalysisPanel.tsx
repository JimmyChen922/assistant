
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { generateFlightSummary } from '../services/flightFeatureExtractor.ts';
import { FlightSummary } from '../types.ts';

// Make sure the 'marked' library is loaded in your index.html
declare const marked: any;

const PRESET_PROMPTS = [
    { 
        label: '總體飛行摘要', 
        value: '請根據這份 CSV 飛行日誌數據，提供一個總體飛行摘要。總結關鍵的飛行指標，例如飛行持續時間、最大高度、最大速度等。' 
    },
    { 
        label: '異常偵測', 
        value: '請分析這份 CSV 飛行日誌，找出任何可能的異常或潛在問題。請關注震動值 (vibr_x, vibr_y, vibr_z)、錯誤碼 (error)、馬達輸出 (motor_*) 和姿態角 (roll, pitch) 的劇烈變化。' 
    },
    { 
        label: '電源系統分析', 
        value: '請分析這份日誌中的電源系統表現。檢查電變電流 (esc*_current)、電壓 (esc*_voltage) 和溫度 (esc*_temperature) 數據，並指出任何不平衡或異常的讀數。' 
    },
    { 
        label: '尋找墜機點', 
        value: '這架無人機可能發生了撞擊。請分析日誌數據，特別是 is_armed 狀態、震動值 (vibr_*) 和陀螺儀數據 (gyro_*)，以識別最可能的撞擊時間點。' 
    },
];

interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
}

const FlightInsightsDashboard: React.FC<{ summary: FlightSummary }> = ({ summary }) => {
    const saturatedMotors = summary.motorStats.filter(m => m.saturatedDuration > 1.0).length;
    const hasCriticalEvents = summary.events.some(e => e.type === 'ERROR' || e.type === 'FAILSAFE' || e.type === 'IMPACT_DETECTED');

    // Helper to determine color based on voltage (using the simple 4S logic from extractor or generic)
    const getVoltageColor = (v: number) => {
        if (v < 13.0 && v > 10) return 'text-red-500 font-bold'; // Likely 4S critical
        if (v < 3.3) return 'text-red-500 font-bold'; 
        return 'text-text-primary';
    };

    return (
        <div className="bg-bkg/50 p-5 rounded-lg mb-6 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-2">
                 <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    AI 預分析摘要 (Pre-analysis Insights)
                 </h3>
                 <span className="text-xs text-text-secondary">基於特徵工程邏輯自動生成</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                {/* Metric 1: Battery */}
                <div className="bg-content p-4 rounded-lg border border-border h-28 flex flex-col justify-between">
                    <div className="text-text-secondary font-medium">最低電壓 (Min V)</div>
                    <div className={`font-mono text-3xl ${getVoltageColor(summary.battery.minVoltage)}`}>
                        {summary.battery.minVoltage.toFixed(1)}V
                    </div>
                    <div className="text-xs text-text-secondary">
                        Max Current: <span className={summary.battery.maxCurrent > 40 ? "text-orange-500 font-bold" : ""}>{summary.battery.maxCurrent.toFixed(1)}A</span>
                    </div>
                </div>

                {/* Metric 2: Vibration */}
                <div className="bg-content p-4 rounded-lg border border-border h-28 flex flex-col justify-between">
                    <div className="text-text-secondary font-medium">最大震動 (Max Vib Z)</div>
                    <div className={`font-mono text-3xl ${summary.vibration.maxZ > 60 ? 'text-red-500' : 'text-text-primary'}`}>
                        {summary.vibration.maxZ.toFixed(1)}
                    </div>
                    <div className="text-xs text-text-secondary">單位: m/s²</div>
                </div>

                {/* Metric 3: GPS & Motors */}
                <div className="bg-content p-4 rounded-lg border border-border h-28 flex flex-col justify-between">
                    <div className="text-text-secondary font-medium">衛星數 / 馬達飽和</div>
                    <div className="flex items-baseline gap-2">
                        <span className={`font-mono text-3xl ${summary.gpsStats.minSatellites < 6 ? 'text-orange-500' : 'text-text-primary'}`}>
                            {summary.gpsStats.minSatellites}
                        </span>
                        <span className="text-text-secondary text-xl">/</span>
                         <span className={`font-mono text-3xl ${saturatedMotors > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {saturatedMotors}
                        </span>
                    </div>
                    <div className="text-xs text-text-secondary">
                        Satellites / Sat. Motors
                    </div>
                </div>

                 {/* Metric 4: Events Count */}
                <div className="bg-content p-4 rounded-lg border border-border h-28 flex flex-col justify-between">
                    <div className="text-text-secondary font-medium">關鍵事件</div>
                    <div className={`font-mono text-3xl ${hasCriticalEvents ? 'text-red-500' : 'text-green-500'}`}>
                        {summary.events.length}
                    </div>
                     <div className="text-xs text-text-secondary">
                        Detected Events
                    </div>
                </div>
            </div>

            {/* Event List - Doubled Height */}
            {summary.events.length > 0 ? (
                <div className="bg-content rounded-lg border border-border max-h-64 overflow-y-auto custom-scrollbar shadow-inner">
                    {summary.events.map((e, i) => (
                        <div key={i} className="flex gap-3 border-b border-border/50 last:border-0 p-3 text-sm hover:bg-secondary/5 transition-colors items-start">
                            <span className="font-mono text-primary shrink-0 w-16 text-right font-bold mt-0.5">T+{e.timestamp.toFixed(0)}s</span>
                            <div className="flex-1 min-w-0">
                                <span className={`font-bold mr-2 uppercase tracking-wide text-xs px-1.5 py-0.5 rounded ${
                                    e.type === 'ERROR' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 
                                    e.type === 'FAILSAFE' ? 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200' : 
                                    e.type === 'BATTERY_WARNING' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                                    e.type === 'HIGH_VIBRATION' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                    e.type === 'MODE_CHANGE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                }`}>
                                    {e.type.replace('_', ' ')}
                                </span>
                                <span className="text-text-primary block mt-1">{e.description}</span>
                            </div>
                            {e.value !== undefined && <span className="text-text-secondary font-mono shrink-0 text-xs mt-1 bg-bkg px-1 rounded border border-border">{e.value}</span>}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-sm text-text-secondary py-4 bg-content rounded-lg border border-border">
                    未偵測到顯著異常事件
                </div>
            )}
        </div>
    );
};

export const GeminiAnalysisPanel: React.FC<{ rawData: any[] | null }> = ({ rawData }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [summary, setSummary] = useState<FlightSummary | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Pre-calculate summary when rawData changes
    useEffect(() => {
        if (rawData && rawData.length > 0) {
            try {
                const calculatedSummary = generateFlightSummary(rawData);
                setSummary(calculatedSummary);
                console.log("Flight Summary Generated:", calculatedSummary);
            } catch (e) {
                console.error("Failed to generate flight summary:", e);
            }
        }
    }, [rawData]);

    const handlePromptSelect = (prompt: string) => {
        setInput(prompt);
    };

    const handleSendMessage = useCallback(async () => {
        if (!rawData || rawData.length === 0) {
            setError('沒有可供分析的日誌數據。');
            return;
        }
        if (!input.trim()) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            // --- Feature Engineering / Context Construction ---
            const summaryContext = summary ? JSON.stringify(summary, null, 2) : "Summary calculation failed.";
            const dataSubset = rawData.slice(0, 800); 
            const csvString = (window as any).Papa.unparse(dataSubset);
            
            const systemInstruction = `
                You are an expert drone flight log analyst (Agent).
                
                ### PHASE 1: PRE-COMPUTED FEATURES
                I have already processed the log file and extracted the following key statistics and events for you. 
                Use this high-level summary to guide your analysis before looking at the raw CSV rows.
                
                \`\`\`json
                ${summaryContext}
                \`\`\`
                
                ### PHASE 2: RAW DATA SAMPLE
                Here are the first ${dataSubset.length} rows of the raw CSV data for detailed inspection of the flight start.
                If the user asks about specific timestamps found in the "events" list above, rely on the event timestamps.
                
                \`\`\`csv
                ${csvString}
                \`\`\`

                ### INSTRUCTIONS
                1. Answer the user's questions based on the provided Data Summary and CSV.
                2. If the user asks about "crashes" or "errors", check the 'events' list in the JSON summary first.
                3. Format your response using Markdown. Use bold text for key metrics.
                4. Be concise and professional.
            `;

            const apiKey = import.meta.env.VITE_API_KEY;
            const ai = new GoogleGenAI({ apiKey });
            
            // Map internal message history to Gemini SDK format
            const history = messages.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.text }]
            }));

            const chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { 
                    systemInstruction: systemInstruction,
                },
                history: history
            });
            
            const result = await chat.sendMessage({ message: userMessage.text });
            const responseText = result.text;

            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: responseText || "No response text.",
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);

        } catch (e: any) {
            console.error(e);
            setError(`分析時發生錯誤: ${e.message}`);
             setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: `⚠️ 發生錯誤：${e.message}`,
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [rawData, input, messages, summary]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const clearChat = () => {
        if (window.confirm('確定要清除對話紀錄嗎？')) {
            setMessages([]);
        }
    };

    return (
        <div className="flex flex-col h-[1400px]">
            {!rawData ? (
                 <div className="flex items-center justify-center h-full bg-bkg rounded-md">
                    <p className="text-text-secondary">請先上傳日誌檔案以啟用 AI 對話分析功能。</p>
                </div>
            ) : (
                <>
                    {/* Flight Insights Dashboard (Phase 1 Visualization) */}
                    {summary && <FlightInsightsDashboard summary={summary} />}

                    {/* Chat History Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bkg rounded-md border border-border mb-4">
                        {messages.length === 0 && (
                            <div className="text-center text-text-secondary py-10 opacity-60">
                                <p>👋 我是您的 AI 飛行日誌分析助手。</p>
                                <p>上方儀表板顯示了自動提取的飛行特徵。</p>
                                <p>您可以直接詢問細節，例如「T+150s 發生了什麼事？」</p>
                            </div>
                        )}
                        
                        {messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div 
                                    className={`
                                        max-w-[85%] rounded-lg p-3 text-sm
                                        ${msg.role === 'user' 
                                            ? 'bg-primary text-white rounded-br-none' 
                                            : 'bg-content border border-border text-text-primary rounded-bl-none shadow-sm'
                                        }
                                    `}
                                >
                                    {msg.role === 'model' ? (
                                         <div 
                                            className="prose prose-sm dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }}
                                        />
                                    ) : (
                                        <div className="whitespace-pre-wrap">{msg.text}</div>
                                    )}
                                    <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-text-secondary'}`}>
                                        {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                            </div>
                        ))}
                         {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-content border border-border rounded-lg rounded-bl-none p-3 shadow-sm">
                                    <div className="flex space-x-2 items-center">
                                        <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="space-y-3">
                         {/* Preset Chips */}
                        <div className="flex flex-wrap gap-2">
                             {PRESET_PROMPTS.map(p => (
                                <button
                                    key={p.label}
                                    onClick={() => handlePromptSelect(p.value)}
                                    disabled={isLoading}
                                    className="px-3 py-1 text-xs bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 text-text-primary rounded-full transition-colors whitespace-nowrap"
                                >
                                    {p.label}
                                </button>
                            ))}
                             {messages.length > 0 && (
                                <button 
                                    onClick={clearChat}
                                    className="px-3 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-full ml-auto transition-colors"
                                >
                                    清除對話
                                </button>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                                className="flex-1 h-12 min-h-[48px] max-h-32 p-3 bg-bkg border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition resize-none text-sm"
                                placeholder="輸入問題..."
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isLoading || !input.trim()}
                                className="bg-primary text-white w-12 h-12 rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                title="發送"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                            </button>
                        </div>
                        
                        {error && <p className="text-red-500 text-xs">{error}</p>}
                    </div>
                </>
            )}
        </div>
    );
};
