import { ipcMain } from 'electron';
import GameReader from './GameReader';
import StreamingControl from './StreamingControl';
import {
	IpcHandlerMessages,
	IpcRendererMessages,
	IpcStreamingMessages,
	IpcSyncMessages,
} from '../common/ipc-messages';
import { GameState } from '../common/AmongUsState';
import { SourceEditTypes } from '../common/StreamingState';

let readingGame = false;
let connected = false;
let gameReader: GameReader;
let streamingControl: StreamingControl;

ipcMain.on(IpcSyncMessages.GET_INITIAL_STATE, (event) => {
	if (!readingGame) {
		console.error(
			'Recieved GET_INITIAL_STATE message before the START_HOOK message was received'
		);
		event.returnValue = null;
		return;
	}
	event.returnValue = gameReader.lastState;
});

ipcMain.on(IpcSyncMessages.GET_INITIAL_STATE_STREAM, (event) => {
	event.returnValue = streamingControl.streamingState;
});

ipcMain.handle(IpcHandlerMessages.START_HOOK, async (event, url: String) => {
	if (!readingGame) {
		readingGame = true;

		// Read game memory
		gameReader = new GameReader(event.sender.send.bind(event.sender));

		const frame = () => {
			const err = gameReader.loop();
			if (err) {
				readingGame = false;
				event.sender.send(IpcRendererMessages.ERROR, err);
			} else {
				setTimeout(frame, 1000 / 20);
			}
		};
		frame();
	} else if (gameReader) {
		gameReader.amongUs = null;
	}
	if (!connected) {
		streamingControl = new StreamingControl(url, event.sender.send.bind(event.sender));
		connected = true;
	}
});

ipcMain.handle(IpcStreamingMessages.START_STREAM, async () => {
	connected = true;
});

ipcMain.handle(IpcStreamingMessages.END_STREAM, async () => {
	connected = false;
});

ipcMain.handle(IpcStreamingMessages.STREAM_CHANGE_SCENE, async (event, gameState: GameState) => {
	if (gameReader && connected) {
		streamingControl.changeScene(gameState);
	}
});

ipcMain.handle(IpcStreamingMessages.STREAM_CHANGE_PLAYERINFORMATION, async (event, type: SourceEditTypes, playerNumber: number, value: any) => {
	if (gameReader && connected) {
		switch (type) {
			case SourceEditTypes.NAME:
			case SourceEditTypes.COLOR:
			case SourceEditTypes.VIDEO:
				streamingControl.changePlayerInformation(type, playerNumber, value);
				break;
			case SourceEditTypes.ISDEAD:
			case SourceEditTypes.SHOW:
				streamingControl.setSourceVisibility(type, playerNumber, value);
				break;
		}
	}
});