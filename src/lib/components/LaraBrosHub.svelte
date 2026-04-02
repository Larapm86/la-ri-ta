<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// ═══ Center 500px = original hub (unscaled pixel art); wings only add margin ═══
	const HUB_CORE_W = 500;
	const WING_W = 400;
	const MAIN_BLOCK_X = WING_W;
	const W = HUB_CORE_W + WING_W * 2;
	const H = 620;
	const GROUND_Y = 528;
	const SIDEWALK_H = 40;
	const STREET_Y = GROUND_Y + SIDEWALK_H + 8;

	const FADE_SPEED = 0.03;
	const FONT_SIGN = '600 11px monospace';
	/** Rooftop sign centers: white label (#fff) on dark fills — contrast well above 4.5:1; blue / violet / teal for hue separation (incl. deuteranopia) */
	const SIGN_CENTER_WORK = '#1a3d6e';
	const SIGN_CENTER_ABOUT = '#4a2868';
	const SIGN_CENTER_HOLA = '#0d4a40';

	type ThemeKey = keyof typeof THEME.light;

	const THEME = {
		light: {
			sky1: '#62c8f0',
			sky2: '#90ddf8',
			cloud: '#ffffff',
			cloudShad: '#cce8f4',
			hasMoon: false,
			hasStars: false,
			beige: '#d2b08a',
			beigeDark: '#b8966e',
			beigeSill: '#c4a078',
			beigeWinFr: '#7a6a5a',
			beigeWin: '#9aacb0',
			brown: '#5a3828',
			brownDark: '#3e261a',
			brownWin: '#9ab0bc',
			brownWinFr: '#3c2416',
			brownCornice: '#3e261a',
			gray: '#aaaaaa',
			grayDark: '#888888',
			grayWin: '#9ab4c0',
			grayWinFr: '#6a7a80',
			grayBal: '#707070',
			grayRail: '#606060',
			winGlow: null as boolean | null,
			beigeLitWin: '#9aacb0',
			brownLitWin: '#9ab0bc',
			grayLitWin: '#9ab4c0',
			sidewalk: '#828282',
			sidewalkL: '#6e6e6e',
			curb: '#585858',
			street: '#484848',
			streetLine: '#3a3a3a',
			shopDark: '#282828',
			shopGlass: '#607080',
			shopGlass2: '#506070',
			awningR: '#c42222',
			awningW: '#eeeeee',
			redDoor: '#c42222',
			redDoorHi: '#e04040',
			goldDoor: '#c07e18',
			goldDoorHi: '#e8a030',
			knob: '#ffee88',
			knobDk: '#aa8800',
			treeHi: '#5cb840',
			treeMid: '#46a030',
			treeDark: '#328020',
			trunk: '#7a5028',
			trunkDk: '#5a3818',
			parkLawn: '#42a050',
			parkLawnHi: '#58c068',
			parkLawnDk: '#2a7038',
			skin: '#d4905a',
			shirt: '#c43a3a',
			pants: '#334455',
			bodyBg: '#c8d8e8'
		},
		dark: {
			sky1: '#060614',
			sky2: '#0c1228',
			cloud: '#1e2440',
			cloudShad: '#141830',
			hasMoon: true,
			hasStars: true,
			beige: '#6a5840',
			beigeDark: '#4e4030',
			beigeSill: '#5a4c38',
			beigeWinFr: '#3a3028',
			beigeWin: '#1a2028',
			brown: '#2e1c10',
			brownDark: '#1e100a',
			brownWin: '#1a2430',
			brownWinFr: '#1c0e08',
			brownCornice: '#1a0c06',
			gray: '#404858',
			grayDark: '#303848',
			grayWin: '#1a2430',
			grayWinFr: '#303848',
			grayBal: '#383848',
			grayRail: '#2c2c3c',
			winGlow: true,
			beigeLitWin: '#e8c870',
			brownLitWin: '#ddb850',
			grayLitWin: '#c8a840',
			sidewalk: '#303030',
			sidewalkL: '#262626',
			curb: '#202020',
			street: '#181818',
			streetLine: '#101010',
			shopDark: '#101010',
			shopGlass: '#1a2830',
			shopGlass2: '#182028',
			awningR: '#801414',
			awningW: '#888888',
			redDoor: '#801414',
			redDoorHi: '#a02020',
			goldDoor: '#805010',
			goldDoorHi: '#a06820',
			knob: '#c09830',
			knobDk: '#604800',
			treeHi: '#1c4010',
			treeMid: '#143008',
			treeDark: '#0c2004',
			trunk: '#3c2810',
			trunkDk: '#281808',
			parkLawn: '#0c1c10',
			parkLawnHi: '#142818',
			parkLawnDk: '#081008',
			skin: '#c07840',
			shirt: '#802828',
			pants: '#1c2030',
			bodyBg: '#0a0a1a'
		}
	} as const;

	let C: Record<string, string | boolean | null> = { ...THEME.light };
	let themeT = 0;
	let isDark = $state(false);
	/** Matches CSS portrait gate: narrow viewport + portrait — game UI hidden until landscape */
	let portraitGateActive = $state(
		typeof globalThis !== 'undefined' &&
			typeof matchMedia !== 'undefined' &&
			matchMedia('(max-width: 768px) and (orientation: portrait)').matches
	);

	let canvas: HTMLCanvasElement | undefined = $state();
	let ctxRef: CanvasRenderingContext2D | null = null;
	let frame = 0;
	let raf = 0;

	const WALK_Y = GROUND_Y + 8;
	/** Hip/seat contact — matches `drawParkBench`: seatTop = GROUND_Y−24, slat mid ≈ GROUND_Y−19 */
	const BENCH_SEAT_HIP_Y = GROUND_Y - 19;
	const MOVE_SPEED = 3.2;
	const DOG_OFFSET = 20;
	const X_MIN = 36;
	const X_MAX = W - 36;
	/** East (right) wing park — lawn path (hub wing starts at `W - WING_W`) */
	const RIGHT_PARK_LEFT = W - WING_W + 22;
	const RIGHT_PARK_RIGHT = W - 44;
	/** Past hub façade / gate strip — Ball & fetch use `center > this` (no fragile edge-crossing) */
	const RIGHT_PARK_GATE_LINE = W - WING_W + 40;
	/** Woman sprite ~14px wide; door overlap uses approximate center x = womanX + 7 */
	const DOOR_ZONES: [number, number][] = [
		[MAIN_BLOCK_X + 88, MAIN_BLOCK_X + 155],
		[MAIN_BLOCK_X + 210, MAIN_BLOCK_X + 290],
		[MAIN_BLOCK_X + 350, MAIN_BLOCK_X + 425]
	];

	let womanX = $state(Math.round((HUB_CORE_W + WING_W * 2) / 2));
	/** Plain object so RAF/tick always reads current facing (not Svelte $state snapshot). */
	/** Woman / dog (foot) — updated while walking or on bench, not while riding */
	const walkFacing = { right: true };
	/** Parked + ridden bike mirror — updated only while `mode === 'bike'` */
	const bikeFacing = { right: true };
	const keysHeld = { left: false, right: false };

	/** Player phase after intro: walk, seated on bench, or on parked bike */
	const playerActivity = { mode: 'walk' as 'walk' | 'bench' | 'bike' };

	const BENCH_LOCAL_X = 154;
	const BENCH_W = 92;
	const BENCH_PAD = 22;
	const BIKE_INTERACT_R = 52;

	/** Idle bark burst (player phase only); plain object for RAF */
	const dogBark = { until: 0, nextAt: 0 };

	/** Ball fetch: throw → dog chases → returns (plain object for RAF) */
	type FetchPhase = 'idle' | 'ball' | 'to_ball' | 'back';
	const fetchGame = {
		phase: 'idle' as FetchPhase,
		frame: 0,
		startX: 0,
		landX: 0,
		groundY: WALK_Y,
		ballX: 0,
		ballY: 0,
		dogX: 0,
		dogFaceRight: true
	};

	function updateDogIdleBark() {
		if (!introDone) {
			dogBark.until = 0;
			return;
		}
		if (fetchInProgress()) {
			dogBark.until = 0;
			return;
		}
		const moving =
			playerActivity.mode === 'walk' && (keysHeld.left || keysHeld.right);
		if (moving) {
			dogBark.until = 0;
			if (dogBark.nextAt < frame) dogBark.nextAt = frame + 120;
			return;
		}
		if (frame < dogBark.until) return;
		if (dogBark.nextAt === 0) dogBark.nextAt = frame + 90 + Math.floor(Math.random() * 90);
		if (frame >= dogBark.nextAt) {
			if (Math.random() < 0.55) dogBark.until = frame + 22;
			dogBark.nextAt = frame + 160 + Math.floor(Math.random() * 260);
		}
	}

	const FETCH_BALL_FRAMES = 26;
	const FETCH_DOG_SPEED = 5.2;

	function updateFetchGame() {
		if (!introDone) return;
		if (playerActivity.mode !== 'walk') {
			if (fetchGame.phase !== 'idle') {
				fetchGame.phase = 'idle';
				fetchGame.frame = 0;
			}
			return;
		}
		const fg = fetchGame;
		switch (fg.phase) {
			case 'idle':
				return;
			case 'ball': {
				fg.frame++;
				const t = Math.min(1, fg.frame / FETCH_BALL_FRAMES);
				fg.ballX = fg.startX + (fg.landX - fg.startX) * t;
				const arc = Math.sin(t * Math.PI) * 26;
				fg.ballY = fg.groundY - 5 - arc;
				if (t >= 1) {
					fg.phase = 'to_ball';
					fg.frame = 0;
					fg.ballX = fg.landX;
					fg.ballY = fg.groundY - 3;
					const fr = playerFacingRight();
					fg.dogX = fr
						? Math.round(womanX + DOG_OFFSET)
						: Math.max(4, Math.round(womanX - 38));
					fg.dogFaceRight = fg.landX > fg.dogX;
				}
				break;
			}
			case 'to_ball': {
				const target = fg.landX;
				const dx = target - fg.dogX;
				if (Math.abs(dx) < 4) {
					fg.phase = 'back';
					fg.frame = 0;
					{
						const pfr = playerFacingRight();
						const targetDogX = pfr
							? Math.round(womanX + DOG_OFFSET)
							: Math.max(4, Math.round(womanX - 38));
						const dxBack = targetDogX - fg.dogX;
						fg.dogFaceRight = dxBack > 0;
					}
					break;
				}
				const step = Math.sign(dx) * Math.min(FETCH_DOG_SPEED, Math.abs(dx));
				fg.dogX += step;
				fg.dogFaceRight = dx > 0;
				break;
			}
			case 'back': {
				const fr = playerFacingRight();
				const targetDogX = fr
					? Math.round(womanX + DOG_OFFSET)
					: Math.max(4, Math.round(womanX - 38));
				const dx = targetDogX - fg.dogX;
				if (Math.abs(dx) < 5) {
					fg.phase = 'idle';
					fg.frame = 0;
					break;
				}
				const step = Math.sign(dx) * Math.min(FETCH_DOG_SPEED, Math.abs(dx));
				fg.dogX += step;
				fg.dogFaceRight = dx > 0;
				break;
			}
		}
	}

	function tryThrowBall() {
		if (!introDone || playerActivity.mode !== 'walk') return;
		if (fetchGame.phase !== 'idle') return;
		const faceR = playerFacingRight();
		const cx = womanCenterX();
		let landX: number;
		if (faceR) {
			landX = cx + 110 + Math.floor(Math.random() * 56);
		} else {
			landX = cx - 110 - Math.floor(Math.random() * 56);
		}
		landX = Math.max(X_MIN + 8, Math.min(X_MAX - 8, landX));
		fetchGame.phase = 'ball';
		fetchGame.frame = 0;
		fetchGame.landX = landX;
		fetchGame.groundY = WALK_Y;
		fetchGame.startX = faceR ? womanX + 16 : womanX - 2;
		fetchGame.ballX = fetchGame.startX;
		fetchGame.ballY = WALK_Y - 12;
	}

	/** Touch/pen: rely on pointerdown + preventDefault — synthetic `click` is often lost on mobile. */
	function onBallPointerDown(e: PointerEvent) {
		if (e.pointerType === 'mouse') return;
		e.preventDefault();
		tryThrowBall();
	}

	function womanCenterX(): number {
		return womanX + 7;
	}

	function houseAtWoman(): number | null {
		if (playerActivity.mode === 'bike') return null;
		const cx = womanCenterX();
		for (let i = 0; i < DOOR_ZONES.length; i++) {
			const [a, b] = DOOR_ZONES[i];
			if (cx >= a && cx <= b) return i;
		}
		return null;
	}

	function womanNearBench(): boolean {
		/** Bench only on the left park — right wing is entrance, no seat */
		const c = womanCenterX();
		const wingLeft = 0;
		const L = wingLeft + BENCH_LOCAL_X;
		const R = L + BENCH_W;
		return c >= L - BENCH_PAD && c <= R + BENCH_PAD;
	}

	function womanNearBike(): boolean {
		return Math.abs(womanCenterX() - parkedBikeX) < BIKE_INTERACT_R;
	}

	function womanInRightPark(): boolean {
		if (playerActivity.mode !== 'walk') return false;
		const c = womanCenterX();
		return c >= RIGHT_PARK_LEFT && c <= RIGHT_PARK_RIGHT;
	}

	/** Past the east entrance into the wing; purely positional (no one-frame crossing bugs) */
	function canUseBallInEastPark(): boolean {
		if (playerActivity.mode !== 'walk') return false;
		const c = womanCenterX();
		return c > RIGHT_PARK_GATE_LINE && c >= RIGHT_PARK_LEFT && c <= RIGHT_PARK_RIGHT;
	}

	function fetchInProgress(): boolean {
		return fetchGame.phase !== 'idle';
	}

	const STARS = Array.from({ length: 60 }, () => ({
		x: Math.random() * W,
		y: Math.random() * (GROUND_Y - 140),
		size: Math.random() < 0.25 ? 2 : 1,
		twinkle: Math.random() * Math.PI * 2,
		/** Rad/frame — slow, slightly desynced twinkle */
		speed: 0.01 + Math.random() * 0.016
	}));

	const CLOUDS = [
		{ baseX: 20, y: 55, scale: 0.9, speed: 0.25 },
		{ baseX: 210, y: 80, scale: 0.7, speed: 0.18 },
		{ baseX: 350, y: 38, scale: 1.0, speed: 0.32 },
		{ baseX: -80, y: 100, scale: 0.6, speed: 0.22 }
	];

	const PARKED_BIKE_X = W / 2;
	const PARKED_BIKE_Y = STREET_Y;
	/** Bike center when not riding — set on dismount so it stays where dropped */
	let parkedBikeX = $state(Math.round(PARKED_BIKE_X));

	type IntroState =
		| 'moving_left'
		| 'stopping'
		| 'dismounting'
		| 'walking_to_sidewalk'
		| 'walking_sidewalk'
		| 'stopped_sidewalk';

	const scene = {
		state: 'moving_left' as IntroState,
		timer: 0,
		bikeX: W + 90,
		bikeY: STREET_Y,
		wheelAngle: 0,
		womanOnBike: true,
		womanX: 0,
		womanY: 0,
		dogX: 0,
		dogY: 0
	};

	/** After intro, player controls movement */
	let introDone = $state(false);

	function resetIntroScene() {
		introDone = false;
		walkFacing.right = true;
		bikeFacing.right = true;
		dogBark.until = 0;
		dogBark.nextAt = 0;
		fetchGame.phase = 'idle';
		fetchGame.frame = 0;
		scene.state = 'moving_left';
		scene.timer = 0;
		scene.bikeX = W + 90;
		scene.bikeY = STREET_Y;
		scene.wheelAngle = 0;
		scene.womanOnBike = true;
		keysHeld.left = false;
		keysHeld.right = false;
	}

	function updateIntroScene() {
		switch (scene.state) {
			case 'moving_left':
				scene.bikeX -= 1.4;
				scene.wheelAngle -= 0.13;
				if (scene.bikeX <= W / 2) {
					scene.bikeX = W / 2;
					scene.state = 'stopping';
					scene.timer = 0;
				}
				break;
			case 'stopping':
				scene.timer++;
				if (scene.timer > 50) {
					scene.womanOnBike = false;
					scene.womanX = scene.bikeX - 18;
					scene.womanY = scene.bikeY;
					scene.dogX = scene.womanX + 20;
					scene.dogY = scene.womanY;
					scene.state = 'dismounting';
					scene.timer = 0;
				}
				break;
			case 'dismounting':
				scene.womanX -= 0.3;
				scene.dogX = scene.womanX + 20;
				scene.timer++;
				if (scene.timer > 50) {
					scene.state = 'walking_to_sidewalk';
					scene.timer = 0;
				}
				break;
			case 'walking_to_sidewalk': {
				const targetY = GROUND_Y + 8;
				scene.womanX -= 0.7;
				scene.womanY -= 1.1;
				scene.dogX = scene.womanX + 20;
				scene.dogY = scene.womanY;
				if (scene.womanY <= targetY) {
					scene.womanY = targetY;
					scene.dogY = targetY;
					scene.state = 'walking_sidewalk';
					scene.timer = 0;
				}
				break;
			}
			case 'walking_sidewalk':
				scene.womanX -= 1.2;
				scene.dogX = scene.womanX + 20;
				scene.timer++;
				if (scene.timer > 45) {
					scene.state = 'stopped_sidewalk';
					scene.timer = 0;
				}
				break;
			case 'stopped_sidewalk':
				scene.timer++;
				if (scene.timer > 50) {
					womanX = scene.womanX;
					parkedBikeX = Math.round(PARKED_BIKE_X);
					walkFacing.right = false;
					bikeFacing.right = false;
					keysHeld.left = false;
					keysHeld.right = false;
					introDone = true;
				}
				break;
		}
	}

	function lerpColor(a: string, b: string, t: number): string {
		const ah = a.replace('#', '');
		const bh = b.replace('#', '');
		const ar = parseInt(ah.slice(0, 2), 16);
		const ag = parseInt(ah.slice(2, 4), 16);
		const ab = parseInt(ah.slice(4, 6), 16);
		const br = parseInt(bh.slice(0, 2), 16);
		const bg = parseInt(bh.slice(2, 4), 16);
		const bb = parseInt(bh.slice(4, 6), 16);
		const rr = Math.round(ar + (br - ar) * t);
		const rg = Math.round(ag + (bg - ag) * t);
		const rb = Math.round(ab + (bb - ab) * t);
		return (
			'#' +
			[rr, rg, rb]
				.map((v) => v.toString(16).padStart(2, '0'))
				.join('')
		);
	}

	function blendPalette(t: number) {
		const L = THEME.light;
		const D = THEME.dark;
		const keys = Object.keys(L) as ThemeKey[];
		for (const k of keys) {
			const lv = L[k];
			const dv = D[k];
			if (typeof lv === 'string' && lv.startsWith('#')) {
				C[k] = lerpColor(lv, dv as string, t);
			} else {
				C[k] = t > 0.5 ? dv : lv;
			}
		}
	}

	function r(cx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) {
		cx.fillStyle = col;
		cx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
	}

	function windowOn(seed: number, fr: number) {
		const interval = 3600 + ((seed * 73) % 1200);
		const tick = Math.floor((fr + seed * 31) / interval);
		const h = Math.imul(tick ^ seed, 0x9e3779b9) >>> 0;
		return (h % 100) > 28;
	}

	function drawStars(cx: CanvasRenderingContext2D, fr: number, alpha: number) {
		if (alpha <= 0) return;
		for (const s of STARS) {
			const pulse = 0.5 + 0.5 * Math.sin(fr * s.speed + s.twinkle);
			/** Subtle shimmer — small opacity swing, long slow cycle */
			const a = alpha * (0.78 + 0.22 * pulse);
			cx.fillStyle = `rgba(255,255,220,${a})`;
			cx.fillRect(Math.round(s.x), Math.round(s.y), s.size, s.size);
		}
	}

	function drawMoon(cx: CanvasRenderingContext2D, alpha: number) {
		if (alpha <= 0) return;
		const mx = W - 95;
		cx.save();
		cx.globalAlpha = alpha;
		cx.fillStyle = '#e8e0b0';
		cx.beginPath();
		cx.arc(mx, 72, 22, 0, Math.PI * 2);
		cx.fill();
		cx.fillStyle = C.sky1 as string;
		cx.beginPath();
		cx.arc(mx + 10, 66, 18, 0, Math.PI * 2);
		cx.fill();
		cx.restore();
	}

	function drawStreetLights(cx: CanvasRenderingContext2D, alpha: number) {
		const a = Math.max(0, Math.min(1, alpha));
		/** Lamps on each park wing (not beside benches) + three over hub façades — always drawn; lit only when `a` > 0 */
		for (const lx of [
			88,
			MAIN_BLOCK_X - 36,
			MAIN_BLOCK_X + 95,
			MAIN_BLOCK_X + 285,
			MAIN_BLOCK_X + 455,
			/** Skip HUB_CORE_W+36 — overlapped the right-park gate; entrance drawn on top separately */
			MAIN_BLOCK_X + HUB_CORE_W + 300
		]) {
			const footY = GROUND_Y;
			r(cx, lx - 2, footY - 62, 4, 62, '#3a3a3c');
			r(cx, lx - 14, footY - 60, 16, 3, '#505050');
			r(cx, lx - 18, footY - 66, 14, 8, '#3c3c3e');
			cx.fillStyle =
				a > 0.04
					? `rgba(255,230,120,${0.2 + 0.75 * a})`
					: 'rgba(75,72,68,0.92)';
			cx.fillRect(lx - 16, footY - 64, 10, 4);
			if (a > 0.04) {
				const grad = cx.createRadialGradient(lx - 11, footY - 60, 2, lx - 11, footY - 32, 50);
				grad.addColorStop(0, `rgba(255,220,80,${a * 0.18})`);
				grad.addColorStop(1, 'rgba(255,220,80,0)');
				cx.fillStyle = grad;
				cx.beginPath();
				cx.ellipse(lx - 11, footY - 22, 40, 50, 0, 0, Math.PI * 2);
				cx.fill();
			}
			r(cx, lx - 12, footY, 24, 4, '#3a3a3a');
			r(cx, lx - 10, footY + 1, 20, 2, '#2a2a2c');
		}
	}

	function drawSky(cx: CanvasRenderingContext2D) {
		const g = cx.createLinearGradient(0, 0, 0, GROUND_Y);
		g.addColorStop(0, C.sky1 as string);
		g.addColorStop(1, C.sky2 as string);
		cx.fillStyle = g;
		cx.fillRect(0, 0, W, H);
	}

	function drawOneCloud(
		cx: CanvasRenderingContext2D,
		cxo: number,
		cy: number,
		scale: number,
		bob: number
	) {
		const s = scale;
		cy += bob;
		r(cx, cxo + 18 * s, cy + 18 * s, 64 * s, 20 * s, C.cloud as string);
		r(cx, cxo + 8 * s, cy + 10 * s, 84 * s, 28 * s, C.cloud as string);
		r(cx, cxo, cy + 18 * s, 100 * s, 24 * s, C.cloud as string);
		r(cx, cxo + 26 * s, cy + 2 * s, 50 * s, 22 * s, C.cloud as string);
		r(cx, cxo + 38 * s, cy - 8 * s, 28 * s, 18 * s, C.cloud as string);
		r(cx, cxo + 8 * s, cy + 34 * s, 84 * s, 8 * s, C.cloudShad as string);
		r(cx, cxo, cy + 38 * s, 100 * s, 4 * s, C.cloudShad as string);
	}

	function drawClouds(cx: CanvasRenderingContext2D, fr: number) {
		for (const cl of CLOUDS) {
			const ox = (cl.baseX + fr * cl.speed) % (W + 110);
			const bob = Math.sin(fr * 0.018 + cl.baseX) * 2.5;
			const x = ox < -100 ? ox + W + 110 : ox;
			drawOneCloud(cx, x, cl.y, cl.scale, bob);
		}
	}

	function drawPerson(cx: CanvasRenderingContext2D, px: number, py: number) {
		r(cx, px + 5, py, 8, 8, C.skin as string);
		r(cx, px + 3, py + 8, 12, 14, C.shirt as string);
		r(cx, px, py + 8, 4, 10, C.skin as string);
		r(cx, px + 14, py + 8, 4, 10, C.skin as string);
		r(cx, px + 4, py + 22, 5, 10, C.pants as string);
		r(cx, px + 9, py + 22, 5, 10, C.pants as string);
	}

	/** Taller canopy for the left-wing park only (reads at scale vs a huge sky). */
	function drawParkTreeLarge(cx: CanvasRenderingContext2D, tcx: number, groundY: number) {
		const tw = 78;
		const th = 72;
		const trW = 16;
		const trH = 38;
		r(cx, tcx - trW / 2, groundY - trH, trW, trH, C.trunk as string);
		r(cx, tcx - trW / 2, groundY - trH, 5, trH, C.trunkDk as string);
		const fy = groundY - trH - th;
		r(cx, tcx - tw / 2 + 12, fy + 14, tw - 24, th - 14, C.treeMid as string);
		r(cx, tcx - tw / 2 + 6, fy + 22, tw - 12, th - 22, C.treeMid as string);
		r(cx, tcx - tw / 2, fy + 28, tw, th - 28, C.treeMid as string);
		r(cx, tcx - tw / 2 + 18, fy + 2, tw - 36, th - 2, C.treeHi as string);
		r(cx, tcx - tw / 2 + 10, fy + 10, tw - 20, th - 10, C.treeHi as string);
		r(cx, tcx - tw / 2 + 4, fy + 20, tw - 8, th - 20, C.treeHi as string);
		r(cx, tcx - tw / 2, fy + 28, tw, th - 28, C.treeHi as string);
		r(cx, tcx - tw / 2 + 24, fy - 8, tw - 48, 18, C.treeHi as string);
		r(cx, tcx + tw / 2 - 20, fy + 10, 16, th - 10, C.treeDark as string);
		r(cx, tcx + tw / 2 - 14, fy + 22, 12, th - 22, C.treeDark as string);
		r(cx, tcx - tw / 2 + 4, fy + th - 12, tw - 8, 12, C.treeDark as string);
	}

	/** Slatted wood + metal legs, soft shadow — faces the viewer */
	function drawParkBench(cx: CanvasRenderingContext2D, benchLeft: number, groundY: number, shadowCol: string) {
		const wood = C.trunk as string;
		const woodDk = C.trunkDk as string;
		const iron = '#504840';
		const bw = 92;
		const backTop = groundY - 44;
		const backH = 22;
		const seatTop = backTop + backH - 2;
		const seatH = 12;
		const legTop = seatTop + seatH;

		r(cx, benchLeft - 2, groundY - 3, bw + 6, 5, shadowCol);

		r(cx, benchLeft + 4, backTop, bw - 8, backH, woodDk);
		for (let i = 0; i < 5; i++) {
			r(cx, benchLeft + 6, backTop + 3 + i * 4, bw - 12, 2, wood);
		}
		r(cx, benchLeft + 3, backTop - 2, 4, backH + 2, woodDk);
		r(cx, benchLeft + bw - 7, backTop - 2, 4, backH + 2, woodDk);

		for (let s = 0; s < 4; s++) {
			r(cx, benchLeft + 5, seatTop + s * 3, bw - 10, 2, s % 2 === 0 ? wood : woodDk);
		}

		r(cx, benchLeft + 2, legTop - 1, bw - 4, 3, woodDk);

		const legW = 6;
		r(cx, benchLeft + 12, legTop, legW, groundY - legTop, iron);
		r(cx, benchLeft + bw - 18, legTop, legW, groundY - legTop, iron);
		r(cx, benchLeft + Math.floor(bw / 2) - 5, legTop, legW, groundY - legTop - 1, iron);
		r(cx, benchLeft + 11, groundY - 3, 10, 3, iron);
		r(cx, benchLeft + bw - 21, groundY - 3, 10, 3, iron);
		r(cx, benchLeft + Math.floor(bw / 2) - 7, groundY - 3, 12, 3, iron);
	}

	/**
	 * Wing margin park — same layout for left (`wingLeftX = 0`) and right (`wingLeftX = W - WING_W`).
	 * Shrubs sit on the edge facing the hub.
	 */
	function drawParkWing(cx: CanvasRenderingContext2D, wingLeftX: number) {
		const BX = wingLeftX;
		const BW = WING_W;
		const grassTop = 486;
		const gh = GROUND_Y - grassTop;
		const gBase = C.parkLawn as string;
		const gHi = C.parkLawnHi as string;
		const gDk = C.parkLawnDk as string;
		const pathCol = C.sidewalkL as string;
		const hubOnRight = BX === 0;

		r(cx, BX, grassTop, BW, gh, gBase);
		r(cx, BX, GROUND_Y - 18, BW, 18, gHi);
		/** East wing: hub-side strip — no lighter band / speckle line through the gate (reads as one lawn into path) */
		if (!hubOnRight) {
			r(cx, BX, GROUND_Y - 18, 108, 18, gBase);
		}
		for (let x = BX; x < BX + BW; x += 6) {
			if (!hubOnRight && x < BX + 108) continue;
			r(cx, x + (Math.floor(x / 6) % 4), GROUND_Y - 4, 4, 2, gDk);
		}

		r(cx, BX, grassTop, BW, 1, gDk);

		for (let i = 0; i < 18; i++) {
			const px = BX + ((i * 71) % (BW - 6));
			const py = grassTop + 6 + ((i * 41) % Math.max(8, gh - 20));
			r(cx, px, py, 4, 2, gHi);
		}

		const pathY = GROUND_Y - 12;
		r(cx, BX + 14, pathY, 100, 8, pathCol);
		r(cx, BX + 108, pathY - 1, 108, 8, pathCol);
		r(cx, BX + 208, pathY, 92, 8, pathCol);
		r(cx, BX + 294, pathY - 1, 88, 8, pathCol);

		if (hubOnRight) {
			drawParkBench(cx, BX + 154, GROUND_Y, gDk);
		}

		/** Right wing: trees shifted east so hub-side entrance stays clear (was hidden under left tree) */
		if (hubOnRight) {
			drawParkTreeLarge(cx, BX + 78, GROUND_Y);
			drawParkTreeLarge(cx, BX + 298, GROUND_Y);
		} else {
			drawParkTreeLarge(cx, BX + 248, GROUND_Y);
			drawParkTreeLarge(cx, BX + 338, GROUND_Y);
		}

		if (hubOnRight) {
			for (let hx = BX + BW - 32; hx < BX + BW - 6; hx += 12) {
				r(cx, hx, GROUND_Y - 36, 10, 10, gDk);
				r(cx, hx + 1, GROUND_Y - 40, 8, 5, gHi);
			}
		}

		for (const [lx, dy] of [
			[28, 18],
			[140, 16],
			[248, 20],
			[352, 17]
		]) {
			const fy = GROUND_Y - dy;
			r(cx, BX + lx, fy, 3, 3, '#e05078');
			r(cx, BX + lx + 4, fy + 1, 2, 2, '#ffd858');
		}
	}

	/**
	 * East-park gate: drawn **after** path tiles so it sits **in front of** the pathwalk;
	 * geometry **straddles** the horizontal path band (hub / lawn side → across the path).
	 */
	function drawRightParkEntrance(cx: CanvasRenderingContext2D) {
		const BX = W - WING_W;
		const pathTop = GROUND_Y - 12;
		const gDk = C.parkLawnDk as string;
		const gHi = C.parkLawnHi as string;
		const post = '#4a4238';
		const lintel = '#5c5448';
		const pave = C.sidewalk as string;
		const paveEdge = C.curb as string;
		const pw = 46;
		const px = BX + 17;
		for (const hx of [BX + 4, BX + 66]) {
			r(cx, hx, pathTop - 6, 10, 8, gDk);
			r(cx, hx + 1, pathTop - 10, 8, 5, gHi);
		}
		/** Walk crosses the path strip (y pathTop … pathTop+pathH) so the gate reads ahead of the cross path */
		const walkY = pathTop - 5;
		const walkH = GROUND_Y - walkY;
		r(cx, px - 1, walkY, pw + 2, walkH, paveEdge);
		r(cx, px, walkY + 1, pw, walkH - 2, pave);
		r(cx, px + 3, pathTop - 22, 5, 30, post);
		r(cx, px + pw - 8, pathTop - 22, 5, 30, post);
		r(cx, px + 2, pathTop - 28, pw - 4, 6, lintel);
	}

	function drawLeftBuilding(cx: CanvasRenderingContext2D, fr: number) {
		const BX = MAIN_BLOCK_X + 0;
		const BY = 188;
		const BW = 175;
		r(cx, BX, BY, BW, GROUND_Y - BY, C.beige as string);
		r(cx, BX, BY, BW, 10, C.beigeDark as string);
		r(cx, BX, BY - 4, BW, 8, C.beigeSill as string);

		const WW = 44;
		const WH = 38;
		const COL_X = [BX + 22, BX + 106];
		const ROW_Y = [BY + 22, BY + 84, BY + 146, BY + 208];

		ROW_Y.forEach((wy, ri) => {
			COL_X.forEach((wx, ci) => {
				const lit = !!C.winGlow && windowOn(ri * 10 + ci, fr);
				const glass = lit ? (C.beigeLitWin as string) : (C.beigeWin as string);
				if (lit) {
					const g = cx.createRadialGradient(wx + WW / 2, wy + WH / 2, 2, wx + WW / 2, wy + WH / 2, WW);
					g.addColorStop(0, 'rgba(255,200,80,0.18)');
					g.addColorStop(1, 'rgba(255,200,80,0)');
					cx.fillStyle = g;
					cx.fillRect(wx - WW / 2, wy - WH / 2, WW * 2, WH * 2);
				}
				r(cx, wx, wy, WW, WH, C.beigeWinFr as string);
				r(cx, wx + 3, wy + 3, WW - 6, WH - 6, glass);
				r(cx, wx + 3, wy + WH / 2 - 1, WW - 6, 2, C.beigeWinFr as string);
				r(cx, wx + WW / 2 - 1, wy + 3, 2, WH - 6, C.beigeWinFr as string);
				r(cx, wx - 2, wy + WH, WW + 4, 5, C.beigeSill as string);
			});
		});

		const SF_Y = GROUND_Y - 64;
		r(cx, BX, SF_Y, BW, 64, C.beigeDark as string);
		r(cx, BX + 6, SF_Y + 6, 74, 52, C.shopDark as string);
		r(cx, BX + 10, SF_Y + 10, 66, 44, C.shopGlass as string);
		drawPerson(cx, BX + 26, SF_Y + 14);
		r(cx, BX + 100, SF_Y + 6, 42, 58, C.shopDark as string);
		r(cx, BX + 104, SF_Y + 10, 34, 54, '#8a6848');
		r(cx, BX + 118, SF_Y + 36, 6, 4, C.knob as string);
		drawRoofSign(cx, BX + BW / 2, BY, ['WORK'], SIGN_CENTER_WORK);
	}

	function drawAwning(cx: CanvasRenderingContext2D, ax: number, ay: number, aw: number, ah: number) {
		r(cx, ax, ay, aw, ah, C.awningR as string);
		const stripe = 10;
		for (let i = 0; i * stripe < aw; i++) {
			if (i % 2 === 0) r(cx, ax + i * stripe, ay, Math.min(stripe, aw - i * stripe), ah, C.awningW as string);
		}
		for (let i = 2; i + 6 < aw; i += 9) {
			r(cx, ax + i, ay + ah, 7, 7, C.awningR as string);
		}
	}

	/**
	 * Same lamp **head** vocabulary as sidewalk `drawStreetLights` (arm + housing + lens), no pole.
	 * Fixture always drawn; warm lens + spill glow follow `themeT` (on in dark mode).
	 */
	function drawRoofSignLampHead(cx: CanvasRenderingContext2D, centerX: number, signTop: number) {
		const lx = Math.round(centerX);
		const a = themeT;
		r(cx, lx - 9, signTop - 14, 18, 8, '#3a3a3c');
		r(cx, lx - 8, signTop - 6, 16, 3, '#505050');
		cx.fillStyle = `rgba(130,125,118,${0.5 + 0.25 * (1 - a)})`;
		cx.fillRect(lx - 7, signTop - 12, 14, 4);
		if (a > 0.02) {
			cx.fillStyle = `rgba(255,230,120,${0.2 + 0.78 * a})`;
			cx.fillRect(lx - 7, signTop - 12, 14, 4);
			const grad = cx.createRadialGradient(lx, signTop + 8, 2, lx, signTop + 30, 44);
			grad.addColorStop(0, `rgba(255,220,80,${a * 0.2})`);
			grad.addColorStop(1, 'rgba(255,220,80,0)');
			cx.fillStyle = grad;
			cx.beginPath();
			cx.ellipse(lx, signTop + 22, 40, 50, 0, 0, Math.PI * 2);
			cx.fill();
		}
	}

	/**
	 * Rooftop sign: `centerFill` panel + white rules / gold caps (no side wings).
	 * `lines` joined with a space for the label (e.g. SAY HOLA).
	 */
	function drawRoofSign(
		cx: CanvasRenderingContext2D,
		centerX: number,
		roofY: number,
		lines: string[],
		centerFill: string
	) {
		cx.save();
		cx.font = FONT_SIGN;
		cx.textAlign = 'center';
		cx.textBaseline = 'middle';
		const label = lines.join(' ').trim() || ' ';
		const padX = 14;
		const centerW = Math.max(Math.ceil(cx.measureText(label).width) + padX * 2, 72);
		const innerH = 30;
		const totalW = centerW;
		const totalH = innerH;
		const left = Math.round(centerX - totalW / 2);
		const top = Math.round(roofY - totalH - 5);
		const ix = left;
		const iy = top;

		r(cx, ix, iy, centerW, innerH, centerFill);

		const lx0 = ix + 5;
		const ruleW = centerW - 10;
		const gold = '#f0c028';
		const ruleTh = 2;
		const cap = 3;
		const lineY1 = iy + 5;
		const lineY2 = iy + innerH - 7;
		r(cx, lx0 + cap, lineY1, ruleW - 2 * cap, ruleTh, '#ffffff');
		r(cx, lx0, lineY1, cap, ruleTh, gold);
		r(cx, lx0 + ruleW - cap, lineY1, cap, ruleTh, gold);
		r(cx, lx0 + cap, lineY2, ruleW - 2 * cap, ruleTh, '#ffffff');
		r(cx, lx0, lineY2, cap, ruleTh, gold);
		r(cx, lx0 + ruleW - cap, lineY2, cap, ruleTh, gold);

		cx.fillStyle = '#ffffff';
		cx.fillText(label, ix + centerW / 2, iy + innerH / 2);

		drawRoofSignLampHead(cx, centerX, top);

		r(cx, Math.round(centerX) - 1, roofY - 5, 2, 5, '#4a4840');
		cx.restore();
	}

	function drawCenterBuilding(cx: CanvasRenderingContext2D, fr: number) {
		const BX = MAIN_BLOCK_X + 162;
		const BY = 118;
		const BW = 176;
		r(cx, BX, BY, BW, GROUND_Y - BY, C.brown as string);
		r(cx, BX - 6, BY - 6, BW + 12, 10, C.brownDark as string);
		r(cx, BX, BY, BW, 10, C.brownDark as string);

		const WW = 40;
		const WH = 50;
		const COL_X = [BX + 14, BX + 68, BX + 122];
		const ROW_Y = [BY + 24, BY + 96, BY + 168, BY + 240];

		ROW_Y.forEach((wy, ri) => {
			COL_X.forEach((wx, ci) => {
				const lit = !!C.winGlow && windowOn(ri * 10 + ci + 50, fr);
				const glass = lit ? (C.brownLitWin as string) : (C.brownWin as string);
				if (lit) {
					const g = cx.createRadialGradient(wx + WW / 2, wy + WH / 2, 2, wx + WW / 2, wy + WH / 2, WW);
					g.addColorStop(0, 'rgba(255,200,80,0.20)');
					g.addColorStop(1, 'rgba(255,200,80,0)');
					cx.fillStyle = g;
					cx.fillRect(wx - WW / 2, wy - WH / 2, WW * 2, WH * 2);
				}
				r(cx, wx, wy, WW, WH, C.brownWinFr as string);
				r(cx, wx + 4, wy + 4, WW - 8, WH - 8, glass);
				r(cx, wx + 4, wy + WH / 2 - 1, WW - 8, 2, C.brownWinFr as string);
				r(cx, wx + WW / 2 - 1, wy + 4, 2, WH - 8, C.brownWinFr as string);
				r(cx, wx - 2, wy + WH, WW + 4, 4, C.brownCornice as string);
			});
		});

		const SF_Y = GROUND_Y - 70;
		r(cx, BX, SF_Y, BW, 70, C.brownDark as string);
		r(cx, BX + 14, SF_Y - 6, BW - 28, 7, C.brownCornice as string);
		drawAwning(cx, BX + 14, SF_Y, BW - 28, 26);
		const DX = BX + BW / 2 - 18;
		r(cx, DX, SF_Y + 28, 36, 42, C.redDoor as string);
		r(cx, DX + 4, SF_Y + 30, 12, 18, C.redDoorHi as string);
		r(cx, DX + 20, SF_Y + 30, 12, 18, C.redDoorHi as string);
		r(cx, DX + 15, SF_Y + 50, 6, 3, C.knob as string);
		r(cx, BX + 8, SF_Y + 28, 42, 40, C.shopDark as string);
		r(cx, BX + 12, SF_Y + 32, 34, 32, C.shopGlass2 as string);
		r(cx, BX + BW - 50, SF_Y + 28, 42, 40, C.shopDark as string);
		r(cx, BX + BW - 46, SF_Y + 32, 34, 32, C.shopGlass2 as string);
		drawRoofSign(cx, BX + BW / 2, BY, ['ABOUT'], SIGN_CENTER_ABOUT);
	}

	function drawFireEscape(cx: CanvasRenderingContext2D, fx: number, fy: number, fw: number, fh: number) {
		r(cx, fx, fy, 3, fh, C.grayBal as string);
		r(cx, fx + fw - 3, fy, 3, fh, C.grayBal as string);
		for (let i = 0; i * 10 < fh; i++) {
			r(cx, fx, fy + i * 10, fw, 2, '#808080');
		}
		for (let p = 0; p * 80 < fh; p++) {
			r(cx, fx - 6, fy + p * 80, fw + 10, 4, C.grayBal as string);
		}
	}

	function drawRightBuilding(cx: CanvasRenderingContext2D, fr: number) {
		const BX = MAIN_BLOCK_X + 326;
		const BY = 202;
		const BW = 174;
		r(cx, BX, BY, BW, GROUND_Y - BY, C.gray as string);
		r(cx, BX, BY, BW, 8, C.grayDark as string);
		r(cx, BX, BY - 4, BW, 7, C.grayDark as string);

		const WW = 52;
		const WH = 38;
		const COL_X = [BX + 18, BX + 102];
		const ROW_Y = [BY + 22, BY + 100, BY + 178];

		ROW_Y.forEach((wy, ri) => {
			COL_X.forEach((wx, ci) => {
				const lit = !!C.winGlow && windowOn(ri * 10 + ci + 100, fr);
				const glass = lit ? (C.grayLitWin as string) : (C.grayWin as string);
				if (lit) {
					const g = cx.createRadialGradient(wx + WW / 2, wy + WH / 2, 2, wx + WW / 2, wy + WH / 2, WW);
					g.addColorStop(0, 'rgba(255,200,80,0.18)');
					g.addColorStop(1, 'rgba(255,200,80,0)');
					cx.fillStyle = g;
					cx.fillRect(wx - WW / 2, wy - WH / 2, WW * 2, WH * 2);
				}
				r(cx, wx, wy, WW, WH, C.grayWinFr as string);
				r(cx, wx + 4, wy + 4, WW - 8, WH - 8, glass);
				r(cx, wx + 4, wy + WH / 2, WW - 8, 2, C.grayWinFr as string);
				r(cx, wx + WW / 2 - 1, wy + 4, 2, WH - 8, C.grayWinFr as string);
				r(cx, wx - 3, wy + WH, WW + 6, 4, C.grayDark as string);
				const balY = wy + WH + 4;
				r(cx, wx - 6, balY, WW + 12, 3, C.grayBal as string);
				r(cx, wx - 6, balY + 14, WW + 12, 3, C.grayBal as string);
				for (let b = 0; b <= 7; b++) {
					r(
						cx,
						wx - 6 + b * Math.round((WW + 12) / 7),
						balY,
						3,
						17,
						C.grayRail as string
					);
				}
			});
		});

		drawFireEscape(cx, BX + BW - 30, BY + 30, 22, GROUND_Y - BY - 90);

		const SF_Y = GROUND_Y - 60;
		r(cx, BX, SF_Y, BW, 60, C.grayDark as string);
		r(cx, BX + 4, SF_Y + 6, BW - 8, 46, C.shopDark as string);
		r(cx, BX + 8, SF_Y + 10, BW - 16, 38, C.shopGlass2 as string);
		r(cx, BX + 46, SF_Y + 8, 36, 52, C.goldDoor as string);
		r(cx, BX + 50, SF_Y + 12, 12, 20, C.goldDoorHi as string);
		r(cx, BX + 62, SF_Y + 12, 12, 20, C.goldDoorHi as string);
		r(cx, BX + 60, SF_Y + 36, 6, 4, C.knobDk as string);
		drawRoofSign(cx, BX + BW / 2, BY, ['SAY HOLA'], SIGN_CENTER_HOLA);
	}

	function drawTree(cx: CanvasRenderingContext2D, tcx: number, groundY: number) {
		const tw = 62;
		const th = 58;
		const trW = 13;
		const trH = 32;
		r(cx, tcx - trW / 2, groundY - trH, trW, trH, C.trunk as string);
		r(cx, tcx - trW / 2, groundY - trH, 4, trH, C.trunkDk as string);
		const fy = groundY - trH - th;
		r(cx, tcx - tw / 2 + 12, fy + 14, tw - 24, th - 14, C.treeMid as string);
		r(cx, tcx - tw / 2 + 6, fy + 22, tw - 12, th - 22, C.treeMid as string);
		r(cx, tcx - tw / 2, fy + 28, tw, th - 28, C.treeMid as string);
		r(cx, tcx - tw / 2 + 18, fy + 2, tw - 36, th - 2, C.treeHi as string);
		r(cx, tcx - tw / 2 + 10, fy + 10, tw - 20, th - 10, C.treeHi as string);
		r(cx, tcx - tw / 2 + 4, fy + 20, tw - 8, th - 20, C.treeHi as string);
		r(cx, tcx - tw / 2, fy + 28, tw, th - 28, C.treeHi as string);
		r(cx, tcx - tw / 2 + 24, fy - 6, tw - 48, 16, C.treeHi as string);
		r(cx, tcx + tw / 2 - 18, fy + 10, 14, th - 10, C.treeDark as string);
		r(cx, tcx + tw / 2 - 12, fy + 22, 10, th - 22, C.treeDark as string);
		r(cx, tcx - tw / 2 + 4, fy + th - 12, tw - 8, 12, C.treeDark as string);
	}

	function drawStreet(cx: CanvasRenderingContext2D) {
		r(cx, 0, GROUND_Y, W, SIDEWALK_H, C.sidewalk as string);
		for (let y = GROUND_Y + 12; y < GROUND_Y + SIDEWALK_H; y += 12) {
			r(cx, 0, y, W, 1, C.sidewalkL as string);
		}
		for (let x = 0; x < W; x += 36) {
			r(cx, x, GROUND_Y, 1, 12, C.sidewalkL as string);
			r(cx, x + 18, GROUND_Y + 12, 1, 12, C.sidewalkL as string);
			r(cx, x, GROUND_Y + 24, 1, 16, C.sidewalkL as string);
		}
		r(cx, 0, GROUND_Y + SIDEWALK_H, W, 6, C.curb as string);
		r(cx, 0, GROUND_Y + SIDEWALK_H + 6, W, H - GROUND_Y - SIDEWALK_H, C.street as string);
		r(cx, 0, GROUND_Y + SIDEWALK_H + 26, W, 3, C.streetLine as string);
	}

	/** Door panels only — matches storefront rects in drawLeft/Center/RightBuilding */
	const SF_Y_WORK = GROUND_Y - 64;
	const SF_Y_ABOUT = GROUND_Y - 70;
	const SF_Y_POST = GROUND_Y - 60;
	const DOOR_HIGHLIGHT_RECTS: { x: number; y: number; w: number; h: number }[] = [
		{ x: MAIN_BLOCK_X + 104, y: SF_Y_WORK + 10, w: 34, h: 54 },
		{ x: MAIN_BLOCK_X + (162 + 176 / 2 - 18), y: SF_Y_ABOUT + 28, w: 36, h: 42 },
		{ x: MAIN_BLOCK_X + 326 + 46, y: SF_Y_POST + 8, w: 36, h: 52 }
	];

	function drawSelection(cx: CanvasRenderingContext2D) {
		const hi = houseAtWoman();
		if (hi === null) return;
		const d = DOOR_HIGHLIGHT_RECTS[hi];
		if (!d) return;
		cx.strokeStyle = 'rgb(255 220 80 / 0.95)';
		cx.lineWidth = 3;
		cx.strokeRect(d.x - 2, d.y - 2, d.w + 4, d.h + 4);
		cx.lineWidth = 1;
	}

	function fillCircle(cx: CanvasRenderingContext2D, cx0: number, cy: number, rad: number, col: string) {
		cx.fillStyle = col;
		for (let dy = -rad; dy <= rad; dy++) {
			const hw = Math.round(Math.sqrt(Math.max(0, rad * rad - dy * dy)));
			cx.fillRect(Math.round(cx0) - hw, Math.round(cy + dy), hw * 2, 1);
		}
	}

	function drawBall(cx: CanvasRenderingContext2D, bx: number, by: number) {
		fillCircle(cx, bx, by, 3, '#d89810');
		fillCircle(cx, bx - 1, by - 1, 1, '#f8e888');
	}

	function drawWheel(cx: CanvasRenderingContext2D, cx0: number, cy: number, rad: number) {
		fillCircle(cx, cx0, cy, rad, '#1a1a1a');
		fillCircle(cx, cx0, cy, rad - 3, '#666666');
		cx.fillStyle = '#888888';
		cx.fillRect(Math.round(cx0) - (rad - 3), Math.round(cy) - 1, (rad - 3) * 2, 2);
		cx.fillRect(Math.round(cx0) - 1, Math.round(cy) - (rad - 3), 2, (rad - 3) * 2);
		cx.fillStyle = '#aaaaaa';
		cx.fillRect(Math.round(cx0) - 2, Math.round(cy) - 2, 4, 4);
	}

	function pixelLine(cx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, col: string) {
		cx.fillStyle = col;
		let dx = Math.abs(x1 - x0);
		let dy = Math.abs(y1 - y0);
		let sx = x0 < x1 ? 1 : -1;
		let sy = y0 < y1 ? 1 : -1;
		let err = dx - dy;
		let x = x0;
		let y = y0;
		for (let i = 0; i < 300; i++) {
			cx.fillRect(Math.round(x), Math.round(y), 3, 3);
			if (Math.abs(x - x1) <= 2 && Math.abs(y - y1) <= 2) break;
			const e2 = 2 * err;
			if (e2 > -dy) {
				err -= dy;
				x += sx;
			}
			if (e2 < dx) {
				err += dx;
				y += sy;
			}
		}
	}

	function drawDogInBasket(cx: CanvasRenderingContext2D, bx: number, by: number) {
		r(cx, bx + 2, by + 2, 13, 6, '#f5f0e0');
		r(cx, bx + 2, by - 15, 4, 9, '#1a1a1a');
		r(cx, bx + 8, by - 13, 4, 7, '#1a1a1a');
		r(cx, bx + 2, by - 8, 10, 7, '#f5f0e0');
		r(cx, bx + 1, by - 8, 8, 6, '#1a1a1a');
		r(cx, bx - 3, by - 6, 5, 3, '#f5f0e0');
		r(cx, bx - 2, by - 4, 3, 1, '#1a1a1a');
		r(cx, bx + 2, by - 7, 2, 2, '#ffffff');
		r(cx, bx + 3, by - 7, 1, 1, '#1a1a1a');
		r(cx, bx - 2, by - 3, 2, 3, '#dd6644');
	}

	/** Canonical pose faces −x (snout left, tail right); mirror when `faceRight` */
	function drawDogWalking(
		cx: CanvasRenderingContext2D,
		dx: number,
		dy: number,
		fr: number,
		faceRight: boolean,
		barking = false
	) {
		const lA = fr * 0.22;
		const l1 = Math.round(Math.sin(lA) * 2);
		const l2 = Math.round(Math.sin(lA + Math.PI) * 2);
		/** ~horizontal center of sprite (dx−13 … dx+19) for mirror */
		const pivotX = dx + 3;
		const paint = () => {
			r(cx, dx, dy, 16, 7, '#f5f0e0');
			r(cx, dx + 14, dy - 6, 3, 7, '#f5f0e0');
			r(cx, dx + 16, dy - 9, 3, 4, '#f5f0e0');
			r(cx, dx - 3, dy - 2, 5, 5, '#f5f0e0');
			r(cx, dx - 7, dy - 16, 4, 9, '#1a1a1a');
			r(cx, dx - 2, dy - 13, 4, 7, '#1a1a1a');
			r(cx, dx - 8, dy - 9, 10, 7, '#f5f0e0');
			r(cx, dx - 9, dy - 9, 8, 6, '#1a1a1a');
			r(cx, dx - 13, dy - 7, 5, 3, '#f5f0e0');
			r(cx, dx - 12, dy - 5, 3, 1, '#1a1a1a');
			r(cx, dx - 9, dy - 8, 2, 2, '#ffffff');
			r(cx, dx - 8, dy - 8, 1, 1, '#1a1a1a');
			r(cx, dx - 12, dy - 4, 2, 3, '#dd6644');
			r(cx, dx + 2, dy + 7 + l1, 2, 6, '#f5f0e0');
			r(cx, dx + 6, dy + 7 + l2, 2, 6, '#f5f0e0');
			r(cx, dx + 9, dy + 7 + l1, 2, 6, '#f5f0e0');
			r(cx, dx + 12, dy + 7 + l2, 2, 6, '#f5f0e0');
			if (barking) {
				r(cx, dx - 18, dy - 8, 3, 2, '#2a2a2a');
				r(cx, dx - 21, dy - 11, 2, 2, '#f8f8f0');
				r(cx, dx - 25, dy - 13, 2, 2, '#f8f8f0');
				r(cx, dx - 29, dy - 12, 2, 2, '#f8f8f0');
				r(cx, dx - 33, dy - 10, 2, 2, '#e8e8d8');
			}
		};
		if (faceRight) {
			cx.save();
			cx.translate(pivotX, 0);
			cx.scale(-1, 1);
			cx.translate(-pivotX, 0);
			paint();
			cx.restore();
		} else {
			paint();
		}
	}

	/** Canonical left-facing rider; `drawBikeFrame` mirrors the whole bike when facing +x */
	function drawWomanOnBike(
		cx: CanvasRenderingContext2D,
		sx: number,
		sy: number,
		moving: boolean,
		fr: number
	) {
		const bob = moving ? Math.sin(fr * 0.18) * 1.5 : 0;
		const lA = moving ? fr * 0.15 : 1.2;
		const l1y = Math.round(Math.sin(lA) * 6);
		const l2y = Math.round(Math.sin(lA + Math.PI) * 6);

		r(cx, sx + 5, sy - 30 + bob, 11, 40, '#1a1a30');
		r(cx, sx + 8, sy - 28 + bob, 7, 32, '#24243a');
		r(cx, sx + 11, sy - 25 + bob, 4, 25, '#303050');

		r(cx, sx - 2, sy + 20 + l1y, 8, 4, '#151828');
		r(cx, sx - 9, sy + 22 + l2y, 8, 3, '#151828');

		r(cx, sx, sy + 4 + l1y, 5, 17, '#2a3870');
		r(cx, sx - 7, sy + 6 + l2y, 5, 17, '#2a3870');

		r(cx, sx - 7, sy - 12 + bob, 16, 16, '#3a5080');
		r(cx, sx - 2, sy - 12 + bob, 5, 4, '#f0f0f0');
		r(cx, sx - 7, sy - 12 + bob, 3, 16, '#2e4068');
		r(cx, sx + 6, sy - 12 + bob, 3, 16, '#2e4068');

		r(cx, sx + 5, sy - 8 + bob, 14, 4, '#d4905a');
		r(cx, sx - 13, sy - 7 + bob, 8, 4, '#d4905a');

		r(cx, sx - 1, sy - 14 + bob, 5, 4, '#d4905a');
		r(cx, sx - 3, sy - 23 + bob, 10, 10, '#d4905a');
		r(cx, sx - 2, sy - 19 + bob, 2, 3, '#2a5050');
		r(cx, sx - 2, sy - 20 + bob, 1, 1, '#ffffff');
		r(cx, sx + 6, sy - 20 + bob, 2, 4, '#c07848');

		r(cx, sx - 5, sy - 33 + bob, 16, 12, '#1a1a30');
		r(cx, sx - 2, sy - 35 + bob, 12, 4, '#1a1a30');
		r(cx, sx, sy - 36 + bob, 8, 2, '#1a1a30');
		r(cx, sx + 1, sy - 33 + bob, 7, 6, '#242448');
		r(cx, sx + 3, sy - 34 + bob, 5, 3, '#303068');
		r(cx, sx + 5, sy - 35 + bob, 3, 2, '#4848a0');

		r(cx, sx - 5, sy - 31 + bob, 2, 19, '#1a1a30');
	}

	/**
	 * Seated on park bench — same hair / jacket / crown / face UI as `drawWomanWalking`;
	 * `wyRef` lines up torso so jacket top matches walking proportions above the seat.
	 */
	function drawWomanSittingBench(cx: CanvasRenderingContext2D, wx: number, faceRight: boolean) {
		const hipY = BENCH_SEAT_HIP_Y;
		const fy = WALK_Y;
		const wyRef = hipY - 8;
		const pivotX = wx + 1;
		const paint = () => {
			r(cx, wx + 5, wyRef - 30, 11, 38, '#1a1a30');
			r(cx, wx + 8, wyRef - 28, 7, 30, '#24243a');
			r(cx, wx + 11, wyRef - 25, 4, 24, '#303050');

			r(cx, wx - 2, fy - 4, 8, 4, '#151828');
			r(cx, wx + 8, fy - 4, 8, 3, '#151828');

			r(cx, wx + 1, hipY - 3, 22, 7, '#2a3870');
			r(cx, wx + 2, hipY + 2, 18, 4, '#2a3870');
			const shinTop = hipY + 5;
			const shinH = Math.max(2, fy - shinTop - 4);
			r(cx, wx + 14, shinTop, 5, shinH, '#2a3870');
			r(cx, wx + 20, shinTop + 1, 4, shinH - 1, '#2a3870');

			r(cx, wx - 6, wyRef - 10, 15, 14, '#3a5080');
			r(cx, wx - 1, wyRef - 10, 5, 4, '#f0f0f0');
			r(cx, wx - 6, wyRef - 10, 3, 14, '#2e4068');
			r(cx, wx + 6, wyRef - 10, 3, 14, '#2e4068');

			r(cx, wx + 5, wyRef - 8, 4, 9, '#d4905a');
			r(cx, wx - 9, wyRef - 8, 4, 9, '#d4905a');

			r(cx, wx, wyRef - 13, 5, 4, '#d4905a');
			r(cx, wx - 3, wyRef - 23, 10, 10, '#d4905a');
			r(cx, wx - 2, wyRef - 19, 2, 3, '#2a5050');
			r(cx, wx - 2, wyRef - 20, 1, 1, '#ffffff');
			r(cx, wx + 6, wyRef - 20, 2, 4, '#c07848');

			r(cx, wx - 5, wyRef - 33, 16, 13, '#1a1a30');
			r(cx, wx - 2, wyRef - 35, 12, 4, '#1a1a30');
			r(cx, wx, wyRef - 36, 8, 2, '#1a1a30');
			r(cx, wx + 1, wyRef - 33, 7, 6, '#242448');
			r(cx, wx + 3, wyRef - 34, 5, 3, '#303068');
			r(cx, wx + 5, wyRef - 35, 3, 2, '#4848a0');

			r(cx, wx - 5, wyRef - 31, 2, 20, '#1a1a30');
		};
		if (faceRight) {
			cx.save();
			cx.translate(pivotX, 0);
			cx.scale(-1, 1);
			cx.translate(-pivotX, 0);
			paint();
			cx.restore();
		} else {
			paint();
		}
	}

	/** Canonical pose faces −x; mirror when `faceRight` */
	function drawWomanWalking(
		cx: CanvasRenderingContext2D,
		wx: number,
		wy: number,
		frameCount: number,
		faceRight: boolean,
		isWalking: boolean
	) {
		const lA = (isWalking ? frameCount : 0) * 0.16;
		const l1 = Math.round(Math.sin(lA) * 5);
		const l2 = Math.round(Math.sin(lA + Math.PI) * 5);
		const a1 = Math.round(Math.sin(lA) * 4);
		const a2 = Math.round(Math.sin(lA + Math.PI) * 4);
		const pivotX = wx + 1;

		const paint = () => {
			r(cx, wx + 5, wy - 30, 11, 38, '#1a1a30');
			r(cx, wx + 8, wy - 28, 7, 30, '#24243a');
			r(cx, wx + 11, wy - 25, 4, 24, '#303050');

			r(cx, wx - 2, wy + 20 + l1, 8, 4, '#151828');
			r(cx, wx - 7, wy + 22 + l2, 8, 3, '#151828');

			r(cx, wx + 1, wy + 2 + l1, 5, 18, '#2a3870');
			r(cx, wx - 4, wy + 4 + l2, 5, 18, '#2a3870');

			r(cx, wx - 6, wy - 10, 15, 14, '#3a5080');
			r(cx, wx - 1, wy - 10, 5, 4, '#f0f0f0');
			r(cx, wx - 6, wy - 10, 3, 14, '#2e4068');
			r(cx, wx + 6, wy - 10, 3, 14, '#2e4068');

			r(cx, wx + 6, wy - 8 + a1, 4, 11, '#d4905a');
			r(cx, wx - 10, wy - 8 + a2, 4, 11, '#d4905a');

			r(cx, wx, wy - 13, 5, 4, '#d4905a');
			r(cx, wx - 3, wy - 23, 10, 10, '#d4905a');
			r(cx, wx - 2, wy - 19, 2, 3, '#2a5050');
			r(cx, wx - 2, wy - 20, 1, 1, '#ffffff');
			r(cx, wx + 6, wy - 20, 2, 4, '#c07848');

			r(cx, wx - 5, wy - 33, 16, 13, '#1a1a30');
			r(cx, wx - 2, wy - 35, 12, 4, '#1a1a30');
			r(cx, wx, wy - 36, 8, 2, '#1a1a30');
			r(cx, wx + 1, wy - 33, 7, 6, '#242448');
			r(cx, wx + 3, wy - 34, 5, 3, '#303068');
			r(cx, wx + 5, wy - 35, 3, 2, '#4848a0');

			r(cx, wx - 5, wy - 31, 2, 20, '#1a1a30');
		};

		if (faceRight) {
			cx.save();
			cx.translate(pivotX, 0);
			cx.scale(-1, 1);
			cx.translate(-pivotX, 0);
			paint();
			cx.restore();
		} else {
			paint();
		}
	}

	function drawBikeFrame(
		cx: CanvasRenderingContext2D,
		bx: number,
		by: number,
		withRider: boolean,
		moving: boolean,
		fr: number,
		riderFaceRight: boolean
	) {
		const bx0 = Math.round(bx);
		const paint = () => {
			const wrad = 10;
			const fwx = bx0 - 20;
			const rwx = bx0 + 20;
			const wy = Math.round(by - wrad - 1);
			const baskX = fwx - 15;
			const baskY = wy - 12;

			r(cx, baskX, baskY, 18, 13, '#8B5E10');
			r(cx, baskX + 2, baskY + 2, 14, 9, '#a06818');
			for (let bi = 0; bi < 4; bi++) r(cx, baskX + 2 + bi * 4, baskY, 2, 13, '#6a4608');
			if (withRider) drawDogInBasket(cx, baskX, baskY);

			const RL = '#dd1111';
			const DR = '#aa0808';
			const bbx = bx0 - 2;
			const bby = wy + 3;
			r(cx, bbx, wy - 18, 4, 22, RL);
			pixelLine(cx, bbx, wy - 18, fwx + 2, wy - 13, RL);
			pixelLine(cx, fwx + 2, wy - 13, bbx, bby, DR);
			pixelLine(cx, bbx, bby, rwx, wy, DR);
			r(cx, fwx - 1, wy - 12, 4, 13, DR);
			r(cx, bx0 - 10, wy - 20, 18, 4, '#2a2a2a');
			r(cx, bx0 - 8, wy - 22, 14, 3, '#383838');
			r(cx, fwx - 1, wy - 17, 4, 8, '#aaaaaa');
			r(cx, fwx - 8, wy - 19, 14, 3, '#888888');
			r(cx, fwx - 8, wy - 19, 3, 6, '#666666');
			r(cx, fwx + 3, wy - 19, 3, 6, '#666666');
			drawWheel(cx, fwx, wy, wrad);
			drawWheel(cx, rwx, wy, wrad);
			if (withRider) drawWomanOnBike(cx, bbx, wy - 20, moving, fr);
		};
		if (riderFaceRight) {
			cx.save();
			cx.translate(bx0, 0);
			cx.scale(-1, 1);
			cx.translate(-bx0, 0);
			paint();
			cx.restore();
		} else {
			paint();
		}
	}

	function applyMovement() {
		if (!introDone) return;
		if (playerActivity.mode === 'bike') {
			if (keysHeld.left && !keysHeld.right) bikeFacing.right = false;
			else if (keysHeld.right && !keysHeld.left) bikeFacing.right = true;
		} else {
			if (keysHeld.left && !keysHeld.right) walkFacing.right = false;
			else if (keysHeld.right && !keysHeld.left) walkFacing.right = true;
		}
		/** Bench: no movement. Walk + bike: horizontal only while riding (no doors / Enter / bench until dismount). */
		if (playerActivity.mode === 'bench') return;
		if (keysHeld.left) womanX -= MOVE_SPEED;
		if (keysHeld.right) womanX += MOVE_SPEED;
		womanX = Math.max(X_MIN, Math.min(X_MAX, womanX));
	}

	/** True = face toward +x. While strafing, follows keys; when idle, last facing. */
	function playerFacingRight(): boolean {
		const L = keysHeld.left;
		const R = keysHeld.right;
		if (L && !R) return false;
		if (R && !L) return true;
		return walkFacing.right;
	}

	function drawBikeScene(cx: CanvasRenderingContext2D, fr: number) {
		cx.save();
		cx.beginPath();
		cx.rect(0, 0, W, H);
		cx.clip();

		if (!introDone) {
			const movingBike = scene.state === 'moving_left';
			/** Bike travels left; rider looks along travel (same as walking introFaceRight) */
			const riderFaceRight = false;
			drawBikeFrame(cx, scene.bikeX, scene.bikeY, scene.womanOnBike, movingBike, fr, riderFaceRight);
			if (!scene.womanOnBike) {
				const walking =
					scene.state === 'walking_to_sidewalk' || scene.state === 'walking_sidewalk';
				const introFaceRight = false;
				const stepFr = walking ? fr : 0;
				drawWomanWalking(
					cx,
					Math.round(scene.womanX),
					Math.round(scene.womanY),
					fr,
					introFaceRight,
					walking
				);
				drawDogWalking(cx, Math.round(scene.dogX), Math.round(scene.dogY), stepFr, introFaceRight);
			}
		} else {
			const faceRight = playerFacingRight();
			const wx = Math.round(womanX);
			const onBike = playerActivity.mode === 'bike';
			/** Parked bike at last drop point; while riding bx tracks the player (womanX + 4). */
			const bikeCx = onBike ? Math.round(womanX + 4) : parkedBikeX;
			const bikeMoving = onBike && (keysHeld.left || keysHeld.right);
			drawBikeFrame(cx, bikeCx, PARKED_BIKE_Y, onBike, bikeMoving, fr, bikeFacing.right);

			if (onBike) {
				cx.restore();
				return;
			}

			const dogLeftX = faceRight
				? Math.round(womanX + DOG_OFFSET)
				: Math.max(4, Math.round(womanX - 38));
			const moving =
				playerActivity.mode === 'walk' && (keysHeld.left || keysHeld.right);
			const dogBarking = !moving && frame < dogBark.until;

			if (playerActivity.mode === 'bench') {
				drawWomanSittingBench(cx, wx, faceRight);
				drawDogWalking(cx, dogLeftX, WALK_Y, 0, faceRight, dogBarking);
			} else {
				drawWomanWalking(cx, wx, WALK_Y, fr, faceRight, moving);
				const fg = fetchGame;
				const fetchingDog = fg.phase === 'to_ball' || fg.phase === 'back';
				const dogXDraw = fetchingDog ? Math.round(fg.dogX) : dogLeftX;
				const dogFaceDraw = fetchingDog ? fg.dogFaceRight : faceRight;
				const dogStepFr = fetchingDog || moving ? fr : 0;
				const barkOk =
					!moving && !fetchingDog && frame < dogBark.until;
				if (fg.phase === 'ball' || fg.phase === 'to_ball') {
					drawBall(cx, Math.round(fg.ballX), Math.round(fg.ballY));
				}
				drawDogWalking(cx, dogXDraw, WALK_Y, dogStepFr, dogFaceDraw, barkOk);
			}
		}

		cx.restore();
	}

	function render(cx: CanvasRenderingContext2D) {
		const target = isDark ? 1 : 0;
		if (Math.abs(themeT - target) > 0.005) {
			themeT += (target - themeT) * FADE_SPEED;
		} else {
			themeT = target;
		}
		blendPalette(themeT);

		cx.clearRect(0, 0, W, H);

		applyMovement();
		if (!introDone) updateIntroScene();
		else {
			updateFetchGame();
			updateDogIdleBark();
		}

		drawSky(cx);
		drawStars(cx, frame, themeT);
		drawMoon(cx, themeT);
		drawClouds(cx, frame);

		drawParkWing(cx, 0);
		drawLeftBuilding(cx, frame);
		drawCenterBuilding(cx, frame);
		drawRightBuilding(cx, frame);
		drawParkWing(cx, W - WING_W);
		drawRightParkEntrance(cx);

		if (introDone) drawSelection(cx);

		drawStreet(cx);
		drawStreetLights(cx, themeT);
		drawTree(cx, MAIN_BLOCK_X + 208, GROUND_Y);
		/** Right tree: past Postal door — positions match original 500px hub */
		drawTree(cx, MAIN_BLOCK_X + 456, GROUND_Y);

		drawBikeScene(cx, frame);

		frame++;
	}

	function tick() {
		const cx = ctxRef;
		if (canvas && cx) {
			render(cx);
		}
		raf = requestAnimationFrame(tick);
	}

	function tryEnter() {
		if (!introDone) return;
		if (playerActivity.mode === 'bike') return;
		const h = houseAtWoman();
		if (h !== null) void goto(`/house/${h + 1}`);
	}

	function handleVerticalAction(up: boolean) {
		if (!introDone) return;

		if (playerActivity.mode === 'bench') {
			if (!up) playerActivity.mode = 'walk';
			return;
		}

		if (playerActivity.mode === 'bike') {
			if (!up) {
				const bx = Math.round(womanX + 4);
				parkedBikeX = bx;
				playerActivity.mode = 'walk';
				walkFacing.right = bikeFacing.right;
				/** Standing left of dropped bike */
				womanX = Math.round(bx - 28);
			}
			return;
		}

		if (up && houseAtWoman() !== null) {
			tryEnter();
			return;
		}

		if (up && womanNearBench()) {
			playerActivity.mode = 'bench';
			return;
		}
		if (!up && womanNearBike()) {
			playerActivity.mode = 'bike';
			womanX = Math.round(parkedBikeX - 4);
			bikeFacing.right = walkFacing.right;
		}
	}

	function setMoveKey(e: KeyboardEvent, down: boolean) {
		if (!introDone) return;
		if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
			e.preventDefault();
			keysHeld.left = down;
		} else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
			e.preventDefault();
			keysHeld.right = down;
		}
	}

	function onKeydown(e: KeyboardEvent) {
		setMoveKey(e, true);
		if (!e.repeat && introDone && (e.key === 'b' || e.key === 'B')) {
			e.preventDefault();
			tryThrowBall();
		}
		if (!e.repeat && introDone) {
			if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
				e.preventDefault();
				handleVerticalAction(true);
			} else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
				e.preventDefault();
				handleVerticalAction(false);
			}
		}
	}

	function onKeyup(e: KeyboardEvent) {
		setMoveKey(e, false);
	}

	function setupCanvas() {
		const c = canvas;
		if (!c || typeof window === 'undefined') return;
		const desktop = window.matchMedia('(min-width: 768px)').matches;
		const dpr = window.devicePixelRatio || 1;
		const pr = desktop ? Math.max(2, Math.min(dpr, 2.5)) : Math.min(dpr, 2);
		c.width = Math.round(W * pr);
		c.height = Math.round(H * pr);
		const cx = c.getContext('2d');
		if (!cx) return;
		cx.setTransform(pr, 0, 0, pr, 0, 0);
		cx.imageSmoothingEnabled = false;
		ctxRef = cx;
	}

	let mqTheme: MediaQueryList | null = null;

	function applyThemeFromSystem() {
		if (typeof window === 'undefined') return;
		mqTheme = window.matchMedia('(prefers-color-scheme: dark)');
		isDark = mqTheme.matches;
	}

	function onThemeChange() {
		if (mqTheme) isDark = mqTheme.matches;
	}

	function syncPortraitGate() {
		if (typeof window === 'undefined') return;
		const mq = window.matchMedia('(max-width: 768px) and (orientation: portrait)');
		portraitGateActive = mq.matches;
	}

	onMount(() => {
		syncPortraitGate();
		const mqPortrait = window.matchMedia('(max-width: 768px) and (orientation: portrait)');
		mqPortrait.addEventListener('change', syncPortraitGate);
		return () => mqPortrait.removeEventListener('change', syncPortraitGate);
	});

	onMount(() => {
		const c = canvas;
		if (!c) return;
		resetIntroScene();
		applyThemeFromSystem();
		setupCanvas();
		const mq = window.matchMedia('(min-width: 768px)');
		const onMq = () => setupCanvas();
		mq.addEventListener('change', onMq);
		mqTheme?.addEventListener('change', onThemeChange);
		let resizeT = 0;
		const onResize = () => {
			window.clearTimeout(resizeT);
			resizeT = window.setTimeout(() => setupCanvas(), 150);
		};
		window.addEventListener('resize', onResize);
		raf = requestAnimationFrame(tick);
		window.addEventListener('keydown', onKeydown);
		window.addEventListener('keyup', onKeyup);
		const onBlur = () => {
			keysHeld.left = false;
			keysHeld.right = false;
		};
		window.addEventListener('blur', onBlur);
		return () => {
			mq.removeEventListener('change', onMq);
			mqTheme?.removeEventListener('change', onThemeChange);
			window.removeEventListener('resize', onResize);
			window.clearTimeout(resizeT);
			cancelAnimationFrame(raf);
			window.removeEventListener('keydown', onKeydown);
			window.removeEventListener('keyup', onKeyup);
			window.removeEventListener('blur', onBlur);
		};
	});
