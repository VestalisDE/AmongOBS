import Store from 'electron-store';
import React, {
	useContext,
	useEffect,
	useState,
} from 'react';
import { ipcRenderer } from 'electron';
import {
	SettingsContext,
	SceneSettingsContext,
	storeConfig,
} from '../contexts';
import { ISettings, ISceneSettings } from '../../common/ISettings';
import {
	IpcHandlerMessages,
	IpcRendererMessages,
	//IpcStreamingMessages,
} from '../../common/ipc-messages';
import TextField from '@material-ui/core/TextField';
import makeStyles from '@material-ui/core/styles/makeStyles';
import withStyles from '@material-ui/core/styles/withStyles';
import Box from '@material-ui/core/Box';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import MuiDivider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import ChevronLeft from '@material-ui/icons/ArrowBack';
import IconButton from '@material-ui/core/IconButton';
import Alert from '@material-ui/lab/Alert';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';

interface StyleInput {
	open: boolean;
}

const Divider = withStyles((theme) => ({
	root: {
		width: '100%',
		marginTop: theme.spacing(2),
		marginBottom: theme.spacing(2),
	},
}))(MuiDivider);

const useStyles = makeStyles((theme) => ({
	root: {
		width: '100vw',
		height: `calc(100vh - ${theme.spacing(3)}px)`,
		background: '#171717ad',
		backdropFilter: 'blur(4px)',
		position: 'absolute',
		left: 0,
		top: 0,
		zIndex: 99,
		alignItems: 'center',
		marginTop: theme.spacing(3),
		transition: 'transform .1s ease-in-out',
		WebkitAppRegion: 'no-drag',
		transform: ({ open }: StyleInput) =>
			open ? 'translateX(0)' : 'translateX(-100%)',
	},
	header: {
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		height: 40,
	},
	scroll: {
		paddingTop: theme.spacing(3),
		paddingLeft: theme.spacing(2),
		paddingRight: theme.spacing(2),
		overflowY: 'auto',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'start',
		alignItems: 'center',
		paddingBottom: theme.spacing(7),
		height: `calc(100vh - 40px - ${theme.spacing(7 + 3 + 3)}px)`,
	},
	shortcutField: {
		marginTop: theme.spacing(1),
	},
	back: {
		cursor: 'pointer',
		position: 'absolute',
		right: theme.spacing(1),
		WebkitAppRegion: 'no-drag',
	},
	alert: {
		position: 'absolute',
		bottom: theme.spacing(1),
		zIndex: 10,
	},
	urlDialog: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'start',
		'&>*': {
			marginBottom: theme.spacing(1),
		},
	},
}));

const store = new Store<ISettings>(storeConfig);

export interface SettingsProps {
	open: boolean;
	onClose: () => void;
}

export const settingsReducer = (
	state: ISettings,
	action: {
		type: 'set' | 'setOne' | 'setSceneSetting';
		action: [string, unknown] | ISettings;
	}
): ISettings => {
	if (action.type === 'set') {
		return action.action as ISettings;
	}
	const v = action.action as [string, unknown];
	if (action.type === 'setSceneSetting') {
		const sceneSettings = {
			...state.sceneSettings,
			[v[0]]: v[1],
		};
		v[0] = 'sceneSettings';
		v[1] = sceneSettings;
	}
	store.set(v[0], v[1]);
	return {
		...state,
		[v[0]]: v[1],
	};
};

export const sceneSettingsReducer = (
	state: ISceneSettings,
	action: {
		type: 'set' | 'setOne';
		action: [string, unknown] | ISceneSettings;
	}
): ISceneSettings => {
	if (action.type === 'set') return action.action as ISceneSettings;
	const v = action.action as [string, unknown];
	return {
		...state,
		[v[0]]: v[1],
	};
};

type URLInputProps = {
	oldSoftware: string;
	oldURL: string;
	oldToken: string;
	onSafeConnection: (software: string, url: string, token: string) => void;
	className: string;
};

