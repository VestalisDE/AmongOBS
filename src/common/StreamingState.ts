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

export interface SceneSource {
	name: String;
	sourceSettings: object;
	type: SourceEditTypes;
	modify: boolean;
}

export enum SourceEditTypes {
	NAME = 'NAME',
	COLOR = 'COLOR',
	VIDEO = 'VIDEO',
	ISDEAD = 'ISDEAD',
	SHOW = 'SHOW',
}

export enum WebsocketMessages {
	SET_HEARTBEAT = 'SET_HEARTBEAT',
	GET_AUTH_REQUIRED = 'GET_AUTH_REQUIRED',
	AUTHENTICATE = 'AUTHENTICATE',
	GET_SCENE_LIST = 'GET_SCENE_LIST',
	CHANGE_SCENE = 'CHANGE_SCENE',
	GET_SOURCE_SETTINGS = 'GET_SOURCE_SETTINGS',
	SET_SOURCE_SETTINGS = 'SET_SOURCE_SETTINGS',
	SET_SCENE_ITEM_PROPERTIES = 'SET_SCENE_ITEM_PROPERTIES',
}

export enum WebsocketUpdates {
	SwitchScenes = 'SwitchScenes',
	ScenesChanged = 'ScenesChanged',
	SceneCollectionChanged = 'SceneCollectionChanged',
	SceneCollectionListChanged = 'SceneCollectionListChanged',
	SwitchTransition = 'SwitchTransition',
	TransitionListChanged = 'TransitionListChanged',
	TransitionDurationChanged = 'TransitionDurationChanged',
	TransitionBegin = 'TransitionBegin',
	TransitionEnd = 'TransitionEnd',
	TransitionVideoEnd = 'TransitionVideoEnd',
	ProfileChanged = 'ProfileChanged',
	ProfileListChanged = 'ProfileListChanged',
	StreamStarting = 'StreamStarting',
	StreamStarted = 'StreamStarted',
	StreamStopping = 'StreamStopping',
	StreamStopped = 'StreamStopped',
	StreamStatus = 'StreamStatus',
	RecordingStarting = 'RecordingStarting',
	RecordingStarted = 'RecordingStarted',
	RecordingStopping = 'RecordingStopping',
	RecordingStopped = 'RecordingStopped',
	RecordingPaused = 'RecordingPaused',
	RecordingResumed = 'RecordingResumed',
	ReplayStarting = 'ReplayStarting',
	ReplayStarted = 'ReplayStarted',
	ReplayStopping = 'ReplayStopping',
	ReplayStopped = 'ReplayStopped',
	Exiting = 'Exiting',
	Heartbeat = 'Heartbeat',
	BroadcastCustomMessage = 'BroadcastCustomMessage',
	SourceCreated = 'SourceCreated',
	SourceDestroyed = 'SourceDestroyed',
	SourceVolumeChanged = 'SourceVolumeChanged',
	SourceMuteStateChanged = 'SourceMuteStateChanged',
	SourceAudioSyncOffsetChanged = 'SourceAudioSyncOffsetChanged',
	SourceAudioMixersChanged = 'SourceAudioMixersChanged',
	SourceRenamed = 'SourceRenamed',
	SourceFilterAdded = 'SourceFilterAdded',
	SourceFilterRemoved = 'SourceFilterRemoved',
	SourceFilterVisibilityChanged = 'SourceFilterVisibilityChanged',
	SourceFiltersReordered = 'SourceFiltersReordered',
	SourceOrderChanged = 'SourceOrderChanged',
	SceneItemAdded = 'SceneItemAdded',
	SceneItemRemoved = 'SceneItemRemoved',
	SceneItemVisibilityChanged = 'SceneItemVisibilityChanged',
	SceneItemLockChanged = 'SceneItemLockChanged',
	SceneItemTransformChanged = 'SceneItemTransformChanged',
	SceneItemSelected = 'SceneItemSelected',
	SceneItemDeselected = 'SceneItemDeselected',
	PreviewSceneChanged = 'PreviewSceneChanged',
	StudioModeSwitched = 'StudioModeSwitched',
}

export interface StreamPlayer {
	name: string;
	colorId: number;
	//hatId: number;
	//petId: number;
	//skinId: number;
	disconnected: boolean;
	isImpostor: boolean;
	isDead: boolean;
	//taskPtr: number;
	//objectPtr: number;
	isLocal: boolean;
	//x: number;
	//y: number;
	//inVent: boolean;
	camlink: string;
}
