import { z } from 'zod';

// ─── Auth ──────────────────────────────────────────────────────────────────

export const FirebaseTokenPayload = z.object({
  uid: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
});
export type FirebaseTokenPayload = z.infer<typeof FirebaseTokenPayload>;

// ─── User ──────────────────────────────────────────────────────────────────

export const UserProfile = z.object({
  id: z.string().uuid(),
  firebaseUid: z.string(),
  displayName: z.string().min(1).max(50),
  email: z.string().email().optional(),
  level: z.number().int().min(1).default(1),
  xp: z.number().int().min(0).default(0),
  streakDays: z.number().int().min(0).default(0),
  totalGames: z.number().int().min(0).default(0),
  totalBingos: z.number().int().min(0).default(0),
  preferredHour: z.number().int().min(0).max(23).optional(),
  createdAt: z.string().datetime(),
});
export type UserProfile = z.infer<typeof UserProfile>;

// ─── Game / Card ───────────────────────────────────────────────────────────

export const GameMode = z.enum(['daily', 'campaign', 'multiplayer_public', 'multiplayer_family', 'free']);
export type GameMode = z.infer<typeof GameMode>;

// Card: 3 rows × 9 cells (number | null)
export const CardRow = z.tuple([
  z.number().int().min(1).max(90).nullable(),
  z.number().int().min(1).max(90).nullable(),
  z.number().int().min(1).max(90).nullable(),
  z.number().int().min(1).max(90).nullable(),
  z.number().int().min(1).max(90).nullable(),
  z.number().int().min(1).max(90).nullable(),
  z.number().int().min(1).max(90).nullable(),
  z.number().int().min(1).max(90).nullable(),
  z.number().int().min(1).max(90).nullable(),
]);
export const CardSchema = z.tuple([CardRow, CardRow, CardRow]);
export type CardSchema = z.infer<typeof CardSchema>;

export const GameSession = z.object({
  id: z.string().uuid(),
  mode: GameMode,
  userId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  card: CardSchema,
  ballsDrawn: z.array(z.number().int().min(1).max(90)),
  lineValidated: z.boolean().default(false),
  quineValidated: z.boolean().default(false),
  bingoValidated: z.boolean().default(false),
  couponAwarded: z.boolean().default(false),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
});
export type GameSession = z.infer<typeof GameSession>;

// ─── Room (Multiplayer) ────────────────────────────────────────────────────

export const RoomStatus = z.enum(['waiting', 'starting', 'active', 'finished']);
export type RoomStatus = z.infer<typeof RoomStatus>;

export const Room = z.object({
  id: z.string().uuid(),
  mode: z.enum(['multiplayer_public', 'multiplayer_family']),
  status: RoomStatus,
  inviteCode: z.string().length(6).optional(), // for family rooms
  maxPlayers: z.number().int().min(2).max(15).default(10),
  ballSequence: z.array(z.number().int().min(1).max(90)).length(90),
  ballsDrawnCount: z.number().int().min(0).max(90).default(0),
  firstBingoUserId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
});
export type Room = z.infer<typeof Room>;

export const RoomPlayer = z.object({
  roomId: z.string().uuid(),
  userId: z.string().uuid(),
  isGhost: z.boolean().default(false),
  ghostName: z.string().optional(),
  card: CardSchema,
  lineValidated: z.boolean().default(false),
  quineValidated: z.boolean().default(false),
  bingoValidated: z.boolean().default(false),
  joinedAt: z.string().datetime(),
});
export type RoomPlayer = z.infer<typeof RoomPlayer>;

// ─── Matchmaking ───────────────────────────────────────────────────────────

export const MatchmakingRequest = z.object({
  mode: z.enum(['multiplayer_public', 'multiplayer_family']),
  inviteCode: z.string().length(6).optional(),
});
export type MatchmakingRequest = z.infer<typeof MatchmakingRequest>;

export const MatchmakingResponse = z.object({
  roomId: z.string().uuid(),
  status: RoomStatus,
  playerCount: z.number().int(),
  startCountdownMs: z.number().int().optional(), // time until game starts
});
export type MatchmakingResponse = z.infer<typeof MatchmakingResponse>;

// ─── Merchant & Coupon ─────────────────────────────────────────────────────

export const SubscriptionTier = z.enum(['discovery', 'standard', 'premium', 'event']);
export type SubscriptionTier = z.infer<typeof SubscriptionTier>;

export const Merchant = z.object({
  id: z.string().uuid(),
  siret: z.string().length(14),
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  address: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  subscriptionTier: SubscriptionTier,
  active: z.boolean().default(true),
  createdAt: z.string().datetime(),
});
export type Merchant = z.infer<typeof Merchant>;

export const CouponOffer = z.object({
  id: z.string().uuid(),
  merchantId: z.string().uuid(),
  description: z.string().min(1).max(200), // texte libre marchand
  monthlyStock: z.number().int().min(1).max(1000),
  dailyCap: z.number().int().min(1).max(100),
  weeklyPlayerCap: z.number().int().min(1).max(10).default(1),
  validUntil: z.string().datetime(),
  active: z.boolean().default(true),
});
export type CouponOffer = z.infer<typeof CouponOffer>;

export const PlayerCoupon = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  couponOfferId: z.string().uuid(),
  merchantId: z.string().uuid(),
  qrCode: z.string().uuid(), // encrypted UUID, single-use
  awardedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  usedAt: z.string().datetime().optional(),
  giftedToUserId: z.string().uuid().optional(),
});
export type PlayerCoupon = z.infer<typeof PlayerCoupon>;

// ─── Socket.io events ──────────────────────────────────────────────────────
// Shared contract between API and mobile

export const SocketEvents = {
  // Server → Client
  BALL_DRAWN:      'game:ball_drawn',
  RESULT_UPDATE:   'game:result_update',    // line/quine/bingo state changed
  COUPON_AWARDED:  'game:coupon_awarded',
  ROOM_STATUS:     'room:status',           // waiting → starting → active
  HOST_SPEAK:      'host:speak',            // Marcel phrase event
  PLAYER_JOINED:   'room:player_joined',
  GAME_OVER:       'game:over',

  // Client → Server
  JOIN_ROOM:       'room:join',
  CLAIM_LINE:      'game:claim_line',
  CLAIM_QUINE:     'game:claim_quine',
  CLAIM_BINGO:     'game:claim_bingo',
} as const;

export type SocketEventName = typeof SocketEvents[keyof typeof SocketEvents];

// Typed payloads for key events
export const BallDrawnPayload = z.object({
  ball: z.number().int().min(1).max(90),
  ballsDrawnCount: z.number().int(),
  phraseId: z.string(),  // host:speak fires separately but ball event includes phrase ID for sync
});
export type BallDrawnPayload = z.infer<typeof BallDrawnPayload>;

export const HostSpeakPayload = z.object({
  phraseId: z.string(),
  audioKey: z.string(), // e.g. "audio/num_51_1.mp3"
  text: z.string(),     // fallback text if audio fails
});
export type HostSpeakPayload = z.infer<typeof HostSpeakPayload>;

export const CouponAwardedPayload = z.object({
  playerCouponId: z.string().uuid(),
  merchantName: z.string(),
  offerDescription: z.string(),
  expiresAt: z.string().datetime(),
});
export type CouponAwardedPayload = z.infer<typeof CouponAwardedPayload>;
