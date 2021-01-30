import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ipcRenderer } from 'electron';
import Avatar from './Avatar';
import { GameStateContext } from './contexts';
import { AmongUsState, GameState, Player } from '../common/AmongUsState';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import makeStyles from '@material-ui/core/styles/makeStyles';
import SupportLink from './SupportLink';
import Divider from '@material-ui/core/Divider';
import { IpcStreamingMessages, } from '../common/ipc-messages';
import { StreamPlayer } from '../common/StreamingState';

interface OtherDead {
	[playerId: number]: boolean; // isTalking
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
	const [currentPlayers, setCurrentPlayers] = useState<Array<StreamPlayer>>();
	const [playerHistory, setPlayerHistory] = useState<Array<StreamPlayer>>();
	//const [previousGameState, setPreviousGameState] = useState<AmongUsState>();

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

	useEffect(() => {

		let newPlayers: Array<StreamPlayer> = [];
		let connectedCurrentPlayers: Array<StreamPlayer> = [];

		/*
		console.log('previousGameState');
		console.log(previousGameState);
		console.log('gameState');
		console.log(gameState);
		setPreviousGameState(gameState);
		console.log('previousGameState');
		console.log(previousGameState);
		*/

		/*
		if (
			!gameState ||
			!gameState.players ||
			gameState.lobbyCode === 'MENU' ||
			!myPlayer
		) return;
		*/

		// All players who are in the same game now are added to newPlayers
		Object.entries(gameState.players).forEach(([key, player]) => {
			if (player.name != '') {
				newPlayers.push({
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

		// If there was no change, newPlayers and currentPlayers should be exactly the same
		if (JSON.stringify(currentPlayers) != JSON.stringify(newPlayers)) {

			// If currentPlayers was not set before, we can simply skip the validations and just set it to newPlayers
			if (typeof currentPlayers !== 'undefined') {

				connectedCurrentPlayers = currentPlayers.filter((p: StreamPlayer) => !p.disconnected);

				/** /
				console.log('currentPlayers:');
				console.log(currentPlayers);
				console.log('newPlayers:');
				console.log(newPlayers);
				console.log('connectedCurrentPlayers:');
				console.log(connectedCurrentPlayers);
				/**/

				if (typeof connectedCurrentPlayers !== 'undefined') {

					// check if there are less players than before
					if (connectedCurrentPlayers.length > newPlayers.length) {
						Object.entries(currentPlayers).forEach(([key, player]) => {
							if (!currentPlayers[parseInt(key)].disconnected) {
								// Search for the player who left, and set them disconnected
								currentPlayers[parseInt(key)].disconnected = (typeof newPlayers.find((p) => p.name === player.name) === 'undefined');
								if (currentPlayers[parseInt(key)].disconnected) {
									console.log('DISCONNECTED: ' + currentPlayers[parseInt(key)].name);
								}
							}
						});
					}

					// check if someone new connected
					if (connectedCurrentPlayers.length < newPlayers.length) {
						Object.entries(newPlayers).forEach(([key, player]) => {
							if (typeof currentPlayers.find((p) => p.name === player.name) === 'undefined') {

								if (typeof playerHistory === 'undefined') {
									setPlayerHistory([newPlayers[parseInt(key)]]);
								} else {
									if (typeof playerHistory.find((p) => p.name === player.name) === 'undefined') {
										console.log('CONNECTED: ' + newPlayers[parseInt(key)].name);
										playerHistory.push(newPlayers[parseInt(key)]);
										setPlayerHistory(playerHistory);
									} else {
										console.log('RECONNECTED: ' + newPlayers[parseInt(key)].name);
									}
								}

							}
						});
					}

				} else {

					// All players are disconnected, which shouldn't be possible as the host is still connected.
					console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
					console.log('+++ All players are disconnected, which shouldnt be possible as the host is still connected. +++');
					console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');

				}

				/*/ check if any details have changed
				Object.entries(currentPlayers).forEach(([key, player]) => {
					
					let p = newPlayers.find((p) => p.name === player.name);
					if(typeof p === 'undefined'){
						// player is not connected anymore
						currentPlayers[parseInt(key)].disconnected = true;
					} else {

						if(currentPlayers[parseInt(key)].colorId != p.colorId){
							console.log('COLOR CHANGE: ' + currentPlayers[parseInt(key)].name);
						}

						// update their credentials
						currentPlayers[parseInt(key)] = p;
					}


						// Search for the player who left, and set them disconnected
						
						if(currentPlayers[parseInt(key)].disconnected){
							console.log('DISCONNECTED: ' + currentPlayers[parseInt(key)].name);
						}
				});

				console.log(newPlayers.length);
				Object.entries(currentPlayers).forEach(([key, player]) => {
					
					console.log('<Game.tsx> this one:');
					console.log(player);

					console.log('<Game.tsx> found them:');
					console.log(newPlayers.find((p) => p.name === player.name));
					
					if (JSON.stringify(player) != JSON.stringify(newPlayers[parseInt(key)])) {
						console.log('<Game.tsx> this one');
						console.log(player);
						console.log(newPlayers[parseInt(key)]);
					}
				});
				/**/
			}

			// Set the newPlayers as currentPlayers for next iteration
			setCurrentPlayers(newPlayers);
		}

		return;
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
