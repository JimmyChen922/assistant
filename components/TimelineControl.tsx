import { useMemo, useState, useEffect, useRef, FC } from "react";
import { Card } from "./Card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Brush } from 'recharts';
import { DATA_COLORS } from '../constants.ts';
import { LogData, FlightInfo } from "../types.ts";

interface TimelineControlProps {
    logData: LogData | null;
    flightInfo: FlightInfo | null;
    onTimeSync: (time: number | null) => void;
    syncTime: number | null;
    timeRange: { start: number; end: number } | null;
    onTimeRangeChange: (range: { start: number; end: number } | null) => void;
}

const formatRelativeTime = (tickItem: number) => {
    const ms = Math.round(tickItem);
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    const milliseconds = (ms % 1000).toString().padStart(3, '0');
    return `${minutes}:${seconds}.${milliseconds}`;
};

const formatTaipeiTime = (tickItem: number) => {
    const date = new Date(tickItem);
    const timeString = new Intl.DateTimeFormat('zh-TW', {
        timeZone: 'Asia/Taipei',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
    }).format(date);
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
    return `${timeString}.${milliseconds}`;
};

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
    </svg>
);

const PauseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);

const PlayheadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" 
        className="transform -rotate-90"
        style={{filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.6))'}}
    >
      <path fill="#a855f7" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
    </svg>
);

