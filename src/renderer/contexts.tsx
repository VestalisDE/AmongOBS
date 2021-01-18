import React, { createContext } from 'react';
import Store from 'electron-store';
import { AmongUsState } from '../common/AmongUsState';
import { ISettings, ISceneSettings } from '../common/ISettings';

type SettingsContextValue = [
	ISettings,
	React.Dispatch<{
		type: 'set' | 'setOne' | 'setSceneSetting';
		action: ISettings | [string, unknown];
	}>
];
type SceneSettingsContextValue = [
	ISceneSettings,
	React.Dispatch<{
		type: 'set' | 'setOne';
		action: ISceneSettings | [string, unknown];
	}>
];

export const GameStateContext = createContext<AmongUsState>({} as AmongUsState);
export const SettingsContext = createContext<SettingsContextValue>(
	(null as unknown) as SettingsContextValue
);
export const SceneSettingsContext = createContext<SceneSettingsContextValue>(
	(null as unknown) as SceneSettingsContextValue
);

export const storeConfig: Store.Options<ISettings> = {
	migrations: {},
	schema: {
		software: {
			type: 'string',
			default: '0',
		},
		url: {
			type: 'string',
			default: 'ws://localhost:4444',
		},
		token: {
			type: 'string',
			default: '',
		},
		sceneSettings: {
			type: 'object',
			properties: {
				menu: {
					type: 'string',
					default: 'Default',
				},
				lobby: {
					type: 'string',
					default: 'Default',
				},
				tasks: {
					type: 'string',
					default: 'Default',
				},
				discussion: {
					type: 'string',
					default: 'Default',
				},
				unknown: {
					type: 'string',
					default: 'Default',
				},
			},
			default: {
				menu: 'Default',
				lobby: 'Default',
				tasks: 'Default',
				discussion: 'Default',
				unknown: 'Default',
			},
		},
	},
};
