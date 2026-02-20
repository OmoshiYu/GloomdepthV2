
import React from 'react';
import { Item, ItemType } from '../types';
import { Pause, Backpack, Sword, Shield, X } from 'lucide-react';
import { SpriteSheet } from '../services/spriteGenerator';

// Helper to resolve localized item name based on type and stats
const resolveItemName = (item: Item, t: any) => {
    // If the item name is a direct key in translations, return it
    if (t[item.name]) {
        return t[item.name];
    }
    // Fallback for legacy items or direct strings
    return item.name;
};

interface GameHUDProps {
    playerHp: number;
    playerMaxHp: number;
    score: number;
    floor: number;
    messageLog: string[];
    t: any;
}

export const GameHUD: React.FC<GameHUDProps> = ({ playerHp, playerMaxHp, score, floor, messageLog, t }) => {
    return (
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none z-30">
            <div className="p-3 bg-stone-900/95 border-4 border-stone-600 rounded-sm text-stone-200 shadow-xl rpg-border">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-red-600 font-bold text-lg text-shadow">{t.hp}</span>
                        <div className="w-32 h-4 bg-stone-950 border border-stone-700 relative">
                            <div 
                                className="h-full bg-red-700 transition-all duration-200" 
                                style={{width: `${Math.max(0, (playerHp / playerMaxHp) * 100)}%`}}
                            />
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-lg">
                        <div className="text-amber-500 font-bold text-shadow tracking-wider">{t.score}: {score}</div>
                        <div className="text-stone-400 font-bold ml-4">{t.floor}: <span className="text-white">{floor}</span></div>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col gap-1 mt-2">
                {messageLog.map((msg, i) => (
                    <div key={i} className="text-sm text-stone-300 bg-black/70 px-2 py-1 border-l-2 border-stone-500 w-fit animate-fade-in font-medieval shadow-md">
                        {msg}
                    </div>
                ))}
            </div>
        </div>
    );
};

interface InventoryBarProps {
    inventory: Item[];
    sprites: SpriteSheet | null;
    onUseItem: (item: Item) => void;
    onEquipItem: (item: Item) => void;
    t: any;
}

export const InventoryBar: React.FC<InventoryBarProps> = ({ inventory, sprites, onUseItem, onEquipItem, t }) => {
    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto z-30 max-w-[90vw]">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide p-1">
                {inventory.map((item, idx) => {
                    let sprite = sprites?.potion;
                    if (item.type === ItemType.POWERUP_SPEED) sprite = sprites?.scroll;
                    if (item.type === ItemType.WEAPON_BASIC) sprite = sprites?.weapon;
                    if (item.type === ItemType.ARMOR_BASIC) sprite = sprites?.armor;

                    return (
                    <div key={idx} 
                         className="w-12 h-12 bg-stone-900 border-2 flex-shrink-0 flex items-center justify-center relative group cursor-pointer shadow-lg transition-colors"
                         style={{ borderColor: item.color }}
                            onClick={() => {
                                if(item.type === ItemType.HEALTH_POTION) onUseItem(item);
                                else if(item.type === ItemType.WEAPON_BASIC || item.type === ItemType.ARMOR_BASIC) onEquipItem(item);
                            }}>
                            {sprite && (
                            <img 
                                src={sprite.toDataURL()} 
                                className="w-8 h-8 pixelated" 
                                style={{imageRendering: 'pixelated'}} 
                            />
                            )}
                            <span className="absolute bottom-0 right-1 text-[10px] font-bold text-white drop-shadow-md">
                            {item.type === ItemType.HEALTH_POTION ? 'Q' : ''}
                            </span>
                        <div className="absolute top-12 bg-stone-950 text-xs text-stone-200 p-1 border border-stone-500 whitespace-nowrap hidden group-hover:block z-20 shadow-xl">
                            {resolveItemName(item, t)}
                        </div>
                    </div>
                )})}
            </div>
        </div>
    );
};

