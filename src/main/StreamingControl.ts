import Store from 'electron-store';
import { ISettings } from '../common/ISettings';
import { IpcStreamingMessages } from '../common/ipc-messages';
import { StreamingState, StreamingSoftware, Scene } from '../common/StreamingState';
import { storeConfig } from '../renderer/contexts';

const store = new Store<ISettings>(storeConfig);

const sha256 = require("crypto-js/sha256");
const Base64 = require("crypto-js/enc-base64");
const WebSocket = require('ws');

enum WebsocketMessages {
	SetHeartbeat,
	GetAuthRequired,
	Authenticate,
	GetSceneList,
}

export default class StreamingControl extends WebSocket {
	sendIPC: Electron.WebContents['send'];
	streamingState: StreamingState = {} as StreamingState;
	streamingControl = this;

	constructor(socketUrl: String, sendIPC: Electron.WebContents['send']) {
		super(socketUrl);
		this.sendIPC = sendIPC;
		this.streamingState.Connected = false;
		this.streamingState.Software = (<any>StreamingSoftware)[store.get('software')];
		this.streamingState.Scenes = Array();
		this.sendIPC(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, this.streamingState);
	}

	onopen = function (this: StreamingControl, e: any) {
		this.send(JSON.stringify({ 'message-id': String(WebsocketMessages.GetAuthRequired), 'request-type': 'GetAuthRequired' }));
	};

	onmessage = function (this: StreamingControl, event: any) {

		let data = JSON.parse(event.data);
		switch (parseInt(data['message-id'])) {
			case WebsocketMessages.GetAuthRequired:

				if (data.authRequired) {
					let password = store.get('token');

					this.send(
						JSON.stringify(
							{
								'message-id': String(WebsocketMessages.Authenticate),
								'request-type': 'Authenticate',
								'auth': Base64.stringify(sha256(Base64.stringify(sha256(password + data.salt)) + data.challenge))
							}
						)
					);
				} else {

					this.streamingState.Connected = true;
					console.log('[StreamingControl.ts] GetAuthRequired');
					console.log(this.streamingState);
					this.sendIPC(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, this.streamingState);
					this.disableHeartbeat();

				}
				/**/
				break;
			case WebsocketMessages.Authenticate:
				if (data.status === 'ok') {
					this.streamingState.Connected = true;
					console.log('[StreamingControl.ts] Authenticate true');
					console.log(this.streamingState);
					this.sendIPC(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, this.streamingState);
					this.disableHeartbeat();
				} else {
					this.streamingState.Connected = false;
					console.log('[StreamingControl.ts] Authenticate false');
					console.log(this.streamingState);
					this.sendIPC(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, this.streamingState);
				}
				break;
			case WebsocketMessages.SetHeartbeat:
				if (data.status !== 'ok') {
					this.onerror(data);
				}
				break;
			case WebsocketMessages.GetSceneList:
				console.log('Received Answer GetSceneList');
				let scenes = Array();
				data.scenes.forEach(function (value: any) {
					let scene: Scene = { id: value.name, name: value.name };
					scenes.push(scene);
				});
				this.streamingState.Scenes = scenes;
				console.log('[StreamingControl.ts] GetSceneList');
				console.log(this.streamingState);
				this.sendIPC(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, this.streamingState);
				break;
			default:
				console.log('Unknown Message received');
				console.log(`[StreamingControl: message] Data received from server: ${event.data}`);

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
		console.log('[StreamingControl.ts] onclose');
		console.log(this.streamingState);
		this.sendIPC(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, this.streamingState);
	};

	onerror = function (this: StreamingControl, error: any) {
		console.log(`[StreamingControl: error] ${error.message}`);
		this.streamingState.Connected = false;
		console.log('[StreamingControl.ts] onerror');
		console.log(this.streamingState);
		this.sendIPC(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, this.streamingState);
	};

	dataError = function (error: any) {
		console.log(`[StreamingControl: dataError] ${error}`);
	}

	disableHeartbeat(): void {
		this.send(JSON.stringify({ 'message-id': String(WebsocketMessages.SetHeartbeat), 'request-type': 'SetHeartbeat', 'enable': false }));
	}

	getSceneList(): void {
		this.send(JSON.stringify({ 'message-id': String(WebsocketMessages.GetSceneList), 'request-type': 'GetSceneList' }));
	}

}