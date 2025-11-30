
import React, { useEffect, useRef, useCallback } from 'react';
import { FlightPathPoint } from '../types.ts';

declare const Cesium: any;

interface CesiumViewerProps {
    flightPath: FlightPathPoint[] | null;
}

export const CesiumViewer: React.FC<CesiumViewerProps> = ({ flightPath }) => {
    const cesiumContainerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<any>(null);
    const dataSourceRef = useRef<any>(null);

    // Effect for one-time viewer initialization
    useEffect(() => {
        if (cesiumContainerRef.current && typeof Cesium !== 'undefined' && !viewerRef.current) {
            const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
                imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
                    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
                }),
                terrainProvider: new Cesium.CesiumTerrainProvider({
                    url: Cesium.IonResource.fromAssetId(1),
                }),
                animation: false,
                baseLayerPicker: true,
                fullscreenButton: true,
                geocoder: false,
                homeButton: true,
                infoBox: false,
                sceneModePicker: true,
                selectionIndicator: false,
                timeline: false,
                navigationHelpButton: true, // Enable the navigation help button
            });
            viewerRef.current = viewer;

            const dataSource = new Cesium.CustomDataSource('flightPathData');
            viewer.dataSources.add(dataSource);
            dataSourceRef.current = dataSource;
            
            viewer.resolutionScale = window.devicePixelRatio;
            viewer.scene.postProcessStages.fxaa.enabled = true;

            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(121.5, 23.9, 1500000),
                duration: 0
            });
        }

        return () => {
            if (viewerRef.current) {
                viewerRef.current.destroy();
                viewerRef.current = null;
            }
        };
    }, []);

    const handleZoomToPath = useCallback(() => {
        const viewer = viewerRef.current;
        const dataSource = dataSourceRef.current;
        if (viewer && dataSource && dataSource.entities.values.length > 0) {
            viewer.flyTo(dataSource, {
                duration: 1.5,
            });
        }
    }, []);

    useEffect(() => {
        const viewer = viewerRef.current;
        const dataSource = dataSourceRef.current;
        if (!viewer || !dataSource) return;

        dataSource.entities.removeAll();

        if (flightPath && flightPath.length >= 2) {
            const positions = flightPath.flatMap(p => [p.lng, p.lat, p.alt]);
            const cartesianPositions = Cesium.Cartesian3.fromDegreesArrayHeights(positions);

            dataSource.entities.add({
                name: 'Flight Path',
                polyline: {
                    positions: cartesianPositions,
                    width: 3,
                    material: Cesium.Color.fromCssColorString('#3b82f6'),
                    clampToGround: false,
                },
            });

            const startPoint = flightPath[0];
            dataSource.entities.add({
                position: Cesium.Cartesian3.fromDegrees(startPoint.lng, startPoint.lat, startPoint.alt),
                point: {
                    pixelSize: 12,
                    color: Cesium.Color.fromCssColorString('#22c55e'),
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
                label: {
                    text: '起點',
                    font: '14pt sans-serif',
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -12),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
            });

            const endPoint = flightPath[flightPath.length - 1];
            dataSource.entities.add({
                position: Cesium.Cartesian3.fromDegrees(endPoint.lng, endPoint.lat, endPoint.alt),
                point: {
                    pixelSize: 12,
                    color: Cesium.Color.fromCssColorString('#ef4444'),
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
                label: {
                    text: '終點',
                    font: '14pt sans-serif',
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -12),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
            });

            handleZoomToPath();

        } else {
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(121.5, 23.9, 1500000),
                duration: 1.5,
            });
        }
    }, [flightPath, handleZoomToPath]);

    return (
        <div className="relative">
            <div 
                ref={cesiumContainerRef} 
                className="h-96 w-full rounded-lg overflow-hidden border border-border" 
            />
            {flightPath && flightPath.length >= 2 && (
                <button
                    onClick={handleZoomToPath}
                    className="absolute top-3 left-3 z-10 bg-content/70 backdrop-blur-sm text-text-primary px-3 py-1.5 rounded-md border border-border text-sm font-semibold hover:bg-content transition-all flex items-center gap-2"
                    title="縮放到完整航線"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <polyline points="8 11 11 11 11 8"></polyline>
                        <polyline points="14 11 11 11 11 14"></polyline>
                    </svg>
                    縮放到航線
                </button>
            )}
        </div>
    );
};