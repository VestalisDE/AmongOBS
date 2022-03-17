//import Store from 'electron-store';
//import { ISettings } from '../common/ISettings';
import { IpcStreamingMessages } from '../common/ipc-messages';
import { StreamingState, StreamingSoftware, Scene, SceneSource, SourceEditTypes, WebsocketMessages, WebsocketUpdates } from '../common/StreamingState';
//import { storeConfig } from '../renderer/contexts';
import { GameState } from '../common/AmongUsState';

//const store = new Store<ISettings>(storeConfig);
const sha256 = require('crypto-js/sha256');
const Base64 = require('crypto-js/enc-base64');
const WebSocket = require('ws');
const SockJS = require('sockjs-client');

export default class StreamingControl {
	sendIPC: Electron.WebContents['send'];
	streamingState: StreamingState = {} as StreamingState;
	streamingControl = this;
	ws: WebSocket | typeof SockJS;
	elementsToChange: Array<SceneSource> = [];

	// Refined
	constructor(socketUrl: String, sendIPC: Electron.WebContents['send']) {

		console.log('XXXXX StreamingControl XXXXX');
		console.log('socketUrl: ' + socketUrl);
		// let software = 0;//store.get('software');

		this.sendIPC = sendIPC;
		this.streamingState.Connected = false;
		this.streamingState.Software = (<any>StreamingSoftware)['OBS_STUDIO'];
		this.streamingState.Scenes = Array();
		//store.set('scenes', this.streamingState.Scenes);
		this.sendIPC(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, this.streamingState);

		console.log(this.streamingState.Software);

		switch (this.streamingState.Software) {
			case StreamingSoftware.OBS_STUDIO:
				this.ws = new WebSocket(socketUrl);
				break;
			case StreamingSoftware.STREAMLABS_OBS:
				this.ws = new SockJS(socketUrl);
				break;
		}

		console.log('Websocket: ');
		console.log(typeof this.ws);
		this.ws.onopen = (event: any) => this.onopen(event);
		this.ws.onclose = (event: any) => this.onclose(event);
		this.ws.onmessage = (event: any) => this.onmessage(event);
		this.ws.onerror = (error: any) => this.onerror(error);

	}

	// Refined
	onopen = function (this: StreamingControl, e: any) {
		
		// @todo TOKEN
		let token = 'xxxxxxxxx'; //store.get('token');

		switch (this.streamingState.Software) {
			case StreamingSoftware.OBS_STUDIO:
				this.ws.send(JSON.stringify({ 'message-id': String(WebsocketMessages.GET_AUTH_REQUIRED), 'request-type': 'GetAuthRequired' }));
				break;
			case StreamingSoftware.STREAMLABS_OBS:
				this.ws.send(JSON.stringify({ id: WebsocketMessages.AUTHENTICATE, jsonrpc: '2.0', method: 'auth', params: { resource: 'TcpServerService', args: [token], } }));
				break;
		}
	};

