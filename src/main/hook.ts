import { ipcMain } from 'electron';
import GameReader from './GameReader';
import StreamingControl from './StreamingControl';
import {
	IpcHandlerMessages,
	IpcRendererMessages,
	IpcSyncMessages,
} from '../common/ipc-messages';

let readingGame = false;
let connected = false;
let gameReader: GameReader;

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
		event.returnValue = {
			Software: 0,
			Connected: false,
		};
});

ipcMain.handle(IpcHandlerMessages.START_HOOK, async (event) => {
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
		new StreamingControl('ws://localhost:4444', event.sender.send.bind(event.sender)); // @todo - get socketURL from settings
		connected = true;
	}
});