interface InventoryModalProps {
    inventory: Item[];
    equipped: { weapon: Item | null; armor: Item | null };
    playerDamage: number;
    playerDefense: number;
    sprites: SpriteSheet | null;
    onClose: () => void;
    onUnequip: (slot: 'weapon' | 'armor') => void;
    onUseItem: (item: Item) => void;
    onEquipItem: (item: Item) => void;
    t: any;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ 
    inventory, equipped, playerDamage, playerDefense, sprites, onClose, onUnequip, onUseItem, onEquipItem, t 
}) => {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-40 animate-fade-in">
            <div className="rpg-panel p-8 w-[600px] max-w-[90%] text-stone-200 font-medieval relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-red-400">
                    <X size={24} />
                </button>
                <h2 className="text-4xl text-amber-600 font-medieval mb-6 border-b-2 border-stone-700 pb-2 text-center text-shadow">{t.equipment}</h2>
                
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-1/3 flex flex-col gap-4 items-center bg-stone-950/50 p-4 rounded border border-stone-800 shadow-inner">
                        <div className="flex flex-col items-center">
                            <span className="text-stone-500 text-lg mb-1 font-medieval">{t.mainHand}</span>
                            <div 
                                className={`w-16 h-16 border-2 ${equipped.weapon ? 'bg-stone-900' : 'border-stone-700 bg-stone-950'} flex items-center justify-center cursor-pointer hover:brightness-125 shadow-lg`}
                                style={{ borderColor: equipped.weapon ? equipped.weapon.color : '#44403c' }}
                                onClick={() => onUnequip('weapon')}
                            >
                                {equipped.weapon ? (
                                    <img src={sprites?.weapon.toDataURL()} className="w-10 h-10 pixelated" />
                                ) : (
                                    <Sword size={24} className="text-stone-700" />
                                )}
                            </div>
                            {equipped.weapon && <span className="text-sm text-amber-500 mt-1 font-bold">+{equipped.weapon.value} {t.dmg}</span>}
                            {equipped.weapon && <span className="text-xs text-stone-400 mt-1">{resolveItemName(equipped.weapon, t)}</span>}
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="text-stone-500 text-lg mb-1 font-medieval">{t.body}</span>
                            <div 
                                className={`w-16 h-16 border-2 ${equipped.armor ? 'bg-stone-900' : 'border-stone-700 bg-stone-950'} flex items-center justify-center cursor-pointer hover:brightness-125 shadow-lg`}
                                style={{ borderColor: equipped.armor ? equipped.armor.color : '#44403c' }}
                                onClick={() => onUnequip('armor')}
                            >
                                {equipped.armor ? (
                                    <img src={sprites?.armor.toDataURL()} className="w-10 h-10 pixelated" />
                                ) : (
                                    <Shield size={24} className="text-stone-700" />
                                )}
                            </div>
                            {equipped.armor && <span className="text-sm text-blue-400 mt-1 font-bold">+{equipped.armor.value} {t.def}</span>}
                            {equipped.armor && <span className="text-xs text-stone-400 mt-1">{resolveItemName(equipped.armor, t)}</span>}
                        </div>

                        <div className="mt-4 w-full pt-4 border-t border-stone-800">
                            <div className="flex justify-between text-lg">
                                <span className="text-stone-500">{t.atk}</span>
                                <span className="font-bold text-amber-100">{playerDamage}</span>
                            </div>
                            <div className="flex justify-between text-lg">
                                <span className="text-stone-500">{t.def}</span>
                                <span className="font-bold text-stone-300">{playerDefense}</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-2/3">
                        <span className="text-stone-500 text-lg mb-2 block font-medieval">{t.backpack}</span>
                        <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                            {inventory.map((item, idx) => {
                                let sprite = sprites?.potion;
                                if (item.type === ItemType.POWERUP_SPEED) sprite = sprites?.scroll;
                                if (item.type === ItemType.WEAPON_BASIC) sprite = sprites?.weapon;
                                if (item.type === ItemType.ARMOR_BASIC) sprite = sprites?.armor;

                                return (
                                    <div 
                                        key={idx} 
                                        className="aspect-square bg-stone-900 border-2 cursor-pointer flex items-center justify-center relative group shadow-md hover:brightness-110"
                                        style={{ borderColor: item.color }}
                                        onClick={() => {
                                            if (item.type === ItemType.HEALTH_POTION) onUseItem(item);
                                            else if (item.type === ItemType.WEAPON_BASIC || item.type === ItemType.ARMOR_BASIC) onEquipItem(item);
                                        }}
                                    >
                                        {sprite && <img src={sprite.toDataURL()} className="w-8 h-8 pixelated" />}
                                        
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-stone-950 text-xs text-stone-200 p-1 border border-stone-600 whitespace-nowrap hidden group-hover:block z-50 pointer-events-none shadow-xl">
                                            {resolveItemName(item, t)}
                                            {item.value ? <span className={item.type === ItemType.ARMOR_BASIC ? "text-blue-400 ml-1" : "text-amber-400 ml-1"}>+{item.value}</span> : ''}
                                        </div>
                                    </div>
                                );
                            })}
                            {[...Array(Math.max(0, 20 - inventory.length))].map((_, i) => (
                                <div key={`e-${i}`} className="aspect-square bg-stone-950/30 border border-stone-800" />
                            ))}
                        </div>
                        <p className="mt-4 text-sm text-stone-500 whitespace-pre-line text-center italic">
                            {t.clickEquip} <br/> {t.pressTab}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface TouchControlsProps {
    onJoystickStart: (e: React.TouchEvent) => void;
    onJoystickMove: (e: React.TouchEvent) => void;
    onJoystickEnd: (e: React.TouchEvent) => void;
    joystickKnobRef: React.RefObject<HTMLDivElement | null>; 
    onAttackStart: (e: React.TouchEvent) => void;
    onAttackEnd: (e: React.TouchEvent) => void;
    onPotion: () => void;
    hasPotion: boolean;
    onPause: () => void;
    onInventory: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ 
    onJoystickStart, onJoystickMove, onJoystickEnd, joystickKnobRef, 
    onAttackStart, onAttackEnd, onPotion, hasPotion, onPause, onInventory
}) => {
    return (
        <>
            <button 
                className="absolute top-4 right-4 p-2 bg-stone-800/80 border-2 border-stone-600 text-stone-200 hover:border-amber-500 pointer-events-auto z-30"
                onClick={onPause}
            >
                <Pause size={24} />
            </button>

            <button 
                className="absolute top-20 right-4 p-2 bg-stone-800/80 border-2 border-stone-600 text-stone-200 hover:border-amber-500 pointer-events-auto z-30"
                onClick={onInventory}
            >
                <Backpack size={24} />
            </button>

            <div className="absolute inset-0 pointer-events-none z-20">
                <div 
                    className="absolute bottom-8 left-8 w-36 h-36 bg-stone-500/10 rounded-full border-2 border-stone-400/20 backdrop-blur-sm flex items-center justify-center pointer-events-auto touch-none"
                    onTouchStart={onJoystickStart}
                    onTouchMove={onJoystickMove}
                    onTouchEnd={onJoystickEnd}
                    onTouchCancel={onJoystickEnd}
                >
                    <div 
                        ref={joystickKnobRef}
                        className="w-14 h-14 bg-stone-400/40 rounded-full shadow-lg pointer-events-none border border-stone-300/30"
                    />
                </div>

                <button 
                    className="absolute bottom-8 right-8 w-24 h-24 bg-red-900/40 rounded-full border-4 border-red-800/50 backdrop-blur-sm flex items-center justify-center active:bg-red-900/60 active:scale-95 transition-all pointer-events-auto touch-none select-none shadow-lg"
                    onTouchStart={onAttackStart}
                    onTouchEnd={onAttackEnd}
                    onTouchCancel={onAttackEnd}
                >
                    <Sword size={40} className="text-stone-200 opacity-80" />
                </button>
                
                {hasPotion && (
                    <button 
                        className="absolute bottom-36 right-8 w-16 h-16 bg-blue-900/40 rounded-full border-2 border-blue-500/50 backdrop-blur-sm flex items-center justify-center active:bg-blue-800/60 active:scale-95 transition-all pointer-events-auto touch-none select-none shadow-lg"
                        onClick={onPotion}
                    >
                        <span className="font-bold text-xl text-stone-200 font-medieval">Q</span>
                    </button>
                )}
            </div>
        </>
    );
};
