import React from 'react';
import Store from 'electron-store';
import { ipcRenderer } from 'electron';
import Footer from './Footer';
import {
	IpcHandlerMessages,
	IpcMessages,
	IpcRendererMessages,
} from '../common/ipc-messages';
import { ISettings } from '../common/ISettings';
import { storeConfig } from './contexts';
import makeStyles from '@material-ui/core/styles/makeStyles';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import { AppState } from '../common/AmongUsState';
import { StreamingState, StreamingSoftware } from '../common/StreamingState';

const store = new Store<ISettings>(storeConfig);

const useStyles = makeStyles((theme) => ({
	root: {
		width: '100vw',
		height: '100vh',
		paddingTop: theme.spacing(3),
	},
	error: {
		paddingTop: theme.spacing(4),
	},
	menu: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'start',
	},
	waiting: {
		fontSize: 20,
		marginTop: 12,
		marginBottom: 12,
	},
	button: {
		color: 'white',
		background: 'none',
		padding: '2px 10px',
		borderRadius: 10,
		border: '4px solid white',
		fontSize: 24,
		outline: 'none',
		fontWeight: 500,
		fontFamily: '"Varela", sans-serif',
		marginTop: 0,
		marginBottom: 12,
		'&:hover': {
			borderColor: '#00ff00',
			cursor: 'pointer',
		},
	},
}));

export interface MenuProps {
	error: string;
	gameState: AppState;
	obsState: StreamingState;
}

const Menu: React.FC<MenuProps> = function ({ error, gameState, obsState }: MenuProps) {
	const classes = useStyles();
	return (
		<div className={classes.root}>
			<div className={classes.menu}>
				{error ? (
					<div className={classes.error}>
						<Typography align="center" variant="h6" color="error">
							ERROR
						</Typography>
						<Typography align="center" style={{ whiteSpace: 'pre-wrap' }}>
							{error}
						</Typography>
					</div>
				) : (
						<>
							{gameState == AppState.GAME ? (
								<><span className={classes.waiting}>Among Us Connected</span></>
							): (
								<>
									<span className={classes.waiting}>Waiting for Among Us</span>
									<button
										className={classes.button}
										onClick={() => {
											ipcRenderer.send(IpcMessages.OPEN_AMONG_US_GAME);
										}}
									>
										Open Game
									</button>
								</>
								)}
							<CircularProgress color="primary" size={40} />
							{obsState.Connected ? (
								<><span className={classes.waiting}>{store.get('software') == StreamingSoftware.STREAMLABS_OBS ? (<>Streamlabs</>) : (<>OBS</>)} Connected</span></>
							): (
									<>
										<span className={classes.waiting}>{store.get('software') == StreamingSoftware.STREAMLABS_OBS ? (<>Streamlabs</>) : (<>OBS</>)} DISCONNECTED</span>
									<button
										className={classes.button}
										onClick={() => {

											ipcRenderer.invoke(IpcHandlerMessages.START_HOOK, store.get('url')).catch((error: Error) => { ipcRenderer.invoke(IpcRendererMessages.ERROR, error); });
										}}
									>
										Connect WS
									</button>
								</>
								)}
					</>
				)}
				<Footer />
			</div>
		</div>
	);
};

export default Menu;
