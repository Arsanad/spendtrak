import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect, ReactNode } from 'react';
import { Dimensions } from 'react-native';
import { initQuantumSounds, unloadQuantumSounds } from '../utils/quantumSounds';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// QUANTUM Character positions on screen
export const QUANTUM_POSITIONS = {
    corner: { x: SCREEN_WIDTH - 50, y: 100 },
    center: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 - 100 },
    bottom: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT - 200 },
} as const;

// QUANTUM Character sizes
export const QUANTUM_SIZES = {
    small: 60,
    medium: 100,
    large: 140,
    celebration: 180,
} as const;

// Emotion types — 20 full character states
export type QuantumEmotion =
    | 'idle'
    | 'happy'
    | 'celebrating'
    | 'sad'
    | 'thinking'
    | 'surprised'
    | 'encouraging'
    | 'speaking'
    | 'waving'
    | 'sleeping'
    | 'excited'
    | 'worried'
    | 'proud'
    | 'curious'
    | 'dancing'
    | 'love'
    | 'angry'
    | 'tired'
    | 'focused'
    | 'alert';

// Animation types
export type QuantumAnimation =
    | 'bounce'
    | 'celebrate'
    | 'speak'
    | 'wiggle'
    | 'wave'
    | 'think'
    | 'surprise'
    | 'encourage'
    | 'sad'
    | 'sleep'
    | 'excited'
    | 'worried'
    | 'proud'
    | 'curious'
    | 'dancing'
    | 'love'
    | 'angry'
    | 'tired'
    | 'focused'
    | 'alert'
    | 'lookAround'
    | 'flyToCenter'
    | 'returnToCorner'
    | 'none';

// Speech types
export type SpeechType = 'acknowledgment' | 'tip' | 'alert' | 'celebration';

// Position types
export type QuantumPosition = 'corner' | 'center' | 'bottom';

// State interface
export interface QuantumState {
    // Position
    x: number;
    y: number;
    position: QuantumPosition;

    // Size & Scale
    scale: number;

    // Emotion
    emotion: QuantumEmotion;

    // Animation
    isAnimating: boolean;
    currentAnimation: QuantumAnimation;

    // Speech
    isSpeaking: boolean;
    speechMessage: string | null;
    speechType: SpeechType | null;

    // Visibility
    isVisible: boolean;
}

// Action types
type QuantumAction =
    | { type: 'SPEAK'; payload: { message: string; speechType?: SpeechType } }
    | { type: 'ACKNOWLEDGE'; payload: { message: string } }
    | { type: 'DISMISS' }
    | { type: 'HIDE' }
    | { type: 'SHOW' }
    | { type: 'SET_EMOTION'; payload: QuantumEmotion }
    | { type: 'SET_POSITION'; payload: QuantumPosition }
    | { type: 'ANIMATE'; payload: QuantumAnimation }
    | { type: 'STOP_ANIMATION' }
    | { type: 'CELEBRATE'; payload?: { message?: string } }
    | { type: 'SET_SAD' }
    | { type: 'SET_SURPRISED' }
    | { type: 'SET_ENCOURAGING' }
    | { type: 'SET_WAVING' }
    | { type: 'SET_THINKING' }
    | { type: 'SET_SLEEPING' }
    | { type: 'WAKE' }
    | { type: 'SET_EXCITED'; payload?: { message?: string } }
    | { type: 'SET_WORRIED' }
    | { type: 'SET_PROUD' }
    | { type: 'SET_CURIOUS' }
    | { type: 'SET_DANCING' }
    | { type: 'SET_LOVE' }
    | { type: 'SET_ANGRY' }
    | { type: 'SET_TIRED' }
    | { type: 'SET_FOCUSED' };

// Initial state
const initialState: QuantumState = {
    x: QUANTUM_POSITIONS.corner.x,
    y: QUANTUM_POSITIONS.corner.y,
    position: 'corner',
    scale: 1,
    emotion: 'idle',
    isAnimating: false,
    currentAnimation: 'none',
    isSpeaking: false,
    speechMessage: null,
    speechType: null,
    isVisible: true,
};

// Auto-return durations (ms) per emotion
const AUTO_RETURN_DURATIONS: Partial<Record<QuantumEmotion, number>> = {
    celebrating: 3000,
    sad: 4000,
    thinking: 5000,
    surprised: 2000,
    encouraging: 3000,
    waving: 2000,
    excited: 3000,
    worried: 3500,
    proud: 3000,
    curious: 2500,
    dancing: 4500,
    love: 3000,
    angry: 3500,
    tired: 4000,
    focused: 5000,
    alert: 4000,
    // speaking: handled by dismiss
    // sleeping: stays until wake
};

// Sleep inactivity timeout (ms)
const SLEEP_TIMEOUT = 30000;

