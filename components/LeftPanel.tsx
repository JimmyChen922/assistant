
import React, { useEffect, useRef } from 'react';
import { ChartGroup, ActionLog, FlightInfo } from '../types.ts';
import { RmaInfo } from './RmaInfo.tsx';
import { LogInfo } from './LogInfo.tsx';
import { Card } from './Card.tsx';

interface LeftPanelProps {
    onFileParse: (file: File) => void;
    fileName: string;
    flightInfo: FlightInfo | null;
    isLoading: boolean;
    error: string;
    activeChartGroups: ChartGroup[];
    onChartGroupToggle: (group: ChartGroup) => void;
    isSmooth: boolean;
    setIsSmooth: (smooth: boolean) => void;
    toggleTheme: () => void;
    actionLogs: ActionLog[];
    addActionLog: (message: string) => void;
    hasLogData: boolean;
    rawCsvData: any[] | null;
    showCesium: boolean;
    setShowCesium: (show: boolean) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = (props) => {
    const { actionLogs, addActionLog } = props;
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [actionLogs]);

    return (
        <div className="flex flex-col gap-6">
            
            <div>
                <LogInfo {...props} />
            </div>
            
            <Card>
                <h2 className="text-lg font-semibold border-b border-border pb-2 mb-3 text-text-primary">筆記</h2>
                <textarea 
                    id="notes-area"
                    className="w-full h-24 p-2 bg-bkg border border-border rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition"
                    placeholder="記錄分析筆記..."
                ></textarea>
                <div id="notes-print-content" className="hidden"></div>
            </Card>

            <div>
                <Card>
                    <h2 className="text-lg font-semibold border-b border-border pb-2 mb-3 text-text-primary">網頁操作日誌</h2>
                    <div ref={logContainerRef} className="text-xs h-24 overflow-y-auto bg-bkg p-2 rounded-md font-mono text-text-secondary">
                        {actionLogs.map((log, i) => (
                            <p key={i}><span className="text-gray-500">{log.time.toLocaleTimeString()}</span>: {log.message}</p>
                        ))}
                    </div>
                </Card>
            </div>

            <RmaInfo addActionLog={addActionLog} />
        </div>
    );
};