const TimelineControl: FC<TimelineControlProps> = ({ logData, flightInfo, onTimeSync, syncTime, timeRange, onTimeRangeChange }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

    const syncTimeRef = useRef(syncTime);
    useEffect(() => {
        syncTimeRef.current = syncTime;
    }, [syncTime]);

    const playbackSpeedRef = useRef(playbackSpeed);
    useEffect(() => {
        playbackSpeedRef.current = playbackSpeed;
    }, [playbackSpeed]);

    const brushData = useMemo(() => {
        if (!logData || !flightInfo) return [];
        const { takeoffTimestampMs, isRelativeTime } = flightInfo;

        const brushKey = logData['blackbox.receiver_panel.thr_value']?.length > 0 ? 'blackbox.receiver_panel.thr_value' : 'blackbox.motor[0]';
        const overviewData = logData[brushKey];

        if (!overviewData || overviewData.length === 0) {
            const firstAvailableKey = Object.keys(logData).find(key => logData[key]?.length > 0);
            if (firstAvailableKey) {
                return logData[firstAvailableKey].map(d => ({ x: isRelativeTime ? (d.x * 1000) : (takeoffTimestampMs + (d.x * 1000)), y: null }));
            }
            return [];
        }
        return overviewData.map(d => ({ x: isRelativeTime ? (d.x * 1000) : (takeoffTimestampMs + (d.x * 1000)), y: d.y }));
    }, [logData, flightInfo]);

    useEffect(() => {
        if (!isPlaying) return;

        let lastFrameTime = performance.now();
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            const deltaTime = timestamp - lastFrameTime;
            lastFrameTime = timestamp;

            const currentSyncTime = syncTimeRef.current;
            const playbackStart = timeRange?.start ?? brushData[0]?.x ?? 0;
            const playbackEnd = timeRange?.end ?? brushData[brushData.length - 1]?.x ?? 0;
            
            if (playbackEnd <= playbackStart) {
                setIsPlaying(false);
                return;
            }

            const newTime = (currentSyncTime ?? playbackStart) + (deltaTime * playbackSpeedRef.current);

            if (newTime >= playbackEnd) {
                onTimeSync(playbackEnd);
                setIsPlaying(false);
                setIsPaused(true);
            } else {
                onTimeSync(newTime);
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrameId);
    }, [isPlaying, brushData, timeRange, onTimeSync]);

    const tickFormatter = flightInfo?.isRelativeTime ? formatRelativeTime : formatTaipeiTime;

    const handleBrushMouseMove = (e: any) => {
        if (e && e.isTooltipActive && e.activeLabel) {
            if (isPlaying) {
                setIsPlaying(false);
                setIsPaused(true);
            }
            onTimeSync(e.activeLabel);
        }
    };

    const handleBrushMouseLeave = () => {
        if (!isPaused) {
            onTimeSync(null);
        }
    };

    const togglePlay = () => {
        const playbackEnd = timeRange?.end ?? brushData[brushData.length - 1]?.x ?? 0;
        
        if (syncTime !== null && syncTime >= playbackEnd) {
            const playbackStart = timeRange?.start ?? brushData[0]?.x ?? 0;
            onTimeSync(playbackStart);
        }

        if (isPlaying) {
            setIsPaused(true);
        } else {
            setIsPaused(false);
        }
        setIsPlaying(prev => !prev);
    };

    const handleBrushChange = (range: { startIndex?: number; endIndex?: number }) => {
        if (!brushData || brushData.length === 0) {
            onTimeRangeChange(null);
            return;
        }

        if (range.startIndex !== undefined && range.endIndex !== undefined) {
            const isFullRange = range.startIndex === 0 && range.endIndex === brushData.length - 1;
            
            if (isFullRange) {
                onTimeRangeChange(null);
            } else {
                const start = brushData[range.startIndex].x;
                const end = brushData[range.endIndex].x;
                onTimeRangeChange({ start, end });
            }
        } else {
            onTimeRangeChange(null);
        }
    };

    useEffect(() => {
        onTimeRangeChange(null);
        setIsPlaying(false);
        setIsPaused(false);
    }, [logData, onTimeRangeChange]);

    const playheadPosition = useMemo(() => {
        if (syncTime === null || !brushData || brushData.length < 2) {
            return '-100%';
        }
        const startTime = brushData[0].x;
        const endTime = brushData[brushData.length - 1].x;
        if (endTime === startTime) return '0%';

        const percentage = (syncTime - startTime) / (endTime - startTime);
        const clampedPercentage = Math.max(0, Math.min(1, percentage));
        
        return `calc(${clampedPercentage * 100}% - 1px)`;
    }, [syncTime, brushData]);

    const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sliderValue = parseFloat(e.target.value);
        const newSpeed = Math.pow(10, sliderValue / 100);
        setPlaybackSpeed(newSpeed);
    };

    const displaySpeed = playbackSpeed < 10 ? playbackSpeed.toFixed(1) : Math.round(playbackSpeed);
    const sliderValue = 100 * Math.log10(playbackSpeed);

    return (
        <Card>
            <div className="flex justify-between items-center border-b border-border pb-2 text-text-primary">
                <h2 className="text-lg font-semibold">時間軸調整</h2>
                {logData && brushData.length > 0 && (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 w-full max-w-[220px]">
                            <label htmlFor="playback-speed" className="text-sm text-text-secondary shrink-0">
                                速率:
                            </label>
                            <input
                                id="playback-speed"
                                type="range"
                                min="0"
                                max="300"
                                step="1"
                                value={sliderValue}
                                onChange={handleSpeedChange}
                                className="w-full h-2 bg-secondary/30 rounded-lg appearance-none cursor-pointer accent-primary non-printable"
                            />
                            <span className="font-semibold text-text-primary w-12 text-sm text-left">x{displaySpeed}</span>
                        </div>
                        <button
                            onClick={togglePlay}
                            className="flex items-center gap-2 bg-secondary text-white font-bold py-1 px-3 rounded-md hover:bg-opacity-80 transition-colors text-sm"
                            aria-label={isPlaying ? '暫停' : '播放'}
                        >
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                            <span>{isPlaying ? '暫停' : '播放'}</span>
                        </button>
                        <p className="text-xs text-text-secondary">
                            飛機機頭方向是相對, csv沒有機頭數據
                        </p>
                    </div>
                )}
            </div>
            {logData && brushData.length > 0 ? (
                <>
                    <div className="h-28 mt-4 -mb-4 relative">
                        {syncTime !== null && (
                            <div 
                                className="absolute top-0 h-full z-10 pointer-events-none"
                                style={{ left: playheadPosition }}
                            >
                                <div className="w-0.5 h-full bg-primary opacity-80"></div>
                                <div className="absolute top-1/2 -mt-7 -ml-2.5">
                                    <PlayheadIcon />
                                </div>
                            </div>
                        )}
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart 
                                data={brushData} 
                                syncMethod="value"
                                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                                onMouseMove={handleBrushMouseMove}
                                onMouseLeave={handleBrushMouseLeave}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="x" type="number" tickFormatter={tickFormatter} tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 10 }} padding={{ left: 10, right: 10 }} axisLine={false} tickLine={false} />
                                <YAxis hide domain={['dataMin', 'dataMax']} />
                                <Tooltip content={() => null} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }} />
                                <Line type="monotone" dataKey="y" name="油門/馬達" stroke={DATA_COLORS[0]} dot={false} strokeWidth={1.5} connectNulls={true} />
                                <Brush 
                                    dataKey="x" 
                                    height={40} 
                                    stroke="hsl(var(--primary))" 
                                    fill="hsla(var(--bkg), 0.5)"
                                    travellerWidth={10}
                                    gap={5}
                                    tickFormatter={tickFormatter}
                                    onChange={handleBrushChange}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-sm text-text-secondary mt-2 text-center">在此預覽圖上拖曳或縮放選取框，即可調整下方圖表的時間範圍。</p>
                </>
            ) : (
                <p className="text-sm text-text-secondary mt-2">在圖表上使用滑鼠滾輪或雙指縮放手勢進行縮放。點擊並拖動以平移時間軸。所有圖表皆已同步。</p>
            )}
        </Card>
    );
};

export default TimelineControl;
