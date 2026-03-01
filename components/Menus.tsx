
import React from 'react';
import { GenerationMode, Language } from '../types';
import { Settings, HelpCircle, Play, ArrowLeft, Volume2, Music, Globe, Skull, RotateCcw, Save, Crown, Smartphone } from 'lucide-react';

interface MainMenuProps {
    genMode: GenerationMode;
    setGenMode: (mode: GenerationMode) => void;
    onStart: () => void;
    onContinue: () => void;
    hasSave: boolean;
    onSettings: () => void;
    onHelp: () => void;
    t: any;
}

export const MainMenu: React.FC<MainMenuProps> = ({ genMode, setGenMode, onStart, onContinue, hasSave, onSettings, onHelp, t }) => {
    return (
        <div className="absolute inset-0 flex items-center justify-center z-50 p-4">
          <div className="flex flex-col items-center gap-4 p-4 md:p-6 rpg-panel shadow-2xl max-w-md w-full backdrop-blur-sm animate-fade-in max-h-full overflow-y-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-stone-300 tracking-tighter mb-2 font-medieval text-shadow text-center leading-none">
              <span className="text-red-800 block text-3xl md:text-4xl mb-1">{t.title1}</span>
              {t.title2}
            </h1>
            
            <div className="w-full">
                <label className="block text-stone-500 mb-1 text-base font-medieval text-center">{t.genMode}</label>
                <div className="flex gap-2 justify-center">
                    <button 
                        onClick={() => setGenMode(GenerationMode.DRUNKARD)}
                        className={`flex-1 p-1.5 text-base font-medieval border-2 transition-all ${genMode === GenerationMode.DRUNKARD ? 'bg-stone-800 border-amber-600 text-amber-500' : 'bg-stone-900 border-stone-700 text-stone-500 hover:border-stone-500'}`}
                    >
                        {t.cave}
                    </button>
                    <button 
                        onClick={() => setGenMode(GenerationMode.BSP)}
                        className={`flex-1 p-1.5 text-base font-medieval border-2 transition-all ${genMode === GenerationMode.BSP ? 'bg-stone-800 border-amber-600 text-amber-500' : 'bg-stone-900 border-stone-700 text-stone-500 hover:border-stone-500'}`}
                    >
                        {t.dungeon}
                    </button>
                </div>
            </div>

            {hasSave && (
                <button 
                    onClick={onContinue}
                    className="w-full py-2 bg-stone-800 border-2 border-amber-700 text-amber-500 hover:bg-stone-700 hover:text-amber-400 text-lg flex items-center justify-center gap-2 font-medieval tracking-widest mt-1 shadow-lg"
                >
                    <Save size={18} /> {t.continue}
                </button>
            )}

            <button 
                onClick={onStart}
                className="w-full py-2 rpg-button text-lg flex items-center justify-center gap-2 font-medieval tracking-widest"
            >
                <Play size={18} /> {t.play}
            </button>

            <div className="flex gap-3 w-full font-medieval text-base">
                <button 
                    onClick={onSettings}
                    className="flex-1 py-1.5 rpg-button flex items-center justify-center gap-2"
                >
                    <Settings size={14} /> {t.opts}
                </button>
                <button 
                    onClick={onHelp}
                    className="flex-1 py-1.5 rpg-button flex items-center justify-center gap-2"
                >
                    <HelpCircle size={14} /> {t.help}
                </button>
            </div>
          </div>
        </div>
    );
};

interface PauseMenuProps {
    onResume: () => void;
    onExit: () => void;
    t: any;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onExit, t }) => (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
        <div className="p-10 rpg-panel text-center min-w-[300px]">
            <h2 className="text-5xl text-stone-300 mb-8 font-medieval text-shadow">{t.paused}</h2>
            <button 
            onClick={onResume}
            className="block w-full py-3 mb-4 rpg-button font-bold font-medieval text-xl"
            >
            {t.resume}
            </button>
            <button 
            onClick={onExit}
            className="block w-full py-3 bg-red-950 hover:bg-red-900 border-2 border-red-900 text-stone-300 font-medieval text-xl transition-colors"
            >
            {t.exit}
            </button>
        </div>
    </div>
);

interface GameOverMenuProps {
    score: number;
    floor: number;
    onReturn: () => void;
    onLoadCheckpoint: () => void;
    hasSave: boolean;
    t: any;
}