// Reducer
function quantumReducer(state: QuantumState, action: QuantumAction): QuantumState {
    switch (action.type) {
        case 'SPEAK':
            return {
                ...state,
                isSpeaking: true,
                speechMessage: action.payload.message,
                speechType: action.payload.speechType || 'acknowledgment',
                x: QUANTUM_POSITIONS.center.x,
                y: QUANTUM_POSITIONS.center.y,
                position: 'center',
                scale: QUANTUM_SIZES.medium / QUANTUM_SIZES.small,
                currentAnimation: 'speak',
                isAnimating: true,
                emotion: 'speaking',
            };

        case 'ACKNOWLEDGE':
            return {
                ...state,
                isSpeaking: true,
                speechMessage: action.payload.message,
                speechType: 'acknowledgment',
                x: QUANTUM_POSITIONS.center.x,
                y: QUANTUM_POSITIONS.center.y,
                position: 'center',
                scale: QUANTUM_SIZES.medium / QUANTUM_SIZES.small,
                currentAnimation: 'speak',
                isAnimating: true,
                emotion: 'speaking',
            };

        case 'DISMISS':
            return {
                ...state,
                isSpeaking: false,
                speechMessage: null,
                speechType: null,
                x: QUANTUM_POSITIONS.corner.x,
                y: QUANTUM_POSITIONS.corner.y,
                position: 'corner',
                scale: 1,
                currentAnimation: 'none',
                isAnimating: false,
                emotion: 'idle',
            };

        case 'HIDE':
            return {
                ...state,
                isVisible: false,
                isSpeaking: false,
                speechMessage: null,
            };

        case 'SHOW':
            return {
                ...state,
                isVisible: true,
            };

        case 'SET_EMOTION':
            return {
                ...state,
                emotion: action.payload,
            };

        case 'SET_POSITION':
            return {
                ...state,
                position: action.payload,
                x: QUANTUM_POSITIONS[action.payload].x,
                y: QUANTUM_POSITIONS[action.payload].y,
            };

        case 'ANIMATE':
            return {
                ...state,
                isAnimating: true,
                currentAnimation: action.payload,
            };

        case 'STOP_ANIMATION':
            return {
                ...state,
                isAnimating: false,
                currentAnimation: 'none',
            };

        case 'CELEBRATE':
            return {
                ...state,
                isSpeaking: action.payload?.message ? true : false,
                speechMessage: action.payload?.message || null,
                speechType: 'celebration',
                x: QUANTUM_POSITIONS.center.x,
                y: QUANTUM_POSITIONS.center.y,
                position: 'center',
                scale: QUANTUM_SIZES.celebration / QUANTUM_SIZES.small,
                currentAnimation: 'celebrate',
                isAnimating: true,
                emotion: 'celebrating',
            };

        case 'SET_SAD':
            return {
                ...state,
                emotion: 'sad',
                isAnimating: true,
                currentAnimation: 'sad',
            };

        case 'SET_SURPRISED':
            return {
                ...state,
                emotion: 'surprised',
                isAnimating: true,
                currentAnimation: 'surprise',
            };

        case 'SET_ENCOURAGING':
            return {
                ...state,
                emotion: 'encouraging',
                isAnimating: true,
                currentAnimation: 'encourage',
            };

        case 'SET_WAVING':
            return {
                ...state,
                emotion: 'waving',
                isAnimating: true,
                currentAnimation: 'wave',
            };

        case 'SET_THINKING':
            return {
                ...state,
                emotion: 'thinking',
                isAnimating: true,
                currentAnimation: 'think',
            };

        case 'SET_SLEEPING':
            return {
                ...state,
                emotion: 'sleeping',
                isAnimating: true,
                currentAnimation: 'sleep',
                isSpeaking: false,
                speechMessage: null,
                speechType: null,
                x: QUANTUM_POSITIONS.corner.x,
                y: QUANTUM_POSITIONS.corner.y,
                position: 'corner',
                scale: 1,
            };

        case 'WAKE':
            return {
                ...state,
                emotion: 'idle',
                isAnimating: false,
                currentAnimation: 'none',
            };

        case 'SET_EXCITED':
            return {
                ...state,
                emotion: 'excited',
                isAnimating: true,
                currentAnimation: 'excited',
                isSpeaking: action.payload?.message ? true : false,
                speechMessage: action.payload?.message || null,
                speechType: 'celebration',
                x: QUANTUM_POSITIONS.center.x,
                y: QUANTUM_POSITIONS.center.y,
                position: 'center',
                scale: QUANTUM_SIZES.large / QUANTUM_SIZES.small,
            };

        case 'SET_WORRIED':
            return {
                ...state,
                emotion: 'worried',
                isAnimating: true,
                currentAnimation: 'worried',
            };

        case 'SET_PROUD':
            return {
                ...state,
                emotion: 'proud',
                isAnimating: true,
                currentAnimation: 'proud',
            };

        case 'SET_CURIOUS':
            return {
                ...state,
                emotion: 'curious',
                isAnimating: true,
                currentAnimation: 'curious',
            };

        case 'SET_DANCING':
            return {
                ...state,
                emotion: 'dancing',
                isAnimating: true,
                currentAnimation: 'dancing',
                x: QUANTUM_POSITIONS.center.x,
                y: QUANTUM_POSITIONS.center.y,
                position: 'center',
                scale: QUANTUM_SIZES.large / QUANTUM_SIZES.small,
            };

        case 'SET_LOVE':
            return {
                ...state,
                emotion: 'love',
                isAnimating: true,
                currentAnimation: 'love',
            };

        case 'SET_ANGRY':
            return {
                ...state,
                emotion: 'angry',
                isAnimating: true,
                currentAnimation: 'angry',
            };

        case 'SET_TIRED':
            return {
                ...state,
                emotion: 'tired',
                isAnimating: true,
                currentAnimation: 'tired',
            };

        case 'SET_FOCUSED':
            return {
                ...state,
                emotion: 'focused',
                isAnimating: true,
                currentAnimation: 'focused',
            };

        default:
            return state;
    }
}

