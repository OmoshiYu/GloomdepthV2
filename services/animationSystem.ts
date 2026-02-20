
import gsap from 'gsap';
import { Entity, AnimationState } from '../types';

export const initAnimation = (entity: Entity) => {
    // Reset or initialize animation state
    if (entity.anim && entity.anim._tweens) {
        killTweens(entity);
    }
    
    entity.anim = {
        state: 'IDLE',
        frame: 0,
        direction: 1,
        bobY: 0,
        _tweens: []
    };
    
    // Start initial idle animation
    playStateAnimation(entity, 'IDLE');
};

const killTweens = (entity: Entity) => {
    if (entity.anim._tweens) {
        entity.anim._tweens.forEach(t => t.kill());
    }
    entity.anim._tweens = [];
};

export const playStateAnimation = (entity: Entity, newState: AnimationState) => {
    // Prevent restarting the same loop (unless it's an attack/oneshot)
    if (entity.anim.state === newState && newState !== 'ATTACK' && newState !== 'HIT') return;
    
    entity.anim.state = newState;
    killTweens(entity);

    // Frame Animation Config
    let frames = 4;
    let duration = 0.6;
    let repeat = -1; // Infinite
    
    if (newState === 'MOVE') { 
        frames = 4; 
        duration = 0.4; 
    } else if (newState === 'ATTACK') { 
        frames = 2; 
        duration = 0.2; 
        repeat = 0; 
    } else if (newState === 'CASTING') { 
        frames = 4; 
        duration = 0.8; 
    } else if (newState === 'IDLE') {
        frames = 4;
        duration = 0.8;
    }

    // Sprite Frame Tween
    // We use steps(N) to animate indices 0, 1, 2... N
    const frameTween = gsap.fromTo(entity.anim, 
        { frame: 0 },
        { 
            frame: frames - 1, 
            duration: duration, 
            ease: `steps(${frames - 1})`, 
            repeat: repeat,
            onComplete: () => {
                // Return to Idle after one-shot animations
                if (newState === 'ATTACK' || newState === 'HIT') {
                    playStateAnimation(entity, 'IDLE');
                }
            }
        }
    );
    entity.anim._tweens.push(frameTween);

    // Procedural "Bobbing" / Movement Tweens
    if (newState === 'MOVE') {
        // Fast bobbing for walking
        const bobTween = gsap.fromTo(entity.anim,
            { bobY: 0 },
            { bobY: 2, duration: 0.15, yoyo: true, repeat: -1, ease: "sine.inOut" }
        );
        entity.anim._tweens.push(bobTween);
    } else if (newState === 'IDLE') {
        // Slow breathing
        const breatheTween = gsap.fromTo(entity.anim,
            { bobY: 0 },
            { bobY: 1, duration: 1.0, yoyo: true, repeat: -1, ease: "sine.inOut" }
        );
        entity.anim._tweens.push(breatheTween);
    } else if (newState === 'CASTING') {
        // Levitation effect
         const floatTween = gsap.fromTo(entity.anim,
            { bobY: -2 },
            { bobY: 2, duration: 0.8, yoyo: true, repeat: -1, ease: "sine.inOut" }
        );
        entity.anim._tweens.push(floatTween);
    } else {
        // Reset bob
        gsap.to(entity.anim, { bobY: 0, duration: 0.2 });
    }
};

export const updateEntityVisuals = (entity: Entity, velocity: {x: number, y: number}) => {
    // If we are locked in an animation priority (Attack/Cast), don't switch to Walk/Idle
    if (entity.anim.state === 'ATTACK' || entity.anim.state === 'CASTING' || entity.anim.state === 'HIT') return;

    // Determine direction
    if (Math.abs(velocity.x) > 0.1) {
        entity.anim.direction = velocity.x > 0 ? 1 : -1;
    }

    // Determine state based on movement
    const isMoving = Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1;
    const targetState = isMoving ? 'MOVE' : 'IDLE';

    playStateAnimation(entity, targetState);
};
