import React, { useContext, useEffect, useMemo, useState } from 'react';
import Avatar from './Avatar';
import { GameStateContext } from './contexts';
import { GameState, Player } from '../common/AmongUsState';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import makeStyles from '@material-ui/core/styles/makeStyles';
import SupportLink from './SupportLink';
import Divider from '@material-ui/core/Divider';

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
}));

const WebSocket = require('ws');
const SockJS = require('sockjs-client');

const obsType = 1;
let socket: WebSocket | SockJS | boolean = false;

/********** START OBS SOCKETS **********/
if (obsType == 1) {
	const socketURL = 'ws://localhost:4444';
	socket = new WebSocket(socketURL);

	socket.onopen = function (e) {
		console.log("[open] OBS Connection established");
		//	socket.send('{"request-type":"SetHeartbeat", "message-id":"1", "enable": false}');
		//	socket.send('{"request-type":"GetSceneList", "message-id":"2"}');
	};

	socket.onmessage = function (event) {
		console.log(`[message] Data received from server: ${event.data}`);
	};

	socket.onclose = function (event) {
		if (event.wasClean) {
			console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
		} else {
			// e.g. server process killed or network down
			// event.code is usually 1006 in this case
			console.log('[close] Connection died');
		}
	};

	socket.onerror = function (error) {
		console.log(`[error] ${error.message}`);
	};
}
/********** END OBS SOCKETS **********/

/********** START SLOBS SOCKETS **********/
if (obsType == 2) {
	const socketURL = 'http://localhost:59650/api';
	const token = '28ed47a66b0e1558bca562fb3b768c91fcba342';
	socket = new SockJS(socketURL);

	socket.onopen = () => {
		console.log("[open] SLOBS Connection established - requesting auth.");
		socket.send(JSON.stringify({
			jsonrpc: '2.0',
			id: 1,
			method: 'auth',
			params: {
				resource: 'TcpServerService',
				args: [token],
			},
		}));
	};
}
/********** END SLOBS SOCKETS **********/

const Game: React.FC<GameProps> = function ({
	error: initialError,
}: GameProps) {
	const [error] = useState(initialError);
	const gameState = useContext(GameStateContext);
	let { lobbyCode: displayedLobbyCode } = gameState;
	const [otherDead, setOtherDead] = useState<OtherDead>({});
	const classes = useStyles();

	// Set dead player data
	useEffect(() => {
		let sceneId = null;
		switch (gameState.gameState) {
			case GameState.LOBBY:
				switch (obsType) {
					case 1:
						sceneId = 'AmongUs_Lobby';
						break;
					case 2:
						sceneId = 'scene_9b3bc3d0-2401-48de-b20c-c0d15c726184';
						break;
				}
				setOtherDead({});
				break;
			case GameState.TASKS:
				switch (obsType) {
					case 1:
						sceneId = 'AmongUs_Tasks';
						break;
					case 2:
						sceneId = 'scene_5ad9a324-2aa7-48e8-a78e-1d0ae0bc16b2';
						break;
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
				switch (obsType) {
					case 1:
						sceneId = 'AmongUs_Discussion';
						break;
					case 2:
						sceneId = 'scene_5ad9a324-2aa7-48e8-a78e-1d0ae0bc16b2';
						break;
				}
				break;
			case GameState.MENU:
				switch (obsType) {
					case 1:
						sceneId = 'AmongUs_Lobby';
						break;
					case 2:
						sceneId = 'scene_9b3bc3d0-2401-48de-b20c-c0d15c726184';
						break;
				}
				break;
			case GameState.UNKNOWN:
			default:
				switch (obsType) {
					case 1:
						sceneId = 'AmongUs_Lobby';
						break;
					case 2:
						sceneId = 'scene_9b3bc3d0-2401-48de-b20c-c0d15c726184';
						break;
				}
		}

		let messageId = 999;
		if (sceneId !== null && socket !== false) {
			switch (obsType) {
				case 1:
					socket.send(JSON.stringify({ 'message-id': messageId, 'request-type': 'SetCurrentScene', 'scene-name': sceneId, }));
					break;
				case 2:
					socket.send(JSON.stringify({ id: messageId, jsonrpc: '2.0', method: 'makeSceneActive', params: { resource: 'ScenesService', args: [sceneId] }, }));
					break;
			}
		}
	}, [gameState.gameState]);

	const myPlayer = useMemo(() => {
		if (!gameState || !gameState.players) {
			return undefined;
		} else {
			return gameState.players.find((p) => p.isLocal);
		}
	}, [gameState.players]);

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
