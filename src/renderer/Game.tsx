import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ipcRenderer } from 'electron';
import Avatar from './Avatar';
import { GameStateContext } from './contexts';
import { GameState, Player } from '../common/AmongUsState';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import makeStyles from '@material-ui/core/styles/makeStyles';
import SupportLink from './SupportLink';
import Divider from '@material-ui/core/Divider';
import { IpcStreamingMessages, } from '../common/ipc-messages';
import { Streamer } from '../common/StreamingState';

interface OtherDead {
	[playerId: number]: boolean; // isTalking
}

interface currentStreamers {
	[playerId: number]: Streamer;
}

export interface GameProps {
	error: string;
}

const useStyles = makeStyles((theme) => ({
	error: {
		position: 'absolute',
		top: '50%',
		transform: 'translateY(-50%)',
	},
	root: {
		paddingTop: theme.spacing(3),
	},
	top: {
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
	},
	right: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
	},
	username: {
		display: 'block',
		textAlign: 'center',
		fontSize: 20,
	},
	code: {
		fontFamily: "'Source Code Pro', monospace",
		display: 'block',
		width: 'fit-content',
		margin: '5px auto',
		padding: 5,
		borderRadius: 5,
		fontSize: 28,
	},
	allplayers: {
		width: 225,
		height: 225,
		margin: '4px auto',
		'& .MuiGrid-grid-xs-1': {
			maxHeight: '8.3333333%',
		},
		'& .MuiGrid-grid-xs-2': {
			maxHeight: '16.666667%',
		},
		'& .MuiGrid-grid-xs-3': {
			maxHeight: '25%',
		},
		'& .MuiGrid-grid-xs-4': {
			maxHeight: '33.333333%',
		},
	},
	avatarWrapper: {
		width: 80,
		padding: theme.spacing(1),
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

const Game: React.FC<GameProps> = function ({
	error: initialError,
}: GameProps) {
	const [error] = useState(initialError);
	const gameState = useContext(GameStateContext);
	let { lobbyCode: displayedLobbyCode } = gameState;
	const [otherDead, setOtherDead] = useState<OtherDead>({});
	const classes = useStyles();
	const [currentStreamer, setCurrentStreamer] = useState<currentStreamers>({});

	// Set dead player data
	useEffect(() => {
		ipcRenderer.invoke(IpcStreamingMessages.STREAM_CHANGE_SCENE, gameState.gameState).then(() => { }).catch((error: Error) => { });
		switch (gameState.gameState) {
			case GameState.LOBBY:
				setOtherDead({});
				break;
			case GameState.TASKS:
				if (!gameState.players) return;
				setOtherDead((old) => {
					for (const player of gameState.players) {
						old[player.id] = player.isDead || player.disconnected;
					}
					return { ...old };
				});
				break;
		}
	}, [gameState.gameState]);

	const myPlayer = useMemo(() => {
		if (!gameState || !gameState.players) {
			return undefined;
		} else {
			return gameState.players.find((p) => p.isLocal);
		}
	}, [gameState.players]);

	/*
	const otherPlayers = useMemo(() => {

		let otherPlayers: Player[];
		if (
			!gameState ||
			!gameState.players ||
			gameState.lobbyCode === 'MENU' ||
			!myPlayer
		)
			return [];
		else otherPlayers = gameState.players.filter((p) => !p.isLocal);

		return otherPlayers;
	}, [gameState]);
	*/
	const allPlayers = useMemo(() => {
		let allPlayers: Player[];
		if (
			!gameState ||
			!gameState.players ||
			gameState.lobbyCode === 'MENU' ||
			!myPlayer
		)
			return [];
		else allPlayers = gameState.players;

		return allPlayers;
	}, [gameState]);

	const streamer = useMemo(() => {

		let streamer: Array<Streamer> = [];
		if (
			!gameState ||
			!gameState.players ||
			gameState.lobbyCode === 'MENU' ||
			!myPlayer
		) return [];

		Object.entries(gameState.players).forEach(([key, player]) => {
			if (player.name != '') {
				streamer.push({
					ptr: player.ptr,
					id: player.id,
					name: player.name,
					disconnected: false,
					colorId: player.colorId,
					isDead: player.isDead,
					isLocal: player.isLocal,
					isImpostor: player.isImpostor,
					camlink: '',
				});
			}
		});

		if (JSON.stringify(currentStreamer) != JSON.stringify(streamer)) {
			// something has changed at the players

			// check if there are less connected players than before
			let connectedStreamer = streamer.find((p) => !p.disconnected);
			if(typeof connectedStreamer !== 'undefined' && Object.keys(connectedStreamer).length > streamer.length){
				
				Object.entries(currentStreamer).forEach(([key, player]) => {
					if(!currentStreamer[parseInt(key)].disconnected){
						// Search for the player who left, and set them disconnected
						currentStreamer[parseInt(key)].disconnected = (typeof streamer.find((p) => p.name === player.name) === 'undefined');
						if(currentStreamer[parseInt(key)].disconnected){
							console.log('DISCONNECTED: ' + currentStreamer[parseInt(key)].name);
						}
					}
				});

			}



			console.log(streamer.length);
			Object.entries(currentStreamer).forEach(([key, player]) => {
				
				console.log('<Game.tsx> this one:');
				console.log(player);

				console.log('<Game.tsx> found them:');
				console.log(streamer.find((p) => p.name === player.name));
				
				if (JSON.stringify(player) != JSON.stringify(streamer[parseInt(key)])) {
					console.log('<Game.tsx> this one');
					console.log(player);
					console.log(streamer[parseInt(key)]);
				}
			});
			
			console.log(streamer);
			setCurrentStreamer(streamer);
		}

		return streamer;
	}, [gameState]);

	return (
		<div className={classes.root}>
			{error && (
				<div className={classes.error}>
					<Typography align="center" variant="h6" color="error">
						ERROR
					</Typography>
					<Typography align="center" style={{ whiteSpace: 'pre-wrap' }}>
						{error}
					</Typography>
					<SupportLink />
				</div>
			)}
			<div className={classes.top}>
				<span>{gameState.gameState === 0 ? 'LOBBY' : (gameState.gameState === 1 ? 'TASKS' : (gameState.gameState === 2 ? 'DISCUSSION' : (gameState.gameState === 3 ? 'MENU' : 'UNKNOWN')))}</span>
				{gameState.lobbyCode && (
					<span
						className={classes.code}
						style={{
							background:
								gameState.lobbyCode === 'MENU' ? 'transparent' : '#3e4346',
						}}
					>
						{displayedLobbyCode}
					</span>
				)}
			</div>
			{gameState.lobbyCode && <Divider />}
			<button
				className={classes.button}
				onClick={() => {
					ipcRenderer.invoke(IpcStreamingMessages.STREAM_CHANGE_PLAYERINFORMATION, 'COLOR', 10, 'yellow').then(() => { }).catch((error: Error) => { });
					ipcRenderer.invoke(IpcStreamingMessages.STREAM_CHANGE_PLAYERINFORMATION, 'NAME', 10, 'tipsyDE').then(() => { }).catch((error: Error) => { });
					ipcRenderer.invoke(IpcStreamingMessages.STREAM_CHANGE_PLAYERINFORMATION, 'VIDEO', 10, 'https://obs.ninja/?view=bq99guH&scene&room=schloenkomatCAMongUs&password=_Chris&label=SuperCooleWebcam_schloenkomat').then(() => { }).catch((error: Error) => { });
				}}
			>
				Chris
			</button>
			<button
				className={classes.button}
				onClick={() => {
					ipcRenderer.invoke(IpcStreamingMessages.STREAM_CHANGE_PLAYERINFORMATION, 'ISDEAD', 10, true).then(() => { }).catch((error: Error) => { });
				}}
			>
				Kill
			</button>
			<button
				className={classes.button}
				onClick={() => {
					ipcRenderer.invoke(IpcStreamingMessages.STREAM_CHANGE_PLAYERINFORMATION, 'SHOW', 10, false).then(() => { }).catch((error: Error) => { });
				}}
			>
				Hide
			</button>
			<Divider />
			<Grid
				container
				spacing={1}
				className={classes.allplayers}
				alignItems="flex-start"
				alignContent="flex-start"
				justify="flex-start"
			>
				{allPlayers.map((player) => {
					return (
						<Grid
							item
							key={player.id}
							xs={getPlayersPerRow(allPlayers.length)}
						>
							<Avatar
								player={player}
								isAlive={!otherDead[player.id]}
								size={50}
								isImpostor={player.isImpostor}
							/>
						</Grid>
					);
				})}
			</Grid>
		</div>
	);
};

type ValidPlayersPerRow = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
function getPlayersPerRow(playerCount: number): ValidPlayersPerRow {
	if (playerCount <= 9) return (12 / 3) as ValidPlayersPerRow;
	else
		return Math.min(
			12,
			Math.floor(12 / Math.ceil(Math.sqrt(playerCount)))
		) as ValidPlayersPerRow;
}

export default Game;
