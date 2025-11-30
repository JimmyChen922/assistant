import React, { useRef } from 'react';
import { Card } from './Card.tsx';
import { FlightInfo } from '../types.ts';

interface LogInfoProps {
    onFileParse: (file: File) => void;
    fileName: string;
    flightInfo: FlightInfo | null;
    isLoading: boolean;
    error: string;
    isSmooth: boolean;
    setIsSmooth: (smooth: boolean) => void;
    toggleTheme: () => void;
    showCesium: boolean;
    setShowCesium: (show: boolean) => void;
}

export const LogInfo: React.FC<LogInfoProps> = ({
    onFileParse,
    fileName,
    flightInfo,
    isLoading,
    error,
    isSmooth,
    setIsSmooth,
    toggleTheme,
    showCesium,
    setShowCesium,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileParse(file);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <Card>
            <h2 className="text-lg font-semibold border-b border-border pb-2 mb-4 text-text-primary">日誌資訊</h2>
            <p className="text-sm text-text-secondary mb-3">上傳從飛行日誌解析出的 <strong>.csv</strong> 檔案。</p>
            
            <input
                type="file"
                id="log-file-input"
                name="log-file-input"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
                disabled={isLoading}
            />
            <button
                onClick={handleButtonClick}
                disabled={isLoading}
                className="non-printable w-full bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-primary-hover transition-colors disabled:bg-gray-400"
            >
                {isLoading ? '解析中...' : (fileName ? '上傳並分析新日誌' : '上傳並分析日誌')}
            </button>

            <div className="mt-4 text-sm">
                {fileName && <p className="truncate"><strong>已選擇：</strong> {fileName}</p>}
                {flightInfo && (
                    <div className="mt-2 space-y-1">
                        <p><strong>起槳時間 (台北)：</strong> {flightInfo.takeoffTime}</p>
                        <p><strong>總飛行時間：</strong> {flightInfo.totalDuration}</p>
                    </div>
                )}
                {error && <p className="text-red-500 mt-2">錯誤： {error}</p>}
            </div>

            <div className="mt-4 pt-4 border-t border-border space-y-3">
                 <label className="non-printable flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="smooth-curves" name="smooth-curves" checked={isSmooth} onChange={(e) => setIsSmooth(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                    <span className="text-text-secondary">平滑圖表曲線</span>
                 </label>
                 <label className="non-printable flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="show-cesium" name="show-cesium" checked={showCesium} onChange={(e) => setShowCesium(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                    <span className="text-text-secondary">啟用 3D 地圖 (可能影響效能)</span>
                 </label>
                 <button onClick={toggleTheme} className="non-printable w-full bg-secondary text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors">
                     切換深色/淺色模式
                 </button>
            </div>
        </Card>
    );
};