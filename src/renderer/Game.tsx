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
import {
	IpcStreamingMessages,
} from '../common/ipc-messages';

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
