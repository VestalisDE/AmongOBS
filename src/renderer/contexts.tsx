import React, { createContext } from 'react';
import Store from 'electron-store';
import { AmongUsState } from '../common/AmongUsState';
import { ISettings, ILobbySettings } from '../common/ISettings';

type SettingsContextValue = [
	ISettings,
	React.Dispatch<{
		type: 'set' | 'setOne' | 'setLobbySetting';
		action: ISettings | [string, unknown];
	}>
];
type LobbySettingsContextValue = [
	ILobbySettings,
	React.Dispatch<{
		type: 'set' | 'setOne';
		action: ILobbySettings | [string, unknown];
	}>
];

export const PlayerColorContext = createContext<string[][]>([] as string[][]);
export const GameStateContext = createContext<AmongUsState>({} as AmongUsState);
export const SettingsContext = createContext<SettingsContextValue>((null as unknown) as SettingsContextValue);
export const LobbySettingsContext = createContext<LobbySettingsContextValue>(
	(null as unknown) as LobbySettingsContextValue
);

export const storeConfig: Store.Options<ISettings> = {
	migrations: {},
	schema: {
		software: {
			type: 'string',
			default: 'OBS_STUDIO',
		},
		url: {
			type: 'string',
			default: 'ws://localhost:4444',
		},
		token: {
			type: 'string',
			default: '',
		},
		scenes: {
			type: 'array',
			default: [],
		},
		sceneSettings: {
			type: 'object',
			properties: {
				menu: {
					type: 'string',
					default: 'AmongUs_Menu',
				},
				lobby: {
					type: 'string',
					default: 'AmongUs_Lobby',
				},
				tasks: {
					type: 'string',
					default: 'AmongUs_Tasks',
				},
				discussion: {
					type: 'string',
					default: 'AmongUs_Discussion',
				},
				unknown: {
					type: 'string',
					default: 'AmongUs_Unknown',
				},
			},
			default: {
				menu: 'AmongUs_Menu',
				lobby: 'AmongUs_Lobby',
				tasks: 'AmongUs_Tasks',
				discussion: 'AmongUs_Discussion',
				unknown: 'AmongUs_Unknown',
			},
		},
	},
};
