import { ipcMain } from 'electron';
import GameReader from './GameReader';
import StreamingControl from './StreamingControl';
import {
	IpcHandlerMessages,
	IpcRendererMessages,
	IpcStreamingMessages,
	IpcSyncMessages,
} from '../common/ipc-messages';

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

ipcMain.on(IpcStreamingMessages.STREAM_GET_SCENES, (event) => {

	if (connected) {
		console.log('STREAM_GET_SCENES');
		streamingControl.getSceneList();
	}

	event.returnValue = {
		Software: 0,
		Connected: false,
	};
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
	}
});

ipcMain.handle(IpcStreamingMessages.START_STREAM, async () => {
	console.log('[hook.ts] connected = TRUE');
	connected = true;
});

ipcMain.handle(IpcStreamingMessages.END_STREAM, async () => {
	console.log('[hook.ts] connected = false');
	connected = false;
});