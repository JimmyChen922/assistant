
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { LogData, ChartGroup, ChartDefinition, FlightInfo, FlightPathPoint } from '../../types.ts';
import { CHART_DEFINITIONS, DATA_COLORS } from '../../constants.ts';
import { Card } from '../Card.tsx';
import { GeminiAnalysisPanel } from '../GeminiAnalysisPanel.tsx';
import TrackerMap from '../TrackerMap.tsx';
import TimelineControl from '../TimelineControl.tsx';
import { LogCheckButtons } from '../LogCheckButtons.tsx';
import { RightPanelTab } from './RightPanelConstant.ts';
import Weather from '../weather/Weather.tsx';

interface RightPanelProps {
    logData: LogData | null;
    flightInfo: FlightInfo | null;
    flightPath: FlightPathPoint[] | null;
    rawCsvData: any[] | null;
    activeChartGroups: ChartGroup[];
    isSmooth: boolean;
    onTimeSync: (time: number | null) => void;
    syncTime: number | null;
    isDarkMode: boolean;
    showCesium: boolean;
    onChartGroupToggle: (group: ChartGroup) => void;
    addActionLog: (message: string) => void;
}

const ChartPlaceholder: React.FC<{ message?: string }> = ({ message }) => (
    <div className="col-span-1 flex items-center justify-center bg-content border border-border rounded-lg h-96">
        <p className="text-text-secondary text-center p-4">{message || '請上傳日誌檔案並從左側選擇一個檢查項目以顯示圖表。'}</p>
    </div>
);

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

interface ChartProps {
    chartDef: ChartDefinition;
    data: any[];
    isSmooth: boolean;
    syncId: string;
    flightInfo: FlightInfo | null;
    timeRange: { start: number; end: number } | null;
}