	onmessage = function (this: StreamingControl, event: any) {

		// @todo TOKEN
		let token = 'xxxxxxxxx'; //store.get('token');

		let data = JSON.parse(event.data);
		switch (this.streamingState.Software) {
			case StreamingSoftware.OBS_STUDIO:
				switch (data['message-id']) {
					case WebsocketMessages.GET_AUTH_REQUIRED:

						if (data.authRequired) {
							this.ws.send(
								JSON.stringify(
									{
										'message-id': String(WebsocketMessages.AUTHENTICATE),
										'request-type': 'Authenticate',
										'auth': Base64.stringify(sha256(Base64.stringify(sha256(token + data.salt)) + data.challenge))
									}
								)
							);
						} else {

							this.streamingState.Connected = true;
							this.sendIPC(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, this.streamingState);
							this.disableHeartbeat();
							this.getSceneList();

						}

						break;
					case WebsocketMessages.AUTHENTICATE:
						if (data.status === 'ok') {
							this.streamingState.Connected = true;
							this.sendIPC(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, this.streamingState);
							this.disableHeartbeat();
							this.getSceneList();
						} else {
							this.streamingState.Connected = false;
							this.sendIPC(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, this.streamingState);
						}
						break;
					case WebsocketMessages.SET_HEARTBEAT:
						if (data.status !== 'ok') {
							this.onerror(data);
						}
						break;
					case WebsocketMessages.GET_SCENE_LIST:
						let scenes = Array();
						data.scenes.forEach(function (value: any) {
							let scene: Scene = { id: value.name, name: value.name };
							scenes.push(scene);
						});
						this.streamingState.Scenes = scenes;
						//store.set('scenes', scenes);
						this.sendIPC(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, this.streamingState);
						break;
					case WebsocketMessages.CHANGE_SCENE:
						if (data.status !== 'ok') {
							this.onerror(data);
						}
						break;
					case WebsocketMessages.GET_SOURCE_SETTINGS:
						if (data.status == 'ok') {

							// As webservices are fully asynchronous we need to check here for elements which should be changed.
							// If anyone has a better idea, please contribute to the code!
							let elementsIdentified = this.elementsToChange.filter((e) => e.name == data.sourceName);
							elementsIdentified.map((element) => {

								let sourceSettings = data.sourceSettings;
								Object.entries(element.sourceSettings).forEach(([key, value]) => {

									if (element.modify) {
										switch (element.type) {
											case SourceEditTypes.COLOR:
												value = sourceSettings[key].substr(0, sourceSettings[key].lastIndexOf('/') + 1) + value + sourceSettings[key].substr(sourceSettings[key].lastIndexOf('.'));
												break;
										}
									}
									sourceSettings[key] = value;

								});
								let request = JSON.stringify({ 'message-id': WebsocketMessages.SET_SOURCE_SETTINGS, 'request-type': 'SetSourceSettings', 'sourceName': data.sourceName, 'sourceSettings': sourceSettings });
								this.ws.send(request);

							});

						} else {
							this.onerror(data);
						}
						break;
					case WebsocketMessages.SET_SOURCE_SETTINGS:
						if (data.status !== 'ok') {
							this.onerror(data);
						}
						break;
					case WebsocketMessages.SET_SCENE_ITEM_PROPERTIES:
						if (data.status !== 'ok') {
							this.onerror(data);
						}
						break;
					default:
						switch (data['update-type']) {
							case WebsocketUpdates.SwitchScenes:
							case WebsocketUpdates.TransitionBegin:
							case WebsocketUpdates.TransitionEnd:
							case WebsocketUpdates.TransitionVideoEnd:
							case WebsocketUpdates.SceneItemTransformChanged:
							case WebsocketUpdates.SceneItemVisibilityChanged:
								break;
							default:
								console.log('Unknown Message received');
								console.log(`[StreamingControl: message] Data received from server: ${event.data}`);
						}
				}
				break;
			case StreamingSoftware.STREAMLABS_OBS:
				switch (data.id) {
					case WebsocketMessages.AUTHENTICATE:
						if (data.result) {
							this.streamingState.Connected = true;
							this.sendIPC(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, this.streamingState);
							this.getSceneList();
						} else {
							this.streamingState.Connected = false;
							this.sendIPC(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, this.streamingState);
						}
						break;
					case WebsocketMessages.GET_SCENE_LIST:
						let scenes = Array();
						data.result.forEach(function (value: any) {
							let scene: Scene = { id: value.id, name: value.name };
							scenes.push(scene);
						});
						this.streamingState.Scenes = scenes;
						//store.set('scenes', scenes);
						this.sendIPC(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, this.streamingState);
						break;
					case WebsocketMessages.CHANGE_SCENE:
						if (!data.result) {
							this.onerror(data);
						}
						break;
					default:
						console.log('Unknown Message received');
						console.log(`[StreamingControl: message] Data received from server: ${event.data}`);

				}
				break;
		}



	};