export const GameOverMenu: React.FC<GameOverMenuProps> = ({ score, floor, onReturn, onLoadCheckpoint, hasSave, t }) => (
    <div className="absolute inset-0 flex items-center justify-center bg-red-950/80 backdrop-blur-md z-50 p-4">
        <div className="text-center p-6 md:p-10 rpg-panel border-red-900 shadow-2xl max-w-lg w-full max-h-full overflow-y-auto">
            <div className="flex justify-center mb-4 text-red-600">
                <Skull size={56} />
            </div>
            <h2 className="text-4xl md:text-5xl text-red-600 font-bold mb-2 font-medieval text-shadow">{t.gameOver}</h2>
            <p className="text-stone-500 text-lg md:text-xl mb-6 font-medieval italic">{t.deathMsg}</p>
            
            <div className="text-2xl md:text-3xl text-stone-300 mb-8 font-medieval border-y-2 border-stone-800 py-4 bg-stone-950/50">
                {t.score}: <span className="text-amber-500">{score}</span>
                <div className="text-lg md:text-xl text-stone-500 mt-2">{t.floor}: {floor}</div>
            </div>

            <div className="flex flex-col gap-4">
                {hasSave && (
                    <button 
                        onClick={onLoadCheckpoint}
                        className="px-8 py-3 bg-stone-800 border-2 border-amber-700 text-amber-500 hover:bg-stone-700 font-medieval tracking-wider text-xl w-full flex items-center justify-center gap-2"
                    >
                        <RotateCcw size={20} /> {t.loadCheckpoint}
                    </button>
                )}
                
                <button 
                    onClick={onReturn}
                    className="px-8 py-3 rpg-button font-medieval tracking-wider text-xl w-full"
                >
                    {t.returnMenu}
                </button>
            </div>
        </div>
    </div>
);

interface VictoryMenuProps {
    score: number;
    onReturn: () => void;
    t: any;
}

export const VictoryMenu: React.FC<VictoryMenuProps> = ({ score, onReturn, t }) => (
    <div className="absolute inset-0 flex items-center justify-center bg-amber-950/80 backdrop-blur-md z-50 p-4">
        <div className="text-center p-6 md:p-12 rpg-panel border-amber-500 shadow-2xl max-w-lg w-full max-h-full overflow-y-auto">
            <div className="flex justify-center mb-4 text-amber-500 animate-bounce">
                <Crown size={64} />
            </div>
            <h2 className="text-5xl md:text-6xl text-amber-400 font-bold mb-2 font-medieval text-shadow">{t.victory}</h2>
            <p className="text-stone-300 text-xl md:text-2xl mb-8 font-medieval italic">{t.escaped}</p>
            
            <div className="text-2xl md:text-3xl text-stone-200 mb-8 font-medieval border-y-2 border-stone-800 py-4 bg-stone-950/50">
                {t.score}: <span className="text-amber-500">{score}</span>
            </div>

            <button 
                onClick={onReturn}
                className="px-8 py-3 rpg-button font-medieval tracking-wider text-xl w-full"
            >
                {t.playAgain}
            </button>
        </div>
    </div>
);

interface HelpMenuProps {
    onClose: () => void;
    t: any;
}

export const HelpMenu: React.FC<HelpMenuProps> = ({ onClose, t }) => (
    <div className="absolute inset-0 flex items-center justify-center bg-black/95 z-50 p-4">
        <div className="max-w-lg w-full p-4 md:p-6 rpg-panel font-medieval relative max-h-full overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-stone-900/90 z-10 p-2 -mx-2 -mt-2 rounded backdrop-blur-sm">
                <h2 className="text-2xl md:text-3xl text-stone-300 font-bold font-medieval text-shadow">{t.manual}</h2>
                <button onClick={onClose} className="text-stone-500 hover:text-red-400 p-2"><ArrowLeft /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-stone-400 text-sm md:text-base">
                <div>
                    <h3 className="text-xl text-amber-700 mb-3 font-medieval border-b border-stone-800 pb-1">{t.controls}</h3>
                    <ul className="space-y-3">
                        <li className="flex justify-between border-b border-stone-800 pb-1"><span>{t.move}</span> <span className="text-stone-200">WASD / Arrows</span></li>
                        <li className="flex justify-between border-b border-stone-800 pb-1"><span>{t.attack}</span> <span className="text-stone-200">SPACE</span></li>
                        <li className="flex justify-between border-b border-stone-800 pb-1"><span>{t.inventory}</span> <span className="text-stone-200">TAB</span></li>
                        <li className="flex justify-between border-b border-stone-800 pb-1"><span>{t.potion}</span> <span className="text-stone-200">Q</span></li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-2xl text-red-800 mb-4 font-medieval border-b border-stone-800 pb-1">{t.survival}</h3>
                    <p className="leading-relaxed mb-4">
                        {t.survivalText1}
                    </p>
                    <p className="leading-relaxed">
                        {t.survivalText2}
                    </p>
                    <p className="leading-relaxed text-amber-600 mt-2">
                        {t.survivalText3}
                    </p>
                </div>
            </div>
        </div>
    </div>
);

