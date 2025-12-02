import React, { FC, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Weather.css';

interface WeatherData {
    '觀測時間': string;
    '溫度': string;
    '天氣': string;
    '風向': string;
    '風力': string;
    '陣風': string;
    '能見度': string;
    '相對溼度': string;
    '海平面氣壓': string;
    '累積雨量': string;
    '日照時數': string;
}

interface Station {
    name: string;
    lat: number;
    lng: number;
    code: string;
}
export interface WeatherProps {
    isDarkMode: boolean;
}
const Weather:FC<WeatherProps> = ({isDarkMode}) => {
    const mapRef = useRef<L.Map | null>(null);
    const highlightMarkerRef = useRef<L.Marker | null>(null);
    const weatherMarkersRef = useRef<L.Marker[]>([]);
    
    const [dateTime, setDateTime] = useState('');
    const [location, setLocation] = useState('鞍部');
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY || '';
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [windWarning, setWindWarning] = useState(false);

    const taiwanStations: Station[] = [
        { name: "台北", lat: 25.0330, lng: 121.5654, code: "台北" },
        { name: "台中", lat: 24.1477, lng: 120.6736, code: "台中" },
        { name: "高雄", lat: 22.6273, lng: 120.3014, code: "高雄" },
        { name: "基隆", lat: 25.1276, lng: 121.7395, code: "基隆" },
        { name: "新竹", lat: 24.8066, lng: 120.9686, code: "新竹" },
        { name: "嘉義", lat: 23.4871, lng: 120.4488, code: "嘉義" },
        { name: "台南", lat: 23.0000, lng: 120.2000, code: "台南" },
        { name: "花蓮", lat: 23.9739, lng: 121.6014, code: "花蓮" },
        { name: "台東", lat: 22.7554, lng: 121.1440, code: "台東" },
        { name: "宜蘭", lat: 24.7570, lng: 121.7530, code: "宜蘭" },
        { name: "桃園", lat: 24.9936, lng: 121.3010, code: "桃園" },
        { name: "新北", lat: 25.0169, lng: 121.4628, code: "新北" },
        { name: "苗栗", lat: 24.5601, lng: 120.8214, code: "苗栗" },
        { name: "彰化", lat: 24.0800, lng: 120.5400, code: "彰化" },
        { name: "南投", lat: 23.9100, lng: 120.6800, code: "南投" },
        { name: "雲林", lat: 23.7000, lng: 120.4300, code: "雲林" },
        { name: "屏東", lat: 22.6760, lng: 120.4900, code: "屏東" },
        { name: "澎湖", lat: 23.5694, lng: 119.5800, code: "澎湖" },
        { name: "金門", lat: 24.4500, lng: 118.3200, code: "金門" },
        { name: "連江", lat: 26.1500, lng: 119.9500, code: "連江" },
        { name: "鞍部", lat: 25.1833, lng: 121.5333, code: "鞍部" }
    ];

    // 初始化時間
    useEffect(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        setDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    }, []);

    // 初始化地圖
    useEffect(() => {
        if (!mapRef.current) {
            mapRef.current = L.map('map').setView([23.5, 121], 7);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapRef.current);
        }

        // 載入所有測站
        loadAllStationsWeather();

        return () => {
            // 清理
            weatherMarkersRef.current.forEach(marker => {
                if (mapRef.current) mapRef.current.removeLayer(marker);
            });
            weatherMarkersRef.current = [];
        };
    }, []);

    const formatValue = (value: any, unit = ''): string => {
        if (value === 'N/A' || value === null || value === undefined) {
            return 'N/A';
        }
        if (value === '-99' || value === -99) {
            return 'N/A';
        }
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            return 'N/A';
        }
        return numValue.toFixed(1) + unit;
    };

    const getTempClass = (temp: number): string => {
        if (temp >= 30) return 'temp-hot';
        if (temp >= 25) return 'temp-warm';
        if (temp >= 20) return 'temp-mild';
        if (temp >= 15) return 'temp-cool';
        return 'temp-cold';
    };

    const loadStationWeather = async (apiKeyStr: string, station: Station) => {
        try {
            // 檢查全站點數據是否已經在 allStationsData 中
            const stationData = allStationsData.current.find((s: any) => s.StationName === station.name || s.StationCode === station.code);
            if (!stationData) return;

            const weatherElements = stationData.WeatherElement;
            
            const temp = parseFloat(weatherElements.AirTemperature) || 0;
            const weather = weatherElements.Weather || 'N/A';
            const humidity = weatherElements.RelativeHumidity || 'N/A';
            
            const tempClass = getTempClass(temp);
            
            const customIcon = L.divIcon({
                className: `weather-icon ${tempClass}`,
                html: Math.round(temp) + '°',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            
            const marker = L.marker([station.lat, station.lng], { icon: customIcon })
                .bindPopup(`
                    <div style="text-align: center;">
                        <h6><strong>${station.name}</strong></h6>
                        <p><strong>溫度:</strong> ${temp.toFixed(1)}°C</p>
                        <p><strong>天氣:</strong> ${weather}</p>
                        <p><strong>溼度:</strong> ${humidity}%</p>
                        <button class="btn btn-sm btn-primary" onclick="window.queryStationWeather && window.queryStationWeather('${station.code}')">
                            查看詳細資料
                        </button>
                    </div>
                `);
            
            if (mapRef.current) {
                marker.addTo(mapRef.current);
            }
            weatherMarkersRef.current.push(marker);
            
        } catch (error) {
            console.log(`載入 ${station.name} 資料失敗:`, error);
        }
    };

    const allStationsData = useRef<any[]>([]);

    const loadAllStationsWeather = async () => {
        if (!apiKey) return;

        weatherMarkersRef.current.forEach(marker => {
            if (mapRef.current) mapRef.current.removeLayer(marker);
        });
        weatherMarkersRef.current = [];

        try {
            // 一次請求獲取所有測站數據
            const apiUrl = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=${apiKey}&format=JSON`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                console.error('API 請求失敗:', response.statusText);
                return;
            }
            
            const data = await response.json();
            if (!data.records || !data.records.Station || data.records.Station.length === 0) {
                console.log('未找到測站數據');
                return;
            }

            // 保存全部測站數據
            allStationsData.current = data.records.Station;

            // 根據 taiwanStations 處理每個測站
            const promises = taiwanStations.map(station => loadStationWeather(apiKey, station));
            await Promise.allSettled(promises);
        } catch (error) {
            console.error('載入測站天氣失敗:', error);
        }
    };

    const highlightLocationOnMap = (locationName: string) => {
        const station = taiwanStations.find(s => s.name === locationName || s.code === locationName);
        if (!station || !mapRef.current) return;

        if (highlightMarkerRef.current) {
            mapRef.current.removeLayer(highlightMarkerRef.current);
        }

        const highlightIcon = L.divIcon({
            className: 'highlight-marker',
            html: '<div style="background-color: #ff0000; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">📍</div>',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        highlightMarkerRef.current = L.marker([station.lat, station.lng], { icon: highlightIcon })
            .addTo(mapRef.current)
            .bindPopup(`<strong>${station.name}</strong><br>已選取此測站`);

        mapRef.current.setView([station.lat, station.lng], 10);
    };

    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocation(value);
        if (value.trim()) {
            highlightLocationOnMap(value);
        }
    };

    const queryStationWeather = (stationCode: string) => {
        setLocation(stationCode);
        // 延遲執行以確保狀態已更新
        setTimeout(() => {
            const form = document.querySelector('form') as HTMLFormElement;
            if (form) {
                form.dispatchEvent(new Event('submit', { bubbles: true }));
            }
        }, 0);
    };

    // 將 queryStationWeather 綁定到 window 全局對象
    useEffect(() => {
        (window as any).queryStationWeather = queryStationWeather;
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!apiKey.trim()) {
            setError('請輸入API授權碼');
            setSuccess(false);
            return;
        }

        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            const apiUrl = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=${apiKey}&StationName=${location}&format=JSON`;
            console.log('查詢API URL:', apiUrl);
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP錯誤: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.records || !data.records.Station || data.records.Station.length === 0) {
                throw new Error('找不到指定測站的資料');
            }
            
            const locationData = data.records.Station[0];
            const weatherElements = locationData.WeatherElement;
            const observationTime = locationData.ObsTime.DateTime;
            
            const newWeatherData: WeatherData = {
                '觀測時間': observationTime,
                '溫度': formatValue(weatherElements.AirTemperature, '°C'),
                '天氣': weatherElements.Weather || 'N/A',
                '風向': formatValue(weatherElements.WindDirection, '度'),
                '風力': formatValue(weatherElements.WindSpeed, 'm/s'),
                '陣風': formatValue(weatherElements.GustInfo?.PeakGustSpeed, 'm/s'),
                '能見度': weatherElements.VisibilityDescription || 'N/A',
                '相對溼度': formatValue(weatherElements.RelativeHumidity, '%'),
                '海平面氣壓': formatValue(weatherElements.AirPressure, '百帕'),
                '累積雨量': formatValue(weatherElements.Now?.Precipitation, '毫米'),
                '日照時數': formatValue(weatherElements.SunshineDuration, '小時')
            };
            
            setWeatherData(newWeatherData);
            setSuccess(true);

            // 檢查風速警告
            const windSpeed = parseFloat(newWeatherData['風力'].replace(/[^\d.-]/g, '')) || 0;
            const windGust = parseFloat(newWeatherData['陣風'].replace(/[^\d.-]/g, '')) || 0;
            setWindWarning(Math.max(windSpeed, windGust) >= 9);

            highlightLocationOnMap(location);
            
        } catch (err) {
            setError(err instanceof Error ? err.message : '無法獲取氣象資料');
            setSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshMap = () => {
        loadAllStationsWeather();
    };

    return (
        <div className="weather-container">
            <form onSubmit={handleSubmit} className="mb-3">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div className="weather-form-group md:col-span-2">
                        <label htmlFor="dateTime" className="weather-form-label">日期與時間</label>
                        <input 
                            type="datetime-local" 
                            className="weather-form-control" 
                            id="dateTime" 
                            value={dateTime}
                            onChange={(e) => setDateTime(e.target.value)}
                            required 
                        />
                    </div>
                    <div className="weather-form-group md:col-span-1">
                        <label htmlFor="location" className="weather-form-label">地點</label>
                        <input 
                            type="text" 
                            className="weather-form-control" 
                            id="location" 
                            value={location}
                            onChange={handleLocationChange}
                            placeholder="請輸入測站名稱"
                        />
                    </div>
                    {/* <div className="weather-form-group md:col-span-2">
                        <label htmlFor="apiKey" className="weather-form-label">API 授權碼</label>
                        <input 
                            type="password" 
                            className="weather-form-control" 
                            id="apiKey" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="請輸入CWA API授權碼" 
                            required 
                        />
                    </div> */}
                    <div className="weather-form-group md:col-span-1 flex flex-col justify-end">
                        <button type="submit" className="weather-btn weather-btn-primary w-full" disabled={loading}>
                            {loading && <span className="spinner-border"></span>}
                            {loading ? '查詢中...' : '查詢'}
                        </button>
                    </div>
                </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3">
                <button type="button" className="weather-btn weather-btn-success md:col-span-1" onClick={handleRefreshMap}>
                    更新站點資料
                </button>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    <strong>錯誤：</strong>{error}
                </div>
            )}

            {success && (
                <div className="alert alert-success" role="alert">
                    <strong>成功：</strong>資料載入完成！
                </div>
            )}

            <div className="weather-main-content">
                <div className="weather-left-panel">
                    <h4 className="text-center mb-3 text-lg font-semibold text-text-primary">氣象資料詳細資訊</h4>
                    <div className="table-container">
                        <table className={`weather-table ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
                            <thead>
                                <tr>
                                    <th>觀測時間</th>
                                    <th>溫度 (°C)</th>
                                    <th>天氣</th>
                                    <th>風向 (度)</th>
                                    <th>風力 (m/s)</th>
                                    <th>陣風 (m/s)</th>
                                    <th>能見度</th>
                                    <th>相對溼度 (%)</th>
                                    <th>海平面氣壓 (百帕)</th>
                                    <th>當日累積雨量 (毫米)</th>
                                    <th>日照時數 (小時)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {weatherData && (
                                    <tr>
                                        <td>{weatherData['觀測時間']}</td>
                                        <td>{weatherData['溫度']}</td>
                                        <td>{weatherData['天氣']}</td>
                                        <td>{weatherData['風向']}</td>
                                        <td className={parseFloat(weatherData['風力']) >= 9 ? 'wind-warning' : ''}>
                                            {weatherData['風力']}
                                        </td>
                                        <td className={parseFloat(weatherData['陣風']) >= 9 ? 'wind-warning' : ''}>
                                            {weatherData['陣風']}
                                        </td>
                                        <td>{weatherData['能見度']}</td>
                                        <td>{weatherData['相對溼度']}</td>
                                        <td>{weatherData['海平面氣壓']}</td>
                                        <td>{weatherData['累積雨量']}</td>
                                        <td>{weatherData['日照時數']}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {windWarning && (
                        <div className="wind-alert">
                            <i className="fas fa-exclamation-triangle"></i>
                            風速過大，不建議進行無人機操作
                        </div>
                    )}
                </div>

                <div className="weather-right-panel">
                    <h4 className="text-center mb-3 text-lg font-semibold text-text-primary">台灣地圖</h4>
                    <div className="map-container">
                        <div id="map"></div>
                        <div className="text-center mt-2">
                            <small className="text-text-secondary">點擊地圖上的測站圖標查看詳細天氣資訊</small>
                        </div>
                    </div>
                </div>
            </div>

            <div id="credit" className="weather-credit" onClick={() => alert('設計者：Erica\n版本：v1.0\n日期：2025-10-25')}>
                © 2025 Erica
            </div>
        </div>
    );
}

export default Weather;