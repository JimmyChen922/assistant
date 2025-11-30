import { Fragment, useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Card } from "./Card";
import { CesiumViewer } from "./CesiumViewer";
import { FlightPathMap } from "./FlightPathMap";
import { ChartGroup, FlightInfo, FlightPathPoint, LogData } from "../types.ts";
import { FC } from "react";
import TimelineControl from "./TimelineControl";

interface TrackerMapProps {
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

    const TrackerMap: FC<TrackerMapProps> = ({logData,  flightInfo, flightPath, activeChartGroups, isDarkMode, isSmooth, onTimeSync, showCesium, syncTime}) => {
    return (
        <Fragment>
            {showCesium && (
                <Card>
                    <div className="flex justify-between items-center border-b border-border pb-2 mb-3">
                        <h2 className="text-lg font-semibold text-text-primary">Cesium 地圖</h2>
                    </div>
                    <CesiumViewer flightPath={flightPath} />
                </Card>
            )}
            <Card>
                <h2 className="text-lg font-semibold border-b border-border pb-2 mb-3 text-text-primary">Leaflet 地圖</h2>
                {logData ? (
                    <FlightPathMap flightPath={flightPath} syncTime={syncTime} flightInfo={flightInfo} />
                ) : (
                    <div className="flex items-center justify-center h-[40rem] text-text-secondary">
                        請先上傳日誌檔案以顯示飛行軌跡。
                    </div>
                )}
            </Card>
            {/* <TimelineControl 
                logData={logData}
                flightInfo={flightInfo}
                onTimeSync={onTimeSync}
                syncTime={syncTime}
            /> */}
        </Fragment>
    );
};

export default TrackerMap;