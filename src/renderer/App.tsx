import Store from 'electron-store';
import React, {
	Dispatch,
	ErrorInfo,
	ReactChild,
	SetStateAction,
	useEffect,
	useReducer,
	useState,
} from 'react';
import ReactDOM from 'react-dom';
import Game from './Game';
import Menu from './Menu';
import { App, ipcRenderer } from 'electron';
import { AmongUsState, AppState } from '../common/AmongUsState';
import Settings, {
	settingsReducer,
	sceneSettingsReducer,
} from './settings/Settings';
import { ISettings } from '../common/ISettings';
import {
	GameStateContext,
	SettingsContext,
	SceneSettingsContext,
	storeConfig,
} from './contexts';
import { StreamingState } from '../common/StreamingState';
import { ThemeProvider } from '@material-ui/core/styles';
import {
	IpcHandlerMessages,
	IpcMessages,
	IpcRendererMessages,
	IpcStreamingMessages,
	IpcSyncMessages,
} from '../common/ipc-messages';
import theme from './theme';
import SettingsIcon from '@material-ui/icons/Settings';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Button from '@material-ui/core/Button';
import './css/index.css';
import Typography from '@material-ui/core/Typography';
import SupportLink from './SupportLink';

const store = new Store<ISettings>(storeConfig);

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

interface TitleBarProps {
	settingsOpen: boolean;
	setSettingsOpen: Dispatch<SetStateAction<boolean>>;
}

const TitleBar: React.FC<TitleBarProps> = function ({
	settingsOpen,
	setSettingsOpen,
}: TitleBarProps) {
	const classes = useStyles();
	return (
		<div className={classes.root}>
			<span className={classes.title}>AmongOBS{appVersion}</span>
			<IconButton
				className={classes.button}
				style={{ left: 0 }}
				size="small"
				onClick={() => setSettingsOpen(!settingsOpen)}
			>
				<SettingsIcon htmlColor="#777" />
			</IconButton>
			<IconButton
				className={classes.button}
				style={{ right: 0 }}
				size="small"
				onClick={() => ipcRenderer.send(IpcMessages.QUIT_APPLICATION)}
			>
				<CloseIcon htmlColor="#777" />
			</IconButton>
		</div>
	);
};

interface ErrorBoundaryProps {
	children: ReactChild;
}
interface ErrorBoundaryState {
	error?: Error;
}

class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		// Update state so the next render will show the fallback UI.
		return { error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('React Error: ', error, errorInfo);
	}

	render(): ReactChild {
		if (this.state.error) {
			return (
				<div style={{ paddingTop: 16 }}>
					<Typography align="center" variant="h6" color="error">
						REACT ERROR
					</Typography>
					<Typography
						align="center"
						style={{
							whiteSpace: 'pre-wrap',
							fontSize: 12,
							maxHeight: 200,
							overflowY: 'auto',
						}}
					>
						{this.state.error.stack}
					</Typography>
					<SupportLink />
					<Button
						style={{ margin: '10px auto', display: 'block' }}
						variant="contained"
						color="secondary"
						onClick={() => window.location.reload()}
					>
						Reload App
					</Button>
				</div>
			);
		}

		return this.props.children;
	}
}

const App: React.FC = function () {
	const [state, setState] = useState<AppState>(AppState.MENU);
	const [gameState, setGameState] = useState<AmongUsState>({} as AmongUsState);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [streamingState, setStreamingState] = useState<StreamingState>({} as StreamingState);
	const [error, setError] = useState('');
	const settings = useReducer(settingsReducer, {
		software: 'OBS_STUDIO',
		url: 'ws://localhost:4444',
		token: '',
		scenes: [],
		sceneSettings: {
			menu: 'AmongUs_Menu',
			lobby: 'AmongUs_Lobby',
			tasks: 'AmongUs_Tasks',
			discussion: 'AmongUs_Discussion',
			unknown: 'AmongUs_Unknown',
		},
	});
	const sceneSettings = useReducer(
		sceneSettingsReducer,
		settings[0].sceneSettings
	);

	useEffect(() => {

		const onOpen = (_: Electron.IpcRendererEvent, isOpen: boolean) => {
			setState(isOpen ? AppState.GAME : AppState.MENU);
		};

		const onState = (_: Electron.IpcRendererEvent, newState: AmongUsState) => {
			setGameState(newState);
		};

		const onUpdateStream = (_: Electron.IpcRendererEvent, newState: StreamingState) => {

			let oldState = streamingState;
			setStreamingState(newState);

			if (oldState.Connected !== newState.Connected) {
				if (newState.Connected) {
					ipcRenderer.invoke(IpcStreamingMessages.START_STREAM).then(() => { }).catch((error: Error) => { });
				} else {
					ipcRenderer.invoke(IpcStreamingMessages.END_STREAM).then(() => { }).catch((error: Error) => { });
				}
			}

		};

		const onError = (_: Electron.IpcRendererEvent, error: string) => {
			shouldInit = false;
			console.log('Error:');
			console.log(error);
			setError(error);
		};
		let shouldInit = true;

		ipcRenderer
			.invoke(IpcHandlerMessages.START_HOOK, store.get('url'))
			.then(() => {
				if (shouldInit) {
					setGameState(ipcRenderer.sendSync(IpcSyncMessages.GET_INITIAL_STATE));
					setStreamingState(ipcRenderer.sendSync(IpcSyncMessages.GET_INITIAL_STATE_STREAM));
				}
			})
			.catch((error: Error) => {
				if (shouldInit) {
					shouldInit = false;
					console.log('Error:');
					console.log(error);
					setError(error.message);
				}
			});
		ipcRenderer.on(IpcRendererMessages.NOTIFY_GAME_OPENED, onOpen);
		ipcRenderer.on(IpcRendererMessages.NOTIFY_GAME_STATE_CHANGED, onState);
		ipcRenderer.on(IpcRendererMessages.ERROR, onError);
		ipcRenderer.on(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, onUpdateStream);
		return () => {
			ipcRenderer.off(IpcRendererMessages.NOTIFY_GAME_OPENED, onOpen);
			ipcRenderer.off(IpcRendererMessages.NOTIFY_GAME_STATE_CHANGED, onState);
			ipcRenderer.off(IpcRendererMessages.ERROR, onError);
			ipcRenderer.off(IpcStreamingMessages.NOTIFY_STREAM_CONNECTION, onUpdateStream);
			shouldInit = false;
		};
	}, []);

	let page;

	if (state == AppState.GAME && streamingState !== null && streamingState.Connected) {
		page = <Game error={error} />;
	} else {
		page = <Menu error={error} gameState={state} obsState={streamingState} />;
	}

	return (
		<GameStateContext.Provider value={gameState}>
			<SceneSettingsContext.Provider value={sceneSettings}>
				<SettingsContext.Provider value={settings}>
			<ThemeProvider theme={theme}>
						<TitleBar
							settingsOpen={settingsOpen}
							setSettingsOpen={setSettingsOpen}
						/>
						<ErrorBoundary>
							<>
								<Settings
									open={settingsOpen}
									onClose={() => setSettingsOpen(false)}
								/>
								{page}
							</>
						</ErrorBoundary>
			</ThemeProvider>
				</SettingsContext.Provider>
			</SceneSettingsContext.Provider>
		</GameStateContext.Provider>
	);
};

ReactDOM.render(<App />, document.getElementById('app'));