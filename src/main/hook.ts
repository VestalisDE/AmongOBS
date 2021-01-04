import { ipcMain } from 'electron';
import GameReader from './GameReader';
import {
	IpcHandlerMessages,
	IpcRendererMessages,
	IpcSyncMessages,
} from '../common/ipc-messages';

let readingGame = false;
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
});