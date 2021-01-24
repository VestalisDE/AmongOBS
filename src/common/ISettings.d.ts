export interface ISettings {
	software: string;
	url: string;
	token: string;
	scenes: Array<object>;
	sceneSettings: ISceneSettings;
}

export interface ISceneSettings {
	menu: string;
	lobby: string;
	tasks: string;
	discussion: string;
	unknown: string;
}