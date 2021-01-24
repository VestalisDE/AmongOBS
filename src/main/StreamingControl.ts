import Store from 'electron-store';
import { ISettings } from '../common/ISettings';
import { IpcStreamingMessages } from '../common/ipc-messages';
import { StreamingState, StreamingSoftware, Scene } from '../common/StreamingState';
import { storeConfig } from '../renderer/contexts';
import { GameState } from '../common/AmongUsState';

const store = new Store<ISettings>(storeConfig);
const sha256 = require("crypto-js/sha256");
const Base64 = require("crypto-js/enc-base64");
const WebSocket = require('ws');
const SockJS = require('sockjs-client');

enum WebsocketMessages {
	SET_HEARTBEAT = 'SET_HEARTBEAT',
	GET_AUTH_REQUIRED = 'GET_AUTH_REQUIRED',
	AUTHENTICATE = 'AUTHENTICATE',
	GET_SCENE_LIST = 'GET_SCENE_LIST',
	CHANGE_SCENE = 'CHANGE_SCENE',
}

export default class StreamingControl {
	sendIPC: Electron.WebContents['send'];
	streamingState: StreamingState = {} as StreamingState;
	streamingControl = this;
	ws: WebSocket | typeof SockJS;

	constructor(socketUrl: String, sendIPC: Electron.WebContents['send']) {
		this.sendIPC = sendIPC;
		this.streamingState.Connected = false;
		this.streamingState.Software = (<any>StreamingSoftware)[store.get('software')];
		this.streamingState.Scenes = Array();
		store.set('scenes', this.streamingState.Scenes);
		this.sendIPC(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, this.streamingState);

		switch (this.streamingState.Software) {
			case StreamingSoftware.OBS_STUDIO:
				this.ws = new WebSocket(socketUrl);
				break;
			case StreamingSoftware.STREAMLABS_OBS:
				this.ws = new SockJS(socketUrl);
				break;
		}
		this.ws.onopen = (event: any) => this.onopen(event);
		this.ws.onclose = (event: any) => this.onclose(event);
		this.ws.onmessage = (event: any) => this.onmessage(event);
		this.ws.onerror = (error: any) => this.onerror(error);

	}	

	onopen = function (this: StreamingControl, e: any) {
		switch (this.streamingState.Software) {
			case StreamingSoftware.OBS_STUDIO:
				this.ws.send(JSON.stringify({ 'message-id': String(WebsocketMessages.GET_AUTH_REQUIRED), 'request-type': 'GetAuthRequired' }));
				break;
			case StreamingSoftware.STREAMLABS_OBS:
				this.ws.send(JSON.stringify({ id: WebsocketMessages.AUTHENTICATE, jsonrpc: '2.0', method: 'auth', params: { resource: 'TcpServerService', args: [store.get('token')], } }));
				break;
		}
	};

	onmessage = function (this: StreamingControl, event: any) {

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
										'auth': Base64.stringify(sha256(Base64.stringify(sha256(store.get('token') + data.salt)) + data.challenge))
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
						store.set('scenes', scenes);
						this.sendIPC(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, this.streamingState);
						break;
					case WebsocketMessages.CHANGE_SCENE:
						if (data.status !== 'ok') {
							this.onerror(data);
						}
						break;
					default:
						console.log('Unknown Message received');
						console.log(`[StreamingControl: message] Data received from server: ${event.data}`);
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
						store.set('scenes', scenes);
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

	onerror = function (this: StreamingControl, error: any) {
		console.log(`[StreamingControl: error] ${error.message}`);
		this.streamingState.Connected = false;
		this.sendIPC(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, this.streamingState);
	};

	dataError = function (error: any) {
		console.log(`[StreamingControl: dataError] ${error}`);
	}

	disableHeartbeat(): void {
		this.ws.send(JSON.stringify({ 'message-id': String(WebsocketMessages.SET_HEARTBEAT), 'request-type': 'SetHeartbeat', 'enable': false }));
	}

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

	changeScene(gameState: GameState): void {
		const sceneSettings = store.get('sceneSettings');
		let sceneId: string;

		switch (gameState) {
			case GameState.LOBBY:
				sceneId = sceneSettings.lobby;
				break;
			case GameState.TASKS:
				sceneId = sceneSettings.tasks;
				break;
			case GameState.DISCUSSION:
				sceneId = sceneSettings.discussion;
				break;
			case GameState.MENU:
				sceneId = sceneSettings.menu;
				break;
			case GameState.UNKNOWN:
			default:
				sceneId = sceneSettings.unknown;
		}

		switch (this.streamingState.Software) {
			case StreamingSoftware.OBS_STUDIO:
				this.ws.send(JSON.stringify({ 'message-id': WebsocketMessages.CHANGE_SCENE, 'request-type': 'SetCurrentScene', 'scene-name': sceneId }));
				break;
			case StreamingSoftware.STREAMLABS_OBS:
				console.log(JSON.stringify({ id: WebsocketMessages.CHANGE_SCENE, jsonrpc: '2.0', method: 'makeSceneActive', params: { resource: 'ScenesService', args: [sceneId] }, }));
				this.ws.send(JSON.stringify({ id: WebsocketMessages.CHANGE_SCENE, jsonrpc: '2.0', method: 'makeSceneActive', params: { resource: 'ScenesService', args: [sceneId] }, }));
				break;
		}
		
	}

}