</script>

<div
	class="lara-bros"
	class:lara-bros--dark={isDark}
	class:lara-bros--light={!isDark}
	aria-label="Pixel city hub"
>
	<div
		class="lara-bros__portrait-gate"
		role="dialog"
		aria-modal="true"
		aria-hidden={!portraitGateActive}
		aria-labelledby="lara-bros-rotate-title"
	>
		<span class="lara-bros__portrait-gate-icon" aria-hidden="true">↻</span>
		<p id="lara-bros-rotate-title" class="lara-bros__portrait-gate-title">
			Turn your device sideways
		</p>
		<p class="lara-bros__portrait-gate-hint">Landscape fits this scene and controls better.</p>
	</div>

	<div class="lara-bros__playfield" aria-hidden={portraitGateActive}>
		<div class="lara-bros__frame">
			<div
				class="lara-bros__canvas-shell"
				style="--hub-w: {W}px; --hub-h: {H}px;"
			>
				<canvas
					bind:this={canvas}
					class="lara-bros__canvas"
					width={W}
					height={H}
					aria-label="World map"
				></canvas>
			</div>
		</div>

		<div class="lara-bros__touch" aria-hidden="true">
			<div class="lara-bros__touch-cluster">
				<div class="lara-bros__touch-inline">
					<button
						type="button"
						class="lara-bros__pad-btn"
						aria-label="Left"
						onpointerdown={(e) => {
							e.preventDefault();
							if (introDone) keysHeld.left = true;
						}}
						onpointerup={() => (keysHeld.left = false)}
						onpointercancel={() => (keysHeld.left = false)}
						onpointerleave={() => (keysHeld.left = false)}
					>
						◀
					</button>
					<button
						type="button"
						class="lara-bros__pad-btn"
						aria-label="Up"
						onclick={() => {
							if (introDone) handleVerticalAction(true);
						}}
					>
						▲
					</button>
					<button
						type="button"
						class="lara-bros__pad-btn"
						aria-label="Down"
						onclick={() => {
							if (introDone) handleVerticalAction(false);
						}}
					>
						▼
					</button>
					<button
						type="button"
						class="lara-bros__pad-btn"
						aria-label="Right"
						onpointerdown={(e) => {
							e.preventDefault();
							if (introDone) keysHeld.right = true;
						}}
						onpointerup={() => (keysHeld.right = false)}
						onpointercancel={() => (keysHeld.right = false)}
						onpointerleave={() => (keysHeld.right = false)}
					>
						▶
					</button>
				</div>
				<button
					type="button"
					class="lara-bros__ball-btn"
					onpointerdown={onBallPointerDown}
					onclick={() => tryThrowBall()}
				>
					Ball
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.lara-bros {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		z-index: 4;
		box-sizing: border-box;
		padding-top: max(calc(var(--nav-pad-y) + 3.5rem), env(safe-area-inset-top));
		padding-left: max(var(--nav-pad-x), env(safe-area-inset-left));
		padding-right: max(var(--nav-pad-x), env(safe-area-inset-right));
		padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: hidden;
		transition: background 0.8s ease;
	}

	/**
	 * Phones: less top inset — nav is corner-aligned; we were double-counting vs canvas max-height.
	 */
	@media (max-width: 768px) {
		.lara-bros {
			padding-top: max(calc(var(--nav-pad-y) + 2.35rem), env(safe-area-inset-top));
			padding-left: max(0.65rem, env(safe-area-inset-left));
			padding-right: max(0.65rem, env(safe-area-inset-right));
			padding-bottom: max(0.35rem, env(safe-area-inset-bottom));
		}
	}

	@media (max-width: 768px) and (orientation: landscape) {
		.lara-bros {
			padding-top: max(calc(var(--nav-pad-y) + 1.85rem), env(safe-area-inset-top));
			padding-bottom: max(0.2rem, env(safe-area-inset-bottom));
		}
	}

	.lara-bros__playfield {
		flex: 1;
		min-height: 0;
		width: 100%;
		display: flex;
		flex-direction: column;
	}

	.lara-bros--light {
		background: #c8d8e8;
		color: #555;
	}

	.lara-bros--dark {
		background: #0a0a1a;
		color: #778;
	}

	/**
	 * Phones in portrait: wide hub + controls are too cramped — ask for landscape.
	 * Hidden in landscape and on viewports wide enough that portrait is still usable.
	 */
	.lara-bros__portrait-gate {
		display: none;
	}

	@media (max-width: 768px) and (orientation: portrait) {
		.lara-bros__portrait-gate {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 0.75rem;
			position: fixed;
			inset: 0;
			z-index: 100;
			box-sizing: border-box;
			padding: max(1.25rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right))
				max(1.25rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left));
			text-align: center;
			background: var(--color-bg);
			color: var(--color-text);
			font-family: var(--font-sans);
			-webkit-tap-highlight-color: transparent;
		}

		.lara-bros__portrait-gate-icon {
			font-size: clamp(2.5rem, 12vw, 3.5rem);
			line-height: 1;
			opacity: 0.85;
			animation: lara-bros-rotate-nudge 2.4s ease-in-out infinite;
		}

		.lara-bros__portrait-gate-title {
			margin: 0;
			font-size: clamp(0.95rem, 4.2vw, 1.1rem);
			font-weight: 500;
			letter-spacing: 0.02em;
			max-width: 16rem;
		}

		.lara-bros__portrait-gate-hint {
			margin: 0;
			font-size: clamp(0.75rem, 3.2vw, 0.875rem);
			font-weight: 400;
			line-height: 1.45;
			opacity: 0.75;
			max-width: 17rem;
		}
	}

	@keyframes lara-bros-rotate-nudge {
		0%,
		100% {
			transform: rotate(0deg);
		}
		40% {
			transform: rotate(-12deg);
		}
		55% {
			transform: rotate(12deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.lara-bros__portrait-gate-icon {
			animation: none;
		}
	}

	/* Wide logical canvas (--hub-w × --hub-h); size to the flex frame — not 100dvh minus fudge (avoids double-count with padding). */
	.lara-bros__frame {
		flex: 1;
		min-height: 0;
		min-width: 0;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 0;
		background: inherit;
		padding: 4px;
		box-sizing: border-box;
	}

	@supports (width: 1cqw) {
		.lara-bros__frame {
			container-type: size;
		}
	}

	.lara-bros__canvas-shell {
		--hub-w: 1300px;
		--hub-h: 620px;
		box-sizing: border-box;
		max-width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/** Fit aspect box inside the frame (actual space below nav + above controls). */
	@supports (width: 1cqw) {
		.lara-bros__canvas-shell {
			width: min(100cqw, calc(100cqh * var(--hub-w) / var(--hub-h)));
			aspect-ratio: var(--hub-w) / var(--hub-h);
			height: auto;
		}
	}

	/** Older browsers: single conservative dvh budget (padding already reserved above). */
	@supports not (width: 1cqw) {
		.lara-bros__canvas-shell {
			max-height: calc(100svh - 5.25rem);
			width: min(100%, calc((100svh - 5.25rem) * var(--hub-w) / var(--hub-h)));
			aspect-ratio: var(--hub-w) / var(--hub-h);
		}
	}

	@media (max-width: 768px) and (orientation: landscape) {
		.lara-bros__touch {
			padding-top: 0.1rem;
		}
	}

	.lara-bros__canvas {
		display: block;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		border: 3px solid #333;
		-ms-interpolation-mode: nearest-neighbor;
		image-rendering: crisp-edges;
		image-rendering: pixelated;
	}

	/**
	 * Touch targets: scale down on narrow / short viewports so the cross + Ball
	 * stay inside the viewport without crowding the canvas.
	 */
	.lara-bros__touch {
		--touch-fs: clamp(0.28rem, 2.6vw, 0.45rem);
		--pad-size: clamp(2.25rem, 7vw, 3rem);
		/** Arrow glyphs in pad squares (independent from box size) */
		--pad-arrow-fs: clamp(0.48rem, 2.5vw, 0.68rem);
		flex-shrink: 0;
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding-top: clamp(0.2rem, 1.2vw, 0.5rem);
	}

	.lara-bros__touch-cluster {
		width: 100%;
		max-width: 100%;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		box-sizing: border-box;
		padding-left: max(0, env(safe-area-inset-left));
		padding-right: max(0, env(safe-area-inset-right));
		column-gap: clamp(0.35rem, 2vw, 0.75rem);
	}

	/** D-pad centered in the middle column */
	.lara-bros__touch-inline {
		grid-column: 2;
		justify-self: center;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: clamp(0.35rem, 2vw, 0.55rem);
	}

	.lara-bros__pad-btn {
		box-sizing: border-box;
		width: var(--pad-size);
		height: var(--pad-size);
		min-width: var(--pad-size);
		padding: 0;
		margin: 0;
		border: 2px solid #2a1810;
		border-radius: 2px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: 'Press Start 2P', ui-monospace, monospace;
		font-size: var(--pad-arrow-fs);
		line-height: 1;
		background: linear-gradient(180deg, #f0e6d8, #c8b8a0);
		color: #2a1810;
		box-shadow:
			inset 2px 2px 0 rgba(255, 255, 255, 0.4),
			0 clamp(1px, 0.35vw, 3px) 0 #5a3820;
		-webkit-tap-highlight-color: transparent;
	}

	.lara-bros__pad-btn:active {
		transform: translateY(1px);
		box-shadow:
			inset 1px 1px 0 rgba(255, 255, 255, 0.3),
			0 1px 0 #5a3820;
	}

	.lara-bros__ball-btn {
		grid-column: 3;
		justify-self: end;
		align-self: center;
		font-family: 'Press Start 2P', ui-monospace, monospace;
		font-size: var(--touch-fs);
		min-height: var(--pad-size);
		height: auto;
		padding: clamp(0.35rem, 2vw, 0.5rem) clamp(0.85rem, 4vw, 1.15rem);
		border: 2px solid #2a1810;
		border-radius: 9999px;
		background: linear-gradient(180deg, #f0e6d8, #c8b8a0);
		color: #2a1810;
		cursor: pointer;
		box-shadow:
			inset 2px 2px 0 rgba(255, 255, 255, 0.35),
			0 clamp(1px, 0.35vw, 3px) 0 #5a3820;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
	}

	.lara-bros__ball-btn:active {
		transform: translateY(1px);
		box-shadow: 0 1px 0 #5a3820;
	}

	.lara-bros--dark .lara-bros__pad-btn {
		border-color: #5c5868;
		background: linear-gradient(180deg, #383448, #242028);
		color: #d4d0e4;
		box-shadow:
			inset 2px 2px 0 rgba(255, 255, 255, 0.1),
			0 clamp(1px, 0.35vw, 3px) 0 #0c0a12;
	}

	.lara-bros--dark .lara-bros__pad-btn:active {
		box-shadow:
			inset 1px 1px 0 rgba(255, 255, 255, 0.06),
			0 1px 0 #0c0a12;
	}

	.lara-bros--dark .lara-bros__ball-btn {
		border-color: #5c5868;
		background: linear-gradient(180deg, #383448, #242028);
		color: #d4d0e4;
		box-shadow:
			inset 2px 2px 0 rgba(255, 255, 255, 0.09),
			0 clamp(1px, 0.35vw, 3px) 0 #0c0a12;
	}

	.lara-bros--dark .lara-bros__ball-btn:active {
		box-shadow: 0 1px 0 #0c0a12;
	}

	/** Mobile: smaller hit targets, larger arrow + label type for readability */
	@media (max-width: 768px) {
		.lara-bros__touch {
			--pad-size: clamp(1.48rem, 9.2vw, 1.95rem);
			--pad-arrow-fs: clamp(0.54rem, 4.6vw, 0.78rem);
			--touch-fs: clamp(0.38rem, 3.6vw, 0.52rem);
		}
	}

	/** Short desktop / tablet window only — avoids clobbering mobile landscape typography */
	@media (max-height: 520px) and (min-width: 769px) {
		.lara-bros__touch {
			--pad-size: clamp(1.85rem, 6.5vh, 2.55rem);
			--pad-arrow-fs: clamp(0.46rem, 2.2vw, 0.64rem);
			--touch-fs: clamp(0.24rem, 2.2vh, 0.4rem);
		}
	}
</style>