const URLInput: React.FC<URLInputProps> = function ({
	oldSoftware,
	oldURL,
	oldToken,
	onSafeConnection,
	className,
}: URLInputProps) {
	const [currentSoftware, setCurrentSoftware] = useState(oldSoftware);
	const [currentURL, setCurrentURL] = useState(oldURL);
	const [currentToken, setCurrentToken] = useState(oldToken);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		setCurrentSoftware(oldSoftware);
	}, [oldSoftware]);
	useEffect(() => {
		setCurrentURL(oldURL);
	}, [oldURL]);
	useEffect(() => {
		setCurrentToken(oldToken);
	}, [oldToken]);

	return (
		<>
			<Button variant="text" color="secondary" onClick={() => setOpen(true)}>
				Change Software Connection
			</Button>
			<Dialog fullScreen open={open} onClose={() => setOpen(false)}>
				<DialogTitle>Software Connection</DialogTitle>
				<DialogContent className={className}>
					<RadioGroup
						value={currentSoftware}
						onChange={(ev) => {
							setCurrentSoftware(ev.target.value);
						}}
					>
						<FormControlLabel
							label="OBS Studio"
							value="OBS_STUDIO"
							control={<Radio />}
						/>
						{/* @todo Activate Streamlabs OBS
							<FormControlLabel
							label="Streamlabs OBS"
							value="STREAMLABS_OBS"
							control={<Radio />}
						/>*/}
					</RadioGroup>
					<TextField
						fullWidth
						spellCheck={false}
						label="Host & Port"
						value={currentURL}
						variant="outlined"
						color="primary"
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
							setCurrentURL(event.target.value);
						}}
					/>
					<TextField
						fullWidth
						spellCheck={false}
						label="Token"
						value={currentToken}
						variant="outlined"
						color="primary"
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
							setCurrentToken(event.target.value);
						}}
					/>
					<Button
						color="primary"
						variant="contained"
						onClick={() => {
							setOpen(false);
							onSafeConnection('OBS_STUDIO', 'ws://localhost:4444', '');
						}}
					>
						Reset to default
					</Button>
				</DialogContent>
				<DialogActions>
					<Button
						color="primary"
						onClick={() => {
							setOpen(false);
							setCurrentSoftware(oldSoftware);
							setCurrentURL(oldURL);
							setCurrentToken(oldToken);
						}}
					>
						Cancel
					</Button>
					<Button
						color="primary"
						onClick={() => {
							setOpen(false);
							onSafeConnection(currentSoftware, currentURL, currentToken);
						}}
					>
						Confirm
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

const reloadScenes = function () {

	//ipcRenderer.sendSync(IpcStreamingMessages.STREAM_GET_SCENES);

}

const Settings: React.FC<SettingsProps> = function ({
	open,
	onClose,
}: SettingsProps) {
	const classes = useStyles({ open });
	const [settings, setSettings] = useContext(SettingsContext);
	const [sceneSettings, setSceneSettings] = useContext(SceneSettingsContext);
	const [unsavedCount, setUnsavedCount] = useState(0);
	const unsaved = unsavedCount > 2;
	useEffect(() => {
		reloadScenes();
		setSettings({
			type: 'set',
			action: store.store,
		});
		setSceneSettings({
			type: 'set',
			action: store.get('sceneSettings'),
		});
	}, []);

	useEffect(() => {
		setUnsavedCount((s) => s + 1);
	}, [
		settings.url,
	]);

	/*

				{(storeConfig.schema?.overlayPosition?.enum as string[]).map(
						(position) => (
							<option key={position} value={position}>
								{position[0].toUpperCase()}
								{position.substring(1)}
							</option>
						)
					)}

					onClick={updateDevices}
					{microphones.map((d) => (
						<option key={d.id} value={d.id}>
							{d.label}
						</option>
					))}
	 */
	return (
		<Box className={classes.root}>
			<div className={classes.header}>
				<IconButton
					className={classes.back}
					size="small"
					onClick={() => {
						setSettings({
							type: 'setOne',
							action: ['sceneSettings', sceneSettings],
						});
						if (unsaved) {
							onClose();
							location.reload();
						} else onClose();
					}}
				>
					<ChevronLeft htmlColor="#777" />
				</IconButton>
				<Typography variant="h6">Settings</Typography>
			</div>
			<div className={classes.scroll}>
				<Typography variant="h6">Scenes</Typography>
				<TextField
					select
					fullWidth
					label="Menu"
					variant="outlined"
					color="secondary"
					value={sceneSettings.menu}
					className={classes.shortcutField}
					SelectProps={{ native: true }}
					InputLabelProps={{ shrink: true }}
					onChange={(ev) => {
						setSettings({
							type: 'setSceneSetting',
							action: ['menu', ev.target.value],
						});
					}}
				>
					<option value="amongus_menu">amongus_menu</option>
					<option value="game_menu">game_menu</option>
				</TextField>
				<Divider />
				<URLInput
					oldSoftware={settings.software}
					oldURL={settings.url}
					oldToken={settings.token}
					onSafeConnection={(software: string, url: string, token: string) => {
						setSettings({
							type: 'setOne',
							action: ['software', software],
						});
						setSettings({
							type: 'setOne',
							action: ['url', url],
						});
						setSettings({
							type: 'setOne',
							action: ['token', token],
						});

						ipcRenderer.invoke(IpcHandlerMessages.START_HOOK, url).catch((error: Error) => {ipcRenderer.invoke(IpcRendererMessages.ERROR, error);});

					}}
					className={classes.urlDialog}
				/>
				<Alert
					className={classes.alert}
					severity="info"
					style={{ display: unsaved ? undefined : 'none' }}
				>
					Exit Settings to apply changes
				</Alert>
			</div>
		</Box>
	);
};

export default Settings;