// Context interface
interface QuantumContextValue {
    state: QuantumState;
    actions: {
        speak: (message: string, speechType?: SpeechType) => void;
        acknowledge: (message: string) => void;
        dismiss: () => void;
        hide: () => void;
        show: () => void;
        setEmotion: (emotion: QuantumEmotion) => void;
        setPosition: (position: QuantumPosition) => void;
        animate: (animation: QuantumAnimation) => void;
        stopAnimation: () => void;
        celebrate: (message?: string) => void;
        showSad: () => void;
        showSurprised: () => void;
        showEncouraging: () => void;
        wave: () => void;
        think: () => void;
        wake: () => void;
        showExcited: (message?: string) => void;
        showWorried: () => void;
        showProud: () => void;
        showCurious: () => void;
        dance: () => void;
        showLove: () => void;
        showAngry: () => void;
        showTired: () => void;
        showFocused: () => void;
    };
}

const QuantumContext = createContext<QuantumContextValue | null>(null);

interface QuantumProviderProps {
    children: ReactNode;
}

export function QuantumProvider({ children }: QuantumProviderProps) {
    const [state, dispatch] = useReducer(quantumReducer, initialState);

    // Auto-return timer ref
    const autoReturnTimerRef = useRef<NodeJS.Timeout | null>(null);
    // Sleep inactivity timer ref
    const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Clear any existing auto-return timer
    const clearAutoReturn = useCallback(() => {
        if (autoReturnTimerRef.current) {
            clearTimeout(autoReturnTimerRef.current);
            autoReturnTimerRef.current = null;
        }
    }, []);

    // Reset sleep timer on any activity
    const resetSleepTimer = useCallback(() => {
        if (sleepTimerRef.current) {
            clearTimeout(sleepTimerRef.current);
            sleepTimerRef.current = null;
        }
        sleepTimerRef.current = setTimeout(() => {
            dispatch({ type: 'SET_SLEEPING' });
        }, SLEEP_TIMEOUT);
    }, []);

    // Schedule auto-return to idle based on emotion duration
    const scheduleAutoReturn = useCallback((emotion: QuantumEmotion) => {
        clearAutoReturn();
        const duration = AUTO_RETURN_DURATIONS[emotion];
        if (duration) {
            autoReturnTimerRef.current = setTimeout(() => {
                dispatch({ type: 'DISMISS' });
            }, duration);
        }
    }, [clearAutoReturn]);

    // Watch emotion changes for auto-return scheduling
    useEffect(() => {
        if (state.emotion !== 'idle' && state.emotion !== 'sleeping' && state.emotion !== 'speaking') {
            scheduleAutoReturn(state.emotion);
        }
        return () => clearAutoReturn();
    }, [state.emotion, scheduleAutoReturn, clearAutoReturn]);

    // Initialize sleep timer & cleanup
    useEffect(() => {
        resetSleepTimer();
        return () => {
            if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
            clearAutoReturn();
        };
    }, []);

    // Pre-load QUANTUM sound effects
    useEffect(() => {
        initQuantumSounds();
        return () => { unloadQuantumSounds(); };
    }, []);

    // Helper: dispatch with activity reset (resets sleep timer)
    const dispatchWithActivity = useCallback((action: QuantumAction) => {
        resetSleepTimer();
        dispatch(action);
    }, [resetSleepTimer]);

    const speak = useCallback((message: string, speechType?: SpeechType) => {
        dispatchWithActivity({ type: 'SPEAK', payload: { message, speechType } });
    }, [dispatchWithActivity]);

    const acknowledge = useCallback((message: string) => {
        dispatchWithActivity({ type: 'ACKNOWLEDGE', payload: { message } });
    }, [dispatchWithActivity]);

    const dismiss = useCallback(() => {
        clearAutoReturn();
        dispatchWithActivity({ type: 'DISMISS' });
    }, [dispatchWithActivity, clearAutoReturn]);

    const hide = useCallback(() => {
        dispatchWithActivity({ type: 'HIDE' });
    }, [dispatchWithActivity]);

    const show = useCallback(() => {
        dispatchWithActivity({ type: 'SHOW' });
    }, [dispatchWithActivity]);

    const setEmotion = useCallback((emotion: QuantumEmotion) => {
        dispatchWithActivity({ type: 'SET_EMOTION', payload: emotion });
    }, [dispatchWithActivity]);

    const setPosition = useCallback((position: QuantumPosition) => {
        dispatchWithActivity({ type: 'SET_POSITION', payload: position });
    }, [dispatchWithActivity]);

    const animate = useCallback((animation: QuantumAnimation) => {
        dispatchWithActivity({ type: 'ANIMATE', payload: animation });
    }, [dispatchWithActivity]);

    const stopAnimation = useCallback(() => {
        dispatchWithActivity({ type: 'STOP_ANIMATION' });
    }, [dispatchWithActivity]);

    const celebrate = useCallback((message?: string) => {
        dispatchWithActivity({ type: 'CELEBRATE', payload: { message } });
    }, [dispatchWithActivity]);

    const showSad = useCallback(() => {
        dispatchWithActivity({ type: 'SET_SAD' });
    }, [dispatchWithActivity]);

    const showSurprised = useCallback(() => {
        dispatchWithActivity({ type: 'SET_SURPRISED' });
    }, [dispatchWithActivity]);

    const showEncouraging = useCallback(() => {
        dispatchWithActivity({ type: 'SET_ENCOURAGING' });
    }, [dispatchWithActivity]);

    const wave = useCallback(() => {
        dispatchWithActivity({ type: 'SET_WAVING' });
    }, [dispatchWithActivity]);

    const think = useCallback(() => {
        dispatchWithActivity({ type: 'SET_THINKING' });
    }, [dispatchWithActivity]);

    const wake = useCallback(() => {
        clearAutoReturn();
        dispatchWithActivity({ type: 'WAKE' });
    }, [dispatchWithActivity, clearAutoReturn]);

    const showExcited = useCallback((message?: string) => {
        dispatchWithActivity({ type: 'SET_EXCITED', payload: { message } });
    }, [dispatchWithActivity]);

    const showWorried = useCallback(() => {
        dispatchWithActivity({ type: 'SET_WORRIED' });
    }, [dispatchWithActivity]);

    const showProud = useCallback(() => {
        dispatchWithActivity({ type: 'SET_PROUD' });
    }, [dispatchWithActivity]);

    const showCurious = useCallback(() => {
        dispatchWithActivity({ type: 'SET_CURIOUS' });
    }, [dispatchWithActivity]);

    const dance = useCallback(() => {
        dispatchWithActivity({ type: 'SET_DANCING' });
    }, [dispatchWithActivity]);

    const showLove = useCallback(() => {
        dispatchWithActivity({ type: 'SET_LOVE' });
    }, [dispatchWithActivity]);

    const showAngry = useCallback(() => {
        dispatchWithActivity({ type: 'SET_ANGRY' });
    }, [dispatchWithActivity]);

    const showTired = useCallback(() => {
        dispatchWithActivity({ type: 'SET_TIRED' });
    }, [dispatchWithActivity]);

    const showFocused = useCallback(() => {
        dispatchWithActivity({ type: 'SET_FOCUSED' });
    }, [dispatchWithActivity]);

    const value: QuantumContextValue = {
        state,
        actions: {
            speak,
            acknowledge,
            dismiss,
            hide,
            show,
            setEmotion,
            setPosition,
            animate,
            stopAnimation,
            celebrate,
            showSad,
            showSurprised,
            showEncouraging,
            wave,
            think,
            wake,
            showExcited,
            showWorried,
            showProud,
            showCurious,
            dance,
            showLove,
            showAngry,
            showTired,
            showFocused,
        },
    };

    return (
        <QuantumContext.Provider value={value}>
            {children}
        </QuantumContext.Provider>
    );
}

// Main hook
export function useQuantum(): QuantumContextValue {
    const context = useContext(QuantumContext);
    if (!context) {
        throw new Error('useQuantum must be used within a QuantumProvider');
    }
    return context;
}

// Convenience hook for just actions
export function useQuantumActions() {
    const { actions } = useQuantum();
    return actions;
}

// Convenience hook for just state
export function useQuantumState() {
    const { state } = useQuantum();
    return state;
}

export default QuantumContext;