	// Refined
	onclose = function (this: StreamingControl, event: any) {
		if (event.wasClean) {
			console.log(`[StreamingControl: close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
		} else {
			// e.g. server process killed or network down
			// event.code is usually 1006 in this case
			console.log('[StreamingControl: close] Connection died');
		}
		this.streamingState.Connected = false;
		this.sendIPC(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, this.streamingState);
	};

	// Refined
	onerror = function (this: StreamingControl, error: any) {
		console.log(`[StreamingControl: error] ${error.message}`);
		this.streamingState.Connected = false;
		this.sendIPC(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, this.streamingState);
	};

	// Refined
	dataError = function (error: any) {
		console.log(`[StreamingControl: dataError] ${error}`);
	}

	// Refined
	disableHeartbeat(): void {
		this.ws.send(JSON.stringify({ 'message-id': String(WebsocketMessages.SET_HEARTBEAT), 'request-type': 'SetHeartbeat', 'enable': false }));
	}

	// Refined
	getSceneList(): void {
		switch (this.streamingState.Software) {
			case StreamingSoftware.OBS_STUDIO:
				this.ws.send(JSON.stringify({ 'message-id': WebsocketMessages.GET_SCENE_LIST, 'request-type': 'GetSceneList' }));
				break;
			case StreamingSoftware.STREAMLABS_OBS:
				this.ws.send(JSON.stringify({ id: WebsocketMessages.GET_SCENE_LIST, jsonrpc: '2.0', method: 'getScenes', params: { resource: 'ScenesService' }, }));
				break;
		}
	}

	// Currently unused
	changeScene(gameState: GameState): void {

		let visible = true;

		switch (gameState) {
			case GameState.LOBBY:
				visible = true;
				break;
			case GameState.TASKS:
				visible = false;
				break;
			case GameState.DISCUSSION:
				visible = false;
				break;
			case GameState.MENU:
				visible = true;
				break;
			case GameState.UNKNOWN:
			default:
				visible = true;
		}
		
		let sceneId = '[N]_Capture';
		let itemId = 'Capture_Game_Blur';
		this.ws.send(JSON.stringify({ 'message-id': WebsocketMessages.SET_SCENE_ITEM_PROPERTIES, 'request-type': 'SetSceneItemProperties', 'scene-name': sceneId, 'item': itemId, 'visible': visible }));

		/*
		//const sceneSettings = null;//store.get('sceneSettings');
		let sceneId: string;

		switch (gameState) {
			case GameState.LOBBY:
				sceneId = 'sceneSettings.lobby';
				break;
			case GameState.TASKS:
				sceneId = 'sceneSettings.tasks';
				break;
			case GameState.DISCUSSION:
				sceneId = 'sceneSettings.discussion';
				break;
			case GameState.MENU:
				sceneId = 'sceneSettings.menu';
				break;
			case GameState.UNKNOWN:
			default:
				sceneId = 'sceneSettings.unknown';
		}

		console.log(gameState);
		console.log(sceneId);

		switch (this.streamingState.Software) {
			case StreamingSoftware.OBS_STUDIO:
				this.ws.send(JSON.stringify({ 'message-id': WebsocketMessages.CHANGE_SCENE, 'request-type': 'SetCurrentScene', 'scene-name': sceneId }));
				break;
			case StreamingSoftware.STREAMLABS_OBS:
				this.ws.send(JSON.stringify({ id: WebsocketMessages.CHANGE_SCENE, jsonrpc: '2.0', method: 'makeSceneActive', params: { resource: 'ScenesService', args: [sceneId] }, }));
				break;
		}
		*/

	}

	// Currently unused
	changePlayerInformation(type: SourceEditTypes, playerNumber: number, value: string): void {
		let sourceId = 'cam_'; // @todo get the prefix from settings
		let sourceSettings = {};
		let modify = false;

		switch (this.streamingState.Software) {
			case StreamingSoftware.OBS_STUDIO:

				switch (type) {
					case SourceEditTypes.NAME:
						sourceId += 'name_' + playerNumber;
						sourceSettings = { 'text': value };
						break;
					case SourceEditTypes.COLOR:
						sourceId += 'color_' + playerNumber;
						modify = true;
						sourceSettings = { 'file': value };
						break;
					case SourceEditTypes.VIDEO:
						sourceId += playerNumber;
						sourceSettings = { 'url': value };
						break;
				}

				this.elementsToChange.push({ name: sourceId, sourceSettings: sourceSettings, type: type, modify: modify });
				this.ws.send(JSON.stringify({ 'message-id': WebsocketMessages.GET_SOURCE_SETTINGS, 'request-type': 'GetSourceSettings', 'sourceName': sourceId }));
				break;
			case StreamingSoftware.STREAMLABS_OBS:
				break;
		}

	}

	// Currently unused
	setSourceVisibility(type: SourceEditTypes, playerNumber: number, value: boolean, sceneId = ''): void {

		let itemId = '';
		switch (this.streamingState.Software) {
			case StreamingSoftware.OBS_STUDIO:
				switch (type) {
					case SourceEditTypes.ISDEAD:
						itemId = 'cam_offline_' + playerNumber; // @todo get the prefix from settings
						break;
					case SourceEditTypes.SHOW:
						itemId = 'Webcam_' + playerNumber; // @todo get the prefix from settings
						break;
				}
				if (itemId != '') {
					if (sceneId != '') {
						this.ws.send(JSON.stringify({ 'message-id': WebsocketMessages.SET_SCENE_ITEM_PROPERTIES, 'request-type': 'SetSceneItemProperties', 'scene-name': sceneId, 'item': itemId, 'visible': value }));
					} else {
						this.ws.send(JSON.stringify({ 'message-id': WebsocketMessages.SET_SCENE_ITEM_PROPERTIES, 'request-type': 'SetSceneItemProperties', 'item': itemId, 'visible': value }));
					}
				}
				break;
			case StreamingSoftware.STREAMLABS_OBS:
				break;
		}

	}

}