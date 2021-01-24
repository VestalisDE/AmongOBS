export interface StreamingState {
	Software: StreamingSoftware;
	Connected: boolean;
	Scenes: Scene[];
}

export enum StreamingSoftware {
	OBS_STUDIO = 'OBS_STUDIO',
	STREAMLABS_OBS = 'STREAMLABS_OBS'
}

export interface Scene {
	id: String;
	name: String;
}
