import React, { useRef } from 'react';
import { Player } from '../common/AmongUsState';
import { backLayerHats, hatOffsets, hats, skins, players } from './cosmetics';
import makeStyles from '@material-ui/core/styles/makeStyles';

interface UseStylesParams {
	size: number;
	borderColor: string;
}
const useStyles = makeStyles(() => ({
	avatar: {
		borderRadius: '50%',
		overflow: 'hidden',
		position: 'relative',
		borderStyle: 'solid',
		transition: 'border-color .2s ease-out',
		borderColor: ({ borderColor }: UseStylesParams) => borderColor,
		borderWidth: ({ size }: UseStylesParams) => Math.max(2, size / 40),
		width: '100%',
		paddingBottom: '100%',
	},
	canvas: {
		position: 'absolute',
		width: '100%',
	},
	icon: {
		background: '#ea3c2a',
		position: 'absolute',
		left: '50%',
		top: '50%',
		transform: 'translate(-50%, -50%)',
		border: '2px solid #690a00',
		borderRadius: '50%',
		padding: 2,
		zIndex: 10,
	},
}));

export interface CanvasProps {
	src: string;
	hat: number;
	skin: number;
	isAlive: boolean;
	className: string;
}

export interface AvatarProps {
	isImpostor: boolean;
	isAlive: boolean;
	player: Player;
	size: number;
}

const Avatar: React.FC<AvatarProps> = function ({
	isImpostor,
	isAlive,
	player,
	size,
}: AvatarProps) {
	const status = isAlive ? 'alive' : 'dead';
	let image = players[status][player.colorId];
	if (!image) image = players[status][0];
	const classes = useStyles({
		borderColor: 'transparent',
		size,
	});

	let icon;

	return (
		<div>
			<div className={classes.avatar}>
				<Canvas
					className={classes.canvas}
					src={image}
					hat={player.hatId - 1}
					skin={player.skinId - 1}
					isAlive={isAlive}
				/>
				{icon}
			</div>
			{isImpostor ? 'IMPOSTOR' : player.name}
		</div>
	);
};

interface UseCanvasStylesParams {
	backLayerHat: boolean;
	isAlive: boolean;
}
const useCanvasStyles = makeStyles(() => ({
	base: {
		width: '100%',
		position: 'absolute',
		top: 0,
		left: 0,
		zIndex: 2,
	},
	hat: {
		position: 'absolute',
		left: '50%',
		transform: 'translateX(calc(-50% + 4px)) scale(0.7)',
		zIndex: ({ backLayerHat }: UseCanvasStylesParams) => (backLayerHat ? 1 : 4),
		display: ({ isAlive }: UseCanvasStylesParams) =>
			isAlive ? 'block' : 'none',
	},
	skin: {
		position: 'absolute',
		top: '38%',
		left: '17%',
		width: '73.5%',
		transform: 'scale(0.8)',
		zIndex: 3,
		display: ({ isAlive }: UseCanvasStylesParams) =>
			isAlive ? 'block' : 'none',
	},
}));

function Canvas({ src, hat, skin, isAlive }: CanvasProps) {
	const hatImg = useRef<HTMLImageElement>(null);
	const skinImg = useRef<HTMLImageElement>(null);
	const image = useRef<HTMLImageElement>(null);
	const hatY = 11 - hatOffsets[hat];
	const classes = useCanvasStyles({
		backLayerHat: backLayerHats.has(hat),
		isAlive,
	});

	return (
		<>
			<img src={src} ref={image} className={classes.base} />
			<img
				src={hats[hat]}
				ref={hatImg}
				className={classes.hat}
				style={{ top: `${hatY}%` }}
			/>
			<img src={skins[skin]} ref={skinImg} className={classes.skin} />
		</>
	);
}

export default Avatar;