interface SettingsMenuProps {
    musicVolume: number;
    setMusicVolume: (v: number) => void;
    sfxVolume: number;
    setSfxVolume: (v: number) => void;
    language: Language;
    setLanguage: (l: Language) => void;
    fullscreen: boolean;
    setFullscreen: (f: boolean) => void;
    showTouchControls: boolean;
    setShowTouchControls: (s: boolean) => void;
    onClose: () => void;
    t: any;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ 
    musicVolume, setMusicVolume, sfxVolume, setSfxVolume, language, setLanguage, fullscreen, setFullscreen, showTouchControls, setShowTouchControls, onClose, t 
}) => {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/95 z-50 p-4">
            <div className="w-[28rem] max-w-full p-4 md:p-6 rpg-panel font-medieval relative max-h-full overflow-y-auto flex flex-col">
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-stone-900/90 z-10 p-2 -mx-2 -mt-2 rounded backdrop-blur-sm">
                    <h2 className="text-2xl md:text-3xl text-stone-300 font-bold font-medieval text-shadow">{t.system}</h2>
                    <button onClick={onClose} className="text-stone-500 hover:text-red-400 p-2"><ArrowLeft /></button>
                </div>
                
                <div className="space-y-5 text-sm md:text-base">
                    <div>
                        <div className="flex justify-between text-stone-400 mb-2">
                            <div className="flex items-center gap-2"><Music size={18}/> {t.music}</div>
                            <span className="text-amber-600">{Math.round(musicVolume * 100)}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="1" step="0.05"
                            value={musicVolume}
                            onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                            className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-700"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between text-stone-400 mb-2">
                            <div className="flex items-center gap-2"><Volume2 size={18}/> {t.sfx}</div>
                            <span className="text-amber-600">{Math.round(sfxVolume * 100)}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="1" step="0.05"
                            value={sfxVolume}
                            onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                            className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-700"
                        />
                    </div>

                    <div className="pt-2">
                        <div className="flex justify-between text-stone-400 mb-2">
                            <div className="flex items-center gap-2"><Globe size={18}/> {t.language}</div>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setLanguage('en')} 
                                className={`flex-1 py-1 border-2 text-lg transition-colors ${language === 'en' ? 'bg-stone-800 border-amber-600 text-amber-500' : 'bg-stone-900 border-stone-700 text-stone-500'}`}
                            >
                                ENGLISH
                            </button>
                            <button 
                                onClick={() => setLanguage('ru')} 
                                className={`flex-1 py-1 border-2 text-lg transition-colors ${language === 'ru' ? 'bg-stone-800 border-amber-600 text-amber-500' : 'bg-stone-900 border-stone-700 text-stone-500'}`}
                            >
                                РУССКИЙ
                            </button>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-stone-800 space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-stone-400"><Smartphone size={18}/> {t.touchControls}</div>
                            <button 
                                onClick={() => setShowTouchControls(!showTouchControls)}
                                className={`w-12 h-6 rounded-sm flex items-center px-1 transition-colors border ${showTouchControls ? 'bg-stone-800 border-amber-600 justify-end' : 'bg-stone-950 border-stone-700 justify-start'}`}
                            >
                                <div className={`w-4 h-4 rounded-sm shadow-sm ${showTouchControls ? 'bg-amber-500' : 'bg-stone-700'}`} />
                            </button>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-stone-400">{t.fullscreen}</span>
                            <button 
                                onClick={() => {
                                    if (!document.fullscreenElement) {
                                        document.documentElement.requestFullscreen();
                                        setFullscreen(true);
                                    } else {
                                        document.exitFullscreen();
                                        setFullscreen(false);
                                    }
                                }}
                                className={`w-12 h-6 rounded-sm flex items-center px-1 transition-colors border ${fullscreen ? 'bg-stone-800 border-amber-600 justify-end' : 'bg-stone-950 border-stone-700 justify-start'}`}
                            >
                                <div className={`w-4 h-4 rounded-sm shadow-sm ${fullscreen ? 'bg-amber-500' : 'bg-stone-700'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
