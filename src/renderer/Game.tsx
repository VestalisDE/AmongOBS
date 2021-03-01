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
import { StreamPlayer, playerColors } from '../common/StreamingState';

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
	const [playerCameras, setPCS] = useState<Array<StreamPlayer>>();
	const [startTasks, setStartTasks] = useState(0);

	let showeveryone = true;
	let showCamForSeconds = 5;

	function setPlayerCameras(playerCameras: Array<StreamPlayer>){
		
		let index = 1;
		if(typeof myPlayer !== 'undefined'){
			ipcRenderer.invoke(IpcStreamingMessages.STREAM_CHANGE_PLAYERINFORMATION, 'COLOR', index, playerColors[myPlayer.colorId]).then(() => { }).catch((error: Error) => { });
			ipcRenderer.invoke(IpcStreamingMessages.STREAM_CHANGE_PLAYERINFORMATION, 'ISDEAD', index, gameState.gameState != GameState.LOBBY ? myPlayer.isDead : false).then(() => { }).catch((error: Error) => { });
			ipcRenderer.invoke(IpcStreamingMessages.STREAM_CHANGE_PLAYERINFORMATION, 'NAME', index, myPlayer.name).then(() => { }).catch((error: Error) => { });			
		}

		Object.entries(playerCameras).forEach(([key, player]) => {
			index = parseInt(key)+2;
			if(index <= 10){
				ipcRenderer.invoke(IpcStreamingMessages.STREAM_CHANGE_PLAYERINFORMATION, 'SHOW', index, true).then(() => { }).catch((error: Error) => { });
				ipcRenderer.invoke(IpcStreamingMessages.STREAM_CHANGE_PLAYERINFORMATION, 'ISDEAD', index, player.isDead).then(() => { }).catch((error: Error) => { });
				ipcRenderer.invoke(IpcStreamingMessages.STREAM_CHANGE_PLAYERINFORMATION, 'COLOR', index, playerColors[player.colorId]).then(() => { }).catch((error: Error) => { });
				ipcRenderer.invoke(IpcStreamingMessages.STREAM_CHANGE_PLAYERINFORMATION, 'NAME', index, player.name).then(() => { }).catch((error: Error) => { });
				ipcRenderer.invoke(IpcStreamingMessages.STREAM_CHANGE_PLAYERINFORMATION, 'VIDEO', index, 'https://obs.ninja/?view=KMYmcYf').then(() => { }).catch((error: Error) => { });
			}
		});
		index++;

		// Hide all the other cameras
		for(true; index <= 10; index++){
			ipcRenderer.invoke(IpcStreamingMessages.STREAM_CHANGE_PLAYERINFORMATION, 'SHOW', index, false).then(() => { }).catch((error: Error) => { });
		}
		setPCS(playerCameras);

	}

	// Set dead player data
	useEffect(() => {

		// @debug
		if(typeof myPlayer !== 'undefined'){console.log('The streamer is ' + myPlayer.name);}

		ipcRenderer.invoke(IpcStreamingMessages.STREAM_CHANGE_SCENE, gameState.gameState).then(() => { }).catch((error: Error) => { });
		switch (gameState.gameState) {
			case GameState.LOBBY:
				setOtherDead({});
				let pC = (typeof playerCameras !== 'undefined') ? playerCameras : [];
				pC = pC.map( item => {
					item.isDead = false;
					return item;
				});
				setPlayerCameras(pC);
				break;
			case GameState.TASKS:

				// Save the time, when entering tasks, to distinguish between kills and ejects
				let startTasks = new Date().getTime();
				setStartTasks(startTasks);

				if (typeof playerCameras !== 'undefined') {
					let pC = playerCameras;
					Object.entries(playerCameras).forEach(([key, player]) => {
						let p = allPlayers.find((p) => p.name === player.name);
						if (typeof p === 'undefined' && typeof myPlayer !== 'undefined' && player.name !== myPlayer.name){
							
							// @debug @todo hide the camera
							console.log(player.name + ' HIDE CAMERA');
							pC = pC.filter(obj => obj !== player);

						}
					});
					setPlayerCameras(pC);
				}

				if (!gameState.players) return;
				setOtherDead((old) => {
					for (const player of gameState.players) {
						old[player.id] = player.isDead || player.disconnected;
					}
					return { ...old };
				});
				break;
			case GameState.DISCUSSION:
				if (typeof allPlayers !== 'undefined') {
					let pC = (typeof playerCameras !== 'undefined') ? playerCameras : [];
					Object.entries(allPlayers).forEach(([key, player]) => {
						pC = pC.map( item => {
							item.isDead = item.name == player.name ? player.isDead : item.isDead;
							return item;
						 });
					});
					setPlayerCameras(pC);
				}
				break;
			case GameState.MENU:
			case GameState.UNKNOWN:
				setPlayerCameras([]);
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

		let pC = (typeof playerCameras !== 'undefined') ? playerCameras : [];
		if (pC.length < allPlayers.length) {
			Object.entries(allPlayers).forEach(([key, player]) => {
				if (typeof pC.find((p) => p.name === player.name) === 'undefined' && typeof myPlayer !== 'undefined' && player.name !== myPlayer.name && player.name != '') {

					pC.push({
						name: player.name,
						disconnected: false,
						colorId: player.colorId,
						isDead: player.isDead,
						isLocal: player.isLocal,
						isImpostor: player.isImpostor,
						camlink: '',
					});
					setPlayerCameras(pC);

				}
			});
		}

		return allPlayers;
	}, [gameState]);

	/**
	 * HERE IS THE NEW THING FOR HAVING ALL THE CAMERAS.
	 * 
	 * When in LOBBY: Add a camera box for every player.
	 * When entering the game: Remove all cameras for players who left.
	 * When in TASKS: Enable the killcam.
	 * 
	 * @todo Make this whole thing adjustable by parameters and a config file for video sources
	 * @todo Can we know if anyone changed their name?
	 */
	useEffect(() => {

		let newPlayers: Array<StreamPlayer> = [];
		let connectedCurrentPlayers: Array<StreamPlayer> = [];

		// All players who are in the same game now are added to newPlayers
		Object.entries(allPlayers).forEach(([key, player]) => {
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

			// If currentPlayers was set before, we need some validations befor setting it to newPlayers
			if (typeof currentPlayers !== 'undefined') {

				// Get all players from currentPlayers, who are still connected
				connectedCurrentPlayers = currentPlayers.filter((p: StreamPlayer) => !p.disconnected);


				if (typeof connectedCurrentPlayers === 'undefined') {

					// All players are disconnected, which shouldn't be possible as the host is still connected.
					console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
					console.log('+++ All players are disconnected, which shouldnt be possible as the host is still connected. +++');
					console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');

				} else {

					// check if there are less players than before
					if (connectedCurrentPlayers.length > newPlayers.length) {
						Object.entries(currentPlayers).forEach(([key, player]) => {
							if (!currentPlayers[parseInt(key)].disconnected) {
								// Search for the player who left, and set them disconnected
								currentPlayers[parseInt(key)].disconnected = (typeof newPlayers.find((p) => p.name === player.name) === 'undefined');
							}
						});
					}

					// check if someone new connected
					if (connectedCurrentPlayers.length < newPlayers.length) {
						Object.entries(newPlayers).forEach(([key, player]) => {
							// Only look for players, who arent registered yet.
							if (typeof currentPlayers.find((p) => p.name === player.name) === 'undefined') {

								let pH = (typeof playerHistory !== 'undefined') ? playerHistory : [];
								if (typeof pH.find((p) => p.name === player.name) === 'undefined' && player.name != '') {
									
									// This one has connected for the first time.
									pH.push(newPlayers[parseInt(key)]);
									setPlayerHistory(pH);

								}
								let pC = (typeof playerCameras !== 'undefined') ? playerCameras : [];
								if (typeof pC.find((p) => p.name === player.name) === 'undefined' && typeof myPlayer !== 'undefined' && player.name !== myPlayer.name && player.name != '') {

									pC.push(newPlayers[parseInt(key)]);
									setPlayerCameras(pC);
									// @debug @todo show the camera
									console.log(player.name + ' SHOW CAMERA');

								}

							}
						});
					}

					// check if any attribute has changed
					Object.entries(newPlayers).forEach(([key, player]) => {
						let p = connectedCurrentPlayers.find((p) => p.name === player.name);
						if(typeof p !== 'undefined'){
							
							// check if someone died while being at least 10s in Tasks, so we do not react to ejects. Also we check if the streamer is either dead or impostor
							if(newPlayers[parseInt(key)].isDead != p.isDead && (new Date().getTime() - startTasks) > 10000 && typeof myPlayer !== 'undefined' && (myPlayer.isImpostor || myPlayer.isDead)){
								
								// This one is the victim, fetch the object with coordinates for them
								let victim = allPlayers.find((victim) => victim.name === newPlayers[parseInt(key)].name);
								if(typeof victim !== 'undefined' && typeof myPlayer !== 'undefined'){

									let myDistance = Math.sqrt(Math.pow(myPlayer.x-victim?.x,2) + Math.pow(myPlayer.y-victim.y,2));
									if(myDistance < 3){

										// The streamer was nearby, we are going to show the cams of impostors and ghosts/players nearby but exclude the streamer
										Object.entries(allPlayers).forEach(([k2, p3]) => {
											if(typeof victim !== 'undefined' && p3.name !== myPlayer.name && (showeveryone || (p3.isImpostor || p3.isDead))){
												// Get the distance between player and victim
												let distance = Math.sqrt(Math.pow(p3.x-victim?.x,2) + Math.pow(p3.y-victim.y,2))
												if(distance < 1){

													// @debug @todo show the camera
													console.log(p3.name + ' SHOW CAMERA (KILL)');

													// Use activeCams to deactivate the interval after the first launch.
													let activeCams = Array();
													activeCams[p3.id] = setInterval((player: Player) => {
														// @debug @todo hide the camera
														console.log(player.name + ' HIDE CAMERA (KILL)');
														clearInterval(activeCams[player.id]);
													}, showCamForSeconds*1000, p3);

												}
											}
										});

									}
									
								}

							}

							// check if the color has changed
							if(newPlayers[parseInt(key)].colorId != p.colorId){
								let name = newPlayers[parseInt(key)].name;
								// This one has changed their color.
								let pC = (typeof playerCameras !== 'undefined') ? playerCameras : [];
								pC = pC.map( item => {
									item.colorId = item.name == name ? newPlayers[parseInt(key)].colorId : item.colorId;
									return item;
								 });
								setPlayerCameras(pC);
							}
						}
					});

				}
			} else {

				Object.entries(newPlayers).forEach(([key, player]) => {
					let pH = (typeof playerHistory !== 'undefined') ? playerHistory : [];
					if (typeof pH.find((p) => p.name === player.name) === 'undefined' && player.name != '') {

						// This one has connected for the first time.
						pH.push(newPlayers[parseInt(key)]);
						setPlayerHistory(pH);

					}
					let pC = (typeof playerCameras !== 'undefined') ? playerCameras : [];
					if (typeof pC.find((p) => p.name === player.name) === 'undefined' && typeof myPlayer !== 'undefined' && player.name !== myPlayer.name && player.name != '') {

						pC.push(newPlayers[parseInt(key)]);
						setPlayerCameras(pC);
						// @debug @todo show the camera
						console.log(player.name + ' SHOW CAMERA');

					}
				});

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