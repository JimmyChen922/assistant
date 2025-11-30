import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from './Card.tsx';

const getFormattedDateTime = () => {
    const now = new Date();
    // Adjust for timezone offset to get local time in a format suitable for datetime-local input
    const tzOffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
};

interface RmaInfoProps {
    addActionLog: (message: string) => void;
}

export const RmaInfo: React.FC<RmaInfoProps> = ({ addActionLog }) => {
    const [repairTime, setRepairTime] = useState(getFormattedDateTime());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Function to get the canvas 2D context, memoized with useCallback
    const getCtx = useCallback(() => canvasRef.current?.getContext('2d'), []);

    // Effect for setting up canvas when modal opens
    useEffect(() => {
        if (!isModalOpen) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        let observer: MutationObserver | null = null;
        // Use a timeout to ensure the modal and canvas are fully rendered and have dimensions
        const timer = setTimeout(() => {
            const setCanvasStyle = () => {
                const ctx = getCtx();
                if (!ctx) return;
                const { width, height } = canvas.getBoundingClientRect();
                
                const dpr = window.devicePixelRatio || 1;
                canvas.width = width * dpr;
                canvas.height = height * dpr;
                
                ctx.scale(dpr, dpr);
                
                ctx.lineCap = 'round';
                ctx.lineWidth = 2;
                ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#0f172a'; // slate-200 / slate-900
            };

            setCanvasStyle();

            // Correctly set up and tear down the observer
            observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class' && mutation.target === document.documentElement) {
                        setCanvasStyle(); // Re-apply styles on theme change
                    }
                });
            });
            observer.observe(document.documentElement, { attributes: true });

        }, 50); // Small delay to ensure correct layout measurement

        // Cleanup function for the useEffect hook
        return () => {
            clearTimeout(timer);
            if (observer) {
                observer.disconnect();
            }
        };
    }, [isModalOpen, getCtx]);


    const getCoords = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        
        let clientX, clientY;
        if ('touches' in e.nativeEvent) {
             clientX = e.nativeEvent.touches[0].clientX;
             clientY = e.nativeEvent.touches[0].clientY;
        } else {
             clientX = e.nativeEvent.clientX;
             clientY = e.nativeEvent.clientY;
        }
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const coords = getCoords(e);
        if (!coords) return;
        const ctx = getCtx();
        if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const coords = getCoords(e);
        if (!coords) return;
        const ctx = getCtx();
        if (!ctx) return;
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
    };
    
    const stopDrawing = useCallback(() => {
        const ctx = getCtx();
        if (!ctx) return;
        ctx.closePath();
        setIsDrawing(false);
    }, [getCtx]);

    // Effect to handle stopping drawing when mouse/touch is released anywhere on the page
    useEffect(() => {
        if (!isDrawing) return; // Only add listeners when drawing starts

        const handleUp = () => {
            stopDrawing();
        };

        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchend', handleUp);
        
        return () => {
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchend', handleUp);
        };
    }, [isDrawing, stopDrawing]);

    const clearModalCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = getCtx();
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    
    const handleSaveSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            // Check if canvas is empty before saving
            const blank = document.createElement('canvas');
            const dpr = window.devicePixelRatio || 1;
            blank.width = canvas.width;
            blank.height = canvas.height;

            if (canvas.toDataURL() === blank.toDataURL()) {
                setSignatureDataUrl(null);
                 addActionLog('簽名為空，已清除。');
            } else {
                setSignatureDataUrl(canvas.toDataURL('image/png'));
                addActionLog('簽名已儲存。');
            }
        }
        setIsModalOpen(false);
    };

    const clearSavedSignature = () => {
        setSignatureDataUrl(null);
        addActionLog('簽名已清除。');
    };

    const handleSaveHtml = () => {
        addActionLog('正在將頁面另存為獨立的 HTML 檔案。');

        const clonedHtml = document.documentElement.cloneNode(true) as HTMLElement;

        // --- Preserve form input values ---
        const rpNumberInput = document.getElementById('rp-number') as HTMLInputElement;
        const modelInput = document.getElementById('repair-model') as HTMLInputElement;
        const notesArea = document.getElementById('notes-area') as HTMLTextAreaElement;

        const clonedRpNumberInput = clonedHtml.querySelector('#rp-number') as HTMLInputElement;
        if (clonedRpNumberInput && rpNumberInput) clonedRpNumberInput.setAttribute('value', rpNumberInput.value);

        const clonedModelInput = clonedHtml.querySelector('#repair-model') as HTMLInputElement;
        if (clonedModelInput && modelInput) clonedModelInput.setAttribute('value', modelInput.value);

        const clonedNotesArea = clonedHtml.querySelector('#notes-area') as HTMLTextAreaElement;
        if (clonedNotesArea && notesArea) {
             clonedNotesArea.style.display = 'none'; // hide textarea
             const notesPrintContent = clonedHtml.querySelector('#notes-print-content');
             if (notesPrintContent) {
                notesPrintContent.classList.remove('hidden');
                (notesPrintContent as HTMLElement).innerText = notesArea.value;
             }
        }
        
        // --- Handle signature ---
        const signatureContainerInteractive = clonedHtml.querySelector('#signature-container-interactive');
        signatureContainerInteractive?.remove(); // Remove interactive elements

        const signaturePrintArea = clonedHtml.querySelector('#signature-print-area');
        if (signaturePrintArea) {
            if (signatureDataUrl) {
                const img = document.createElement('img');
                img.src = signatureDataUrl;
                img.alt = "Inspector's Signature";
                img.style.width = '100%';
                img.style.height = 'auto';
                img.style.maxHeight = '80px';
                img.style.border = '1px solid #ccc';
                img.style.borderRadius = '0.375rem';
                img.style.objectFit = 'contain';
                signaturePrintArea.appendChild(img);
            } else {
                 signaturePrintArea.innerHTML = `<div style="width: 100%; height: 80px; border: 1px dashed #ccc; border-radius: 0.375rem; display: flex; align-items: center; justify-content: center; color: #999; font-family: sans-serif; font-size: 14px;">（未簽名）</div>`;
            }
        }
        
        // --- Cleanup for save ---
        clonedHtml.querySelectorAll('.non-printable').forEach(el => el.remove());
        clonedHtml.querySelectorAll('script').forEach(el => el.remove());
        
        const htmlString = '<!DOCTYPE html>\n' + clonedHtml.outerHTML;
        const blob = new Blob([htmlString], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flight-log-analysis-${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Card>
            <h2 className="text-lg font-semibold border-b border-border pb-2 mb-4 text-text-primary">RMA 資訊</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="rp-number" className="block text-sm font-medium text-text-secondary mb-1">RP 單號</label>
                    <input type="text" id="rp-number" className="w-full p-2 bg-bkg border border-border rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition" placeholder="請輸入 RP 單號"/>
                </div>
                <div>
                    <label htmlFor="repair-time" className="block text-sm font-medium text-text-secondary mb-1">檢測時間</label>
                    <input type="datetime-local" id="repair-time" value={repairTime} readOnly className="w-full p-2 bg-bkg border border-border rounded-md text-text-secondary"/>
                </div>
                <div>
                    <label htmlFor="repair-model" className="block text-sm font-medium text-text-secondary mb-1">產品型號</label>
                    <input type="text" id="repair-model" className="w-full p-2 bg-bkg border border-border rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition" placeholder="請輸入產品型號"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">檢測人員簽名</label>
                    <div id="signature-container-interactive" className="non-printable">
                       {signatureDataUrl ? (
                            <div>
                                <img src={signatureDataUrl} alt="已簽名" className="h-20 w-full object-contain border border-border rounded-md bg-bkg" />
                                <div className="flex justify-between items-center mt-1">
                                    <button onClick={() => setIsModalOpen(true)} className="text-sm text-primary hover:underline">
                                        重新簽名
                                    </button>
                                    <button onClick={clearSavedSignature} className="text-sm text-primary hover:underline">
                                        清除簽名
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setIsModalOpen(true)} className="w-full h-20 bg-bkg border-2 border-dashed border-border rounded-md flex items-center justify-center text-text-secondary hover:bg-border transition-colors">
                                點此簽名
                            </button>
                        )}
                    </div>
                    {/* This div is specifically for the final saved HTML file */}
                    <div id="signature-print-area"></div>
                </div>
                <button onClick={handleSaveHtml} className="non-printable w-full bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-primary-hover transition-colors">
                    另存為 HTML 檔案
                </button>
            </div>
            
            {/* Signature Modal */}
            {isModalOpen && (
                <div className="non-printable fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
                    <div className="bg-content p-5 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4 text-text-primary">請在此處簽名</h3>
                        <canvas
                            ref={canvasRef}
                            id="signature-canvas"
                            className="w-full h-48 bg-bkg border border-border rounded-md cursor-crosshair touch-none"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button onClick={clearModalCanvas} className="bg-secondary text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors">
                                清除
                            </button>
                            <button onClick={() => setIsModalOpen(false)} className="bg-gray-300 dark:bg-gray-600 text-text-primary font-bold py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors">
                                取消
                            </button>
                             <button onClick={handleSaveSignature} className="bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-primary-hover transition-colors">
                                儲存簽名
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};