const Chart: React.FC<ChartProps> = ({ chartDef, data, isSmooth, syncId, flightInfo, timeRange }) => {
    const { title, yLabel, yLabelRight, isStepped, datasets } = chartDef;

    const hasData = datasets.some(ds => data.some(p => p[ds.label] !== null && p[ds.label] !== undefined));

    if (!hasData) {
        return (
            <Card>
                <h3 className="text-md font-semibold text-center mb-2 text-text-primary">{title}</h3>
                <div className="flex items-center justify-center h-64 text-text-secondary">
                    日誌中不存在此數據欄位。
                </div>
            </Card>
        );
    }

    const tickFormatter = flightInfo?.isRelativeTime ? formatRelativeTime : formatTaipeiTime;
    const xLabel = flightInfo?.isRelativeTime ? '飛行時間 (mm:ss.SSS)' : '時間 (台北時間)';

    return (
        <Card className="h-full">
            <h3 className="text-md font-semibold text-center mb-2 text-text-primary select-none cursor-grab active:cursor-grabbing">{title}</h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} syncId={syncId} syncMethod="value" margin={{ top: 5, right: 30, left: 20, bottom: 15 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="x"
                            type="number"
                            domain={timeRange ? [timeRange.start, timeRange.end] : ['dataMin', 'dataMax']}
                            tickFormatter={tickFormatter}
                            tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 12 }}
                            label={{ value: xLabel, position: 'insideBottom', offset: 0, fill: 'hsl(var(--text-secondary))' }}
                            allowDataOverflow={true}
                        />
                        <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 12 }} label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: 'hsl(var(--text-secondary))' }} />
                        {yLabelRight && (
                            <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 12 }} label={{ value: yLabelRight, angle: 90, position: 'insideRight', fill: 'hsl(var(--text-secondary))' }} />
                        )}
                        <Tooltip
                            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                            contentStyle={{ backgroundColor: 'hsl(var(--content))', border: '1px solid hsl(var(--border))' }}
                            labelStyle={{ color: 'hsl(var(--text-primary))' }}
                            formatter={(value: any) => typeof value === 'number' ? value.toFixed(3) : null}
                            labelFormatter={tickFormatter}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                        {datasets.map((ds, index) => (
                            <Line
                                key={ds.key}
                                yAxisId={ds.yAxisId || 'left'}
                                type={isStepped ? 'stepAfter' : (isSmooth ? 'monotone' : 'linear')}
                                dataKey={ds.label}
                                name={ds.label}
                                stroke={DATA_COLORS[index % DATA_COLORS.length]}
                                dot={false}
                                strokeWidth={2}
                                connectNulls={false}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export const RightPanel: React.FC<RightPanelProps> = ({ logData, flightInfo, flightPath, rawCsvData, activeChartGroups, isSmooth, onTimeSync, syncTime, isDarkMode, showCesium, onChartGroupToggle, addActionLog }) => {
    const [timeRange, setTimeRange] = useState<{ start: number; end: number } | null>(null);
    const [visibleCharts, setVisibleCharts] = useState<ChartDefinition[]>([]);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const [hasApiKey, setHasApiKey] = useState(false);
    const [mainTab, setMainTab] = useState<RightPanelTab>(RightPanelTab.TrackerMap);
    const [selectedTab, setSelectedTab] = useState<string | number>('all');

    useEffect(() => {
        // This check must be safe for browser environments where `process` is not defined.
        // The Gemini panel will only be shown if an API key is present in the execution environment.
        // const apiKeyExists = typeof process !== 'undefined' && process.env && !!process.env.API_KEY;
        const apiKey = import.meta.env.VITE_API_KEY;
        const apiKeyExists = !!apiKey;
        setHasApiKey(apiKeyExists);
    }, []);

    // Update visible charts when groups change, but preserve order of existing charts
    useEffect(() => {
        const activeDefinitions = activeChartGroups.flatMap(group => CHART_DEFINITIONS[group]);
        setVisibleCharts(prev => {
            const activeIds = new Set(activeDefinitions.map(d => d.id));

            // Keep existing charts that are still active (preserves user order)
            const keptCharts = prev.filter(c => activeIds.has(c.id));
            const keptIds = new Set(keptCharts.map(c => c.id));

            // Add new charts
            const newCharts = activeDefinitions.filter(d => !keptIds.has(d.id));

            return [...keptCharts, ...newCharts];
        });
        // reset selected tab when chart list changes
        setSelectedTab('all');
    }, [activeChartGroups]);

    useEffect(() => {
        setTimeRange(null);
    }, [logData]);

    const prepareChartData = useCallback((chartDef: ChartDefinition): any[] => {
        if (!logData || !flightInfo) return [];

        const { takeoffTimestampMs, isRelativeTime } = flightInfo;
        const allX = new Set<number>();
        chartDef.datasets.forEach(ds => {
            if (logData[ds.key]) {
                logData[ds.key].forEach(p => allX.add(p.x));
            }
        });

        if (allX.size === 0) return [];

        const sortedX = Array.from(allX).sort((a, b) => a - b);

        const dataMaps = chartDef.datasets.map(ds => ({
            label: ds.label,
            map: new Map(logData[ds.key] ? logData[ds.key].map(p => [p.x, p.y]) : [])
        }));

        const mergedData = sortedX.map(x => {
            const point: any = { x: isRelativeTime ? (x * 1000) : (takeoffTimestampMs + (x * 1000)) };
            dataMaps.forEach(dm => {
                point[dm.label] = dm.map.get(x) ?? null;
            });
            return point;
        });

        return mergedData;
    }, [logData, flightInfo]);

    const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === index) return;

        const newOrder = [...visibleCharts];
        const [item] = newOrder.splice(draggedItemIndex, 1);
        newOrder.splice(index, 0, item);

        setVisibleCharts(newOrder);
        setDraggedItemIndex(index);
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDraggedItemIndex(null);
    };

    const onDragEnd = () => {
        setDraggedItemIndex(null);
    }

    useEffect(() => {
        // Ensure selected tab index stays valid when visibleCharts changes
        if (typeof selectedTab === 'number') {
            if (selectedTab < 0 || selectedTab >= visibleCharts.length) {
                setSelectedTab(visibleCharts.length > 0 ? 0 : 'all');
            }
        }
    }, [visibleCharts, selectedTab]);

    return (
        <div className="flex flex-col gap-6">
            {/* Main Tab Navigation */}
            <div className="flex gap-2 items-center border-b border-border pb-2">
                <button
                    onClick={() => setMainTab(RightPanelTab.TrackerMap)}
                    className={`px-4 py-2 rounded-t-md text-sm font-semibold transition-all ${mainTab === RightPanelTab.TrackerMap
                            ? 'bg-primary text-white'
                            : 'bg-content text-text-primary hover:bg-content-hover'
                        }`}
                    aria-pressed={mainTab === RightPanelTab.TrackerMap}
                >
                    🗺️ 地圖軌跡
                </button>
                <button
                    onClick={() => setMainTab(RightPanelTab.Report)}
                    className={`px-4 py-2 rounded-t-md text-sm font-semibold transition-all ${mainTab === RightPanelTab.Report
                            ? 'bg-primary text-white'
                            : 'bg-content text-text-primary hover:bg-content-hover'
                        }`}
                    aria-pressed={mainTab === RightPanelTab.Report}
                >
                    📊 報表
                </button>
                <button
                    onClick={() => setMainTab(RightPanelTab.Weather)}
                    className={`px-4 py-2 rounded-t-md text-sm font-semibold transition-all ${mainTab === RightPanelTab.Weather
                            ? 'bg-primary text-white'
                            : 'bg-content text-text-primary hover:bg-content-hover'
                        }`}
                    aria-pressed={mainTab === RightPanelTab.Weather}
                >
                    🌤️ 氣象
                </button>
                {hasApiKey && (
                    <button
                        onClick={() => setMainTab(RightPanelTab.GeminiAnalysis)}
                        className={`px-4 py-2 rounded-t-md text-sm font-semibold transition-all ${mainTab === RightPanelTab.GeminiAnalysis
                                ? 'bg-primary text-white'
                                : 'bg-content text-text-primary hover:bg-content-hover'
                            }`}
                        aria-pressed={mainTab === RightPanelTab.GeminiAnalysis}
                    >
                        Gemini助手
                    </button>
                )}
                
            </div>            {/* Map Tab Content */}
            {mainTab === RightPanelTab.TrackerMap && (
                <div className="flex flex-col gap-4">
                    <TrackerMap
                        logData={logData}
                        flightInfo={flightInfo}
                        flightPath={flightPath}
                        rawCsvData={rawCsvData}
                        activeChartGroups={activeChartGroups}
                        isSmooth={isSmooth}
                        onTimeSync={onTimeSync}
                        syncTime={syncTime}
                        isDarkMode={isDarkMode}
                        showCesium={showCesium}
                    />

                    <TimelineControl
                        logData={logData}
                        flightInfo={flightInfo}
                        onTimeSync={onTimeSync}
                        syncTime={syncTime}
                        timeRange={timeRange}
                        onTimeRangeChange={setTimeRange}
                    />
                </div>
            )}

            {/* Report Tab Content */}
            {mainTab === RightPanelTab.Report && (
                <div className="flex flex-col gap-4">
                    {/* Chart Group Selection Buttons */}
                    <LogCheckButtons
                        activeChartGroups={activeChartGroups}
                        onChartGroupToggle={onChartGroupToggle}
                        addActionLog={addActionLog}
                        disabled={!logData}
                    />

                    {/* Report Tabs */}
                    <div className="flex gap-2 items-center overflow-x-auto pb-2">
                        <button
                            onClick={() => setSelectedTab('all')}
                            className={`px-3 py-1 rounded-md text-sm font-medium ${selectedTab === 'all' ? 'bg-primary text-white' : 'bg-content text-text-primary'}`}
                            aria-pressed={selectedTab === 'all'}
                        >
                            全部
                        </button>
                        {visibleCharts.map((c, i) => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedTab(i)}
                                className={`px-3 py-1 rounded-md text-sm font-medium ${selectedTab === i ? 'bg-primary text-white' : 'bg-content text-text-primary'}`}
                                aria-pressed={selectedTab === i}
                            >
                                {c.title}
                            </button>
                        ))}
                    </div>
                    <TimelineControl
                        logData={logData}
                        flightInfo={flightInfo}
                        onTimeSync={onTimeSync}
                        syncTime={syncTime}
                        timeRange={timeRange}
                        onTimeRangeChange={setTimeRange}
                    />
                    {/* Report Content */}
                    {!logData ? (
                        <ChartPlaceholder />
                    ) : visibleCharts.length === 0 ? (
                        <ChartPlaceholder message="請從左側選擇一個或多個檢查項目以顯示圖表。" />
                    ) : (
                        <div>
                            {selectedTab === 'all' ? (
                                <div className="grid grid-cols-1 gap-6">
                                    {visibleCharts.map((chartDef, index) => (
                                        <div
                                            key={chartDef.id}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, index)}
                                            onDragOver={(e) => onDragOver(e, index)}
                                            onDrop={onDrop}
                                            onDragEnd={onDragEnd}
                                            className={`transition-all duration-200 ${draggedItemIndex === index ? 'opacity-50 scale-[0.99]' : 'opacity-100'}`}
                                            style={{ cursor: 'grab' }}
                                        >
                                            <Chart
                                                chartDef={chartDef}
                                                data={prepareChartData(chartDef)}
                                                isSmooth={isSmooth}
                                                syncId='sync-charts'
                                                flightInfo={flightInfo}
                                                timeRange={timeRange}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                // single chart view
                                (() => {
                                    const idx = typeof selectedTab === 'number' ? selectedTab : 0;
                                    const chartDef = visibleCharts[idx];
                                    return (
                                        <div className="transition-all duration-200">
                                            <Chart
                                                chartDef={chartDef}
                                                data={prepareChartData(chartDef)}
                                                isSmooth={isSmooth}
                                                syncId='sync-charts'
                                                flightInfo={flightInfo}
                                                timeRange={timeRange}
                                            />
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                    )}
                </div>
            )}

            {mainTab === RightPanelTab.GeminiAnalysis && hasApiKey && (
                <Card>
                    <h2 className="text-lg font-semibold border-b border-border pb-2 mb-4 text-text-primary">G小姐姐助理</h2>
                    <GeminiAnalysisPanel rawData={rawCsvData} />
                </Card>
            )}

            {mainTab === RightPanelTab.Weather && (
                <div className="flex flex-col gap-4">
                    <Weather isDarkMode={isDarkMode} />
                </div>
            )}
        </div>
    );
};
