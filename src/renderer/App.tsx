import React, {
	useEffect,
	useState,
} from 'react';
import ReactDOM from 'react-dom';
import Game from './Game';
import Menu from './Menu';
import { ipcRenderer } from 'electron';
import { AmongUsState, AppState } from '../common/AmongUsState';
import { StreamingState } from '../common/StreamingState';
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

function App() {
	const [state, setState] = useState<AppState>(AppState.MENU);
	const [gameState, setGameState] = useState<AmongUsState>({} as AmongUsState);
	const [streamingState, setStreamingState] = useState<StreamingState>({} as StreamingState);
	const [error, setError] = useState('');

	useEffect(() => {
		const onOpen = (_: Electron.IpcRendererEvent, isOpen: boolean) => {
			setState(isOpen ? AppState.GAME : AppState.MENU);
		};
		const onOpenStream = (_: Electron.IpcRendererEvent, newState: StreamingState) => {
			console.log('[App] onOpenStream');
			console.log(newState);
			setStreamingState(newState);
		};
		const onState = (_: Electron.IpcRendererEvent, newState: AmongUsState) => {
			setGameState(newState);
		};
		const onError = (_: Electron.IpcRendererEvent, error: string) => {
			shouldInit = false;
			console.log(error);
			setError(error);
		};
		let shouldInit = true;
		ipcRenderer
			.invoke(IpcHandlerMessages.START_HOOK)
			.then(() => {
				if (shouldInit) {
					setGameState(ipcRenderer.sendSync(IpcSyncMessages.GET_INITIAL_STATE));
					let newState = ipcRenderer.sendSync(IpcSyncMessages.GET_INITIAL_STATE_STREAM);
					console.log(newState);
					setStreamingState(newState);
				}
			})
			.catch((error: Error) => {
				if (shouldInit) {
					shouldInit = false;
					console.log(error);
					setError(error.message);
				}
			});
		ipcRenderer.on(IpcRendererMessages.NOTIFY_GAME_OPENED, onOpen);
		ipcRenderer.on(IpcRendererMessages.NOTIFY_GAME_STATE_CHANGED, onState);
		ipcRenderer.on(IpcRendererMessages.ERROR, onError);
		ipcRenderer.on(IpcRendererMessages.NOTIFY_STREAM_CONNECTION, onOpenStream);
		return () => {
			ipcRenderer.off(IpcRendererMessages.NOTIFY_GAME_OPENED, onOpen);
			ipcRenderer.off(IpcRendererMessages.NOTIFY_GAME_STATE_CHANGED, onState);
			ipcRenderer.off(IpcRendererMessages.ERROR, onError);
			ipcRenderer.off(IpcRendererMessages.NOTIFY_STREAM_CONNECTION, onOpenStream);
			shouldInit = false;
		};
	}, []);

	let page;

	console.log(streamingState);
	if (state == AppState.GAME && streamingState !== null && streamingState.Connected) {
		page = <Game error={error} />;
	} else {
		page = <Menu error={error} gameState={state} obsState={streamingState} />;
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
