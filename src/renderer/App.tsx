import React, {
	useEffect,
	useState,
} from 'react';
import ReactDOM from 'react-dom';
import Game from './Game';
import Menu from './Menu';
import { ipcRenderer } from 'electron';
import { AmongUsState } from '../common/AmongUsState';
import { GameStateContext } from './contexts';
import { ThemeProvider } from '@material-ui/core/styles';
import {
	IpcHandlerMessages,
	IpcMessages,
	IpcRendererMessages,
	IpcSyncMessages,
} from '../common/ipc-messages';
import theme from './theme';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import makeStyles from '@material-ui/core/styles/makeStyles';

let appVersion = '';
if (typeof window !== 'undefined' && window.location) {
	const query = new URLSearchParams(window.location.search.substring(1));
	appVersion = ' v' + query.get('version') || '';
}

const useStyles = makeStyles(() => ({
	root: {
		position: 'absolute',
		width: '100vw',
		height: theme.spacing(3),
		backgroundColor: '#1d1a23',
		top: 0,
		WebkitAppRegion: 'drag',
	},
	title: {
		width: '100%',
		textAlign: 'center',
		display: 'block',
		height: theme.spacing(3),
		lineHeight: `${theme.spacing(3)}px`,
		color: theme.palette.primary.main,
	},
	button: {
		WebkitAppRegion: 'no-drag',
		marginLeft: 'auto',
		padding: 0,
		position: 'absolute',
		top: 0,
	},
}));

interface TitleBarProps {}

const TitleBar: React.FC<TitleBarProps> = function ({}: TitleBarProps) {
	const classes = useStyles();
	return (
		<div className={classes.root}>
			<span className={classes.title}>AmongOBS{appVersion}</span>
			<IconButton
				className={classes.button}
				style={{ right: 0 }}
				size="small"
				onClick={() => ipcRenderer.send(IpcMessages.QUIT_CREWLINK)}
			>
				<CloseIcon htmlColor="#777" />
			</IconButton>
		</div>
	);
};

enum AppState {
	MENU,
	GAME,
}

function App() {
	const [state, setState] = useState<AppState>(AppState.MENU);
	const [gameState, setGameState] = useState<AmongUsState>({} as AmongUsState);
	const [error, setError] = useState('');

	useEffect(() => {
		const onOpen = (_: Electron.IpcRendererEvent, isOpen: boolean) => {
			setState(isOpen ? AppState.GAME : AppState.MENU);
		};
		const onState = (_: Electron.IpcRendererEvent, newState: AmongUsState) => {
			setGameState(newState);
		};
		const onError = (_: Electron.IpcRendererEvent, error: string) => {
			shouldInit = false;
			setError(error);
		};
		let shouldInit = true;
		ipcRenderer
			.invoke(IpcHandlerMessages.START_HOOK)
			.then(() => {
				if (shouldInit) {
					setGameState(ipcRenderer.sendSync(IpcSyncMessages.GET_INITIAL_STATE));
				}
			})
			.catch((error: Error) => {
				if (shouldInit) {
					shouldInit = false;
					setError(error.message);
				}
			});
		ipcRenderer.on(IpcRendererMessages.NOTIFY_GAME_OPENED, onOpen);
		ipcRenderer.on(IpcRendererMessages.NOTIFY_GAME_STATE_CHANGED, onState);
		ipcRenderer.on(IpcRendererMessages.ERROR, onError);
		return () => {
			ipcRenderer.off(IpcRendererMessages.NOTIFY_GAME_OPENED, onOpen);
			ipcRenderer.off(IpcRendererMessages.NOTIFY_GAME_STATE_CHANGED, onState);
			ipcRenderer.off(IpcRendererMessages.ERROR, onError);
			shouldInit = false;
		};
	}, []);

	let page;
	switch (state) {
		case AppState.MENU:
			page = <Menu error={error} />;
			break;
		case AppState.GAME:
			page = <Game error={error} />;
			break;
	}

	return (
		<GameStateContext.Provider value={gameState}>
			<ThemeProvider theme={theme}>
				<TitleBar />
				{page}
			</ThemeProvider>
		</GameStateContext.Provider>
	);
}

ReactDOM.render(<App />, document.getElementById('app'));
