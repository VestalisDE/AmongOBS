import { createContext } from 'react';
import { AmongUsState } from '../common/AmongUsState';

export const GameStateContext = createContext<AmongUsState>({} as AmongUsState);
