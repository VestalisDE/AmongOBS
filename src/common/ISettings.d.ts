export interface ISettings {
	serverURL: string;
	localLobbySettings: ILobbySettings;
}

export interface ILobbySettings {
	maxDistance: number;
}
