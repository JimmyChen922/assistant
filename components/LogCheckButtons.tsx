
import React from 'react';
import { Card } from './Card.tsx';
import { ChartGroup } from '../types.ts';

interface LogCheckButtonsProps {
    activeChartGroups: ChartGroup[];
    onChartGroupToggle: (group: ChartGroup) => void;
    addActionLog: (message: string) => void;
    disabled: boolean;
}

const buttons: { group: ChartGroup; label: string }[] = [
    { group: 'power', label: '電源與電力系統' },
    { group: 'flight_control', label: '飛行控制系統' },
    { group: 'impact', label: '撞擊分析' },
    { group: 'control_input', label: '控制輸入' },
];

export const LogCheckButtons: React.FC<LogCheckButtonsProps> = ({ activeChartGroups, onChartGroupToggle, addActionLog, disabled }) => {
    
    const handleClick = (group: ChartGroup, label: string) => {
        if (disabled) {
            alert('請先上傳並分析日誌檔案。');
            return;
        }
        const wasActive = activeChartGroups.includes(group);
        onChartGroupToggle(group);
        addActionLog(`${wasActive ? '隱藏' : '顯示'}圖表群組：${label}`);
    };

    return (
        <Card>
            <h2 className="text-lg font-semibold border-b border-border pb-2 mb-4 text-text-primary">日誌檢查功能</h2>
            <div className="non-printable grid grid-cols-1 sm:grid-cols-2 gap-3">
                {buttons.map(({ group, label }) => (
                    <button
                        key={group}
                        onClick={() => handleClick(group, label)}
                        disabled={disabled}
                        className={`w-full font-bold py-2 px-4 rounded-md transition-colors text-sm
                            ${activeChartGroups.includes(group) && !disabled ? 'bg-primary text-white' : 'bg-bkg hover:bg-border text-text-primary'}
                            ${disabled ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : ''}
                        `}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </Card>
    );
};