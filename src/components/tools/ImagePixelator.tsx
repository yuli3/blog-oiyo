import React, { useState, useRef } from 'react';
import { GameContainer } from '../ui/game/GamePrimitives';

const ImagePixelator: React.FC<{ locale?: 'ko' | 'en' }> = ({ locale = 'ko' }) => {
    const t = {
        ko: { title: "이미지 픽셀 변환기", upload: "이미지 업로드", download: "저장하기", desc: "이미지를 픽셀화하여 개인정보를 보호하거나 예술적인 느낌을 줍니다.", size: "픽셀 크기" },
        en: { title: "Image Pixelator", upload: "Upload Image", download: "Save", desc: "Pixelate images to protect privacy or create an artistic pixel-art look.", size: "Pixel Size" }
    }[locale === 'ko' ? 'ko' : 'en'];

    const [image, setImage] = useState<string | null>(null);
    const [pixelSize, setPixelSize] = useState(20);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    setImage(event.target?.result as string);
                    pixelate(img, pixelSize);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const pixelate = (img: HTMLImageElement, size: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;

        // Step 1: Draw downscaled
        const w = Math.max(1, img.width / size);
        const h = Math.max(1, img.height / size);
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, w, h);
        
        // Step 2: Draw upscaled
        ctx.drawImage(canvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height);
    };

    const download = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = 'pixelated-privacy.png';
        link.href = canvas.toDataURL();
        link.click();
    };

    return (
        <GameContainer title={t.title} subtitle="Privacy & Expression" onReset={() => setImage(null)}>
            <div className="flex flex-col items-center gap-8">
                <p className="text-sm font-medium text-muted-foreground text-center max-w-md">{t.desc}</p>
                
                <div className="w-full aspect-video bg-muted/30 rounded-3xl border-4 border-dashed border-muted flex flex-col items-center justify-center overflow-hidden relative group">
                    {image ? (
                        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
                    ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-4">
                            <div className="p-6 bg-primary/10 rounded-full text-4xl">🌫️</div>
                            <span className="text-xs font-black text-primary uppercase tracking-widest">{t.upload}</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                        </label>
                    )}
                </div>

                {image && (
                    <div className="w-full space-y-6">
                        <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-2xl border border-border">
                            <span className="text-[10px] font-black text-muted-foreground uppercase">{t.size}</span>
                            <input 
                                type="range" min="2" max="100" value={pixelSize} 
                                onChange={(e) => {
                                    setPixelSize(Number(e.target.value));
                                    const img = new Image();
                                    img.onload = () => pixelate(img, Number(e.target.value));
                                    img.src = image;
                                }} 
                                className="flex-1" 
                            />
                            <span className="text-xs font-black text-primary">{pixelSize}px</span>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={download} className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-black shadow-lg">{t.download}</button>
                            <label className="px-8 py-4 bg-muted text-foreground rounded-2xl font-black cursor-pointer border border-border shadow-sm">
                                {t.upload}
                                <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                            </label>
                        </div>
                    </div>
                )}
            </div>
        </GameContainer>
    );
};

export default ImagePixelator;
