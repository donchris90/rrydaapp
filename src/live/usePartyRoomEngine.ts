import { useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  FaceShapeArea,
  type IRtcEngine,
  type IRtcEngineEventHandler,
} from 'react-native-agora';
import { AGORA_APP_ID } from '../config';
import {
  type BeautyState,
  type FaceShapeState,
  type BackgroundState,
  DEFAULT_BEAUTY,
  DEFAULT_FACE_SHAPE,
  DEFAULT_BACKGROUND,
} from './useAgoraEngine';

// Agora numeric enum values — 4.6.4 does not expose these as runtime
// objects, only as types. Same constants useAgoraEngine already
// verified against the native SDK reference; duplicated here rather
// than exported+imported since they're internal implementation detail,
// not part of either hook's public shape.
const VBG_SOURCE_BLUR = 1;
const VBG_SOURCE_COLOR = 2;
const VBG_SOURCE_IMAGE = 3;
const BLUR_DEGREE_SMALL = 1;
const BLUR_DEGREE_LARGE = 2;
// The SDK's enableVirtualBackground takes a segmentation property as a
// REQUIRED third argument. It was being called with two, so the native side
// received `undefined` where it expects a struct. 1 = SegModelAi, the SDK's
// default all-scenario model; 0.5 is its documented default green capacity.
const VBG_SEGMENTATION = { modelType: 1, greenCapacity: 0.5 };
// The SDK's VirtualBackgroundSource uses snake_case field names and takes the
// colour as a NUMBER (0xRRGGBB), not a CSS string. The code below used
// camelCase names and a '#RRGGBB' string, which the native side silently
// ignores — so the virtual background was never actually applied.
const cssColorToInt = (hex: string): number => parseInt(hex.replace('#', ''), 16) || 0x1e1e2e;


export type RoomRole = 'host' | 'audience';

interface UsePartyRoomEngineParams {
  channelId: string;
  token: string;
  userAccount: string;
  role: RoomRole; // 'host' here means "holds a seat" (publisher), not literally the room's creator
  // Whether to publish camera video for this seat — the Video/Voice
  // choice made on the pre-party screen. Defaults to true so every
  // existing call site (which didn't have this concept) keeps its
  // current behavior unchanged.
  publishVideo?: boolean;
  // Set while a host/moderator has muted this guest. Forces the local mic
  // off (including on a freshly created engine after a rejoin) and makes
  // toggleMic a no-op until cleared. Unmuting deliberately does NOT reopen
  // the mic — the guest taps to speak when they're ready.
  forcedMuted?: boolean;
}

interface UsePartyRoomEngineResult {
  isJoined: boolean;
  // A room can have up to 8 simultaneous publishers (one per seat) —
  // unlike useAgoraEngine's single remoteUid, this is a real difference
  // in kind, not just a bigger number. A Set, not an array, since
  // Agora's onUserJoined/onUserOffline callbacks fire per-uid and a Set
  // makes "is this uid already known" and removal both O(1) without
  // manual dedup logic.
  remoteUids: Set<number>;
  // Agora's numeric uid has no inherent connection to this app's userId
  // strings — resolved via the SDK's real onUserInfoUpdated callback +
  // getUserInfoByUid (verified against the actual type definitions
  // before use), not guessed. Needed to match a video tile back to the
  // correct seat/display name.
  uidToUserAccount: Map<number, string>;
  error: string | null;
  isMicMuted: boolean;
  toggleMic: () => void;
  switchCamera: () => void;
  // Added on request — a seat that's actually publishing video can now
  // apply the same real beauty/face-shape/background effects
  // useAgoraEngine offers on Live, using the exact same Agora calls
  // (verified there already) rather than a second, different
  // implementation. Effects only apply while this seat is actually
  // publishing (role==='host' && publishVideo) — there is no camera
  // feed to apply them to otherwise, so the state exists but does
  // nothing silently rather than throwing.
  beauty: BeautyState;
  setBeauty: (next: Partial<BeautyState>) => void;
  faceShape: FaceShapeState;
  setFaceShape: (next: Partial<FaceShapeState>) => void;
  background: BackgroundState;
  setBackground: (next: Partial<BackgroundState>) => void;
}

export function usePartyRoomEngine({
  channelId,
  token,
  userAccount,
  role,
  publishVideo = true,
  forcedMuted = false,
}: UsePartyRoomEngineParams): UsePartyRoomEngineResult {
  const engineRef = useRef<IRtcEngine | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUids, setRemoteUids] = useState<Set<number>>(new Set());
  const [uidToUserAccount, setUidToUserAccount] = useState<Map<number, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [beauty, setBeautyState] = useState<BeautyState>(DEFAULT_BEAUTY);
  const [faceShape, setFaceShapeState] = useState<FaceShapeState>(DEFAULT_FACE_SHAPE);
  const [background, setBackgroundState] = useState<BackgroundState>(DEFAULT_BACKGROUND);

  const shouldApplyVisualEffects = role === 'host' && publishVideo;

  useEffect(() => {
    let cancelled = false;
    let handler: IRtcEngineEventHandler | null = null;

    const requestPermissions = async () => {
      if (role !== 'host' || Platform.OS !== 'android') return true;
      const permissions = publishVideo
        ? [PermissionsAndroid.PERMISSIONS.CAMERA, PermissionsAndroid.PERMISSIONS.RECORD_AUDIO]
        : [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
      const result = await PermissionsAndroid.requestMultiple(permissions);
      const micGranted = result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
      if (publishVideo) {
        const cameraGranted = result[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
        if (!cameraGranted) throw new Error('Camera permission was denied. Allow camera access in Android Settings and try again.');
      }
      if (!micGranted) throw new Error('Microphone permission was denied. Allow microphone access in Android Settings and try again.');
      return true;
    };

    const setup = async () => {
      if (!AGORA_APP_ID) {
        setError("Agora App ID is not configured — set app.json's expo.extra.agoraAppId");
        return;
      }
      if (!channelId || !token || !userAccount) return;

      try {
        await requestPermissions();
        if (cancelled) return;

        const engine = createAgoraRtcEngine();
        engineRef.current = engine;

        const eventHandler: IRtcEngineEventHandler = {
          onJoinChannelSuccess: () => setIsJoined(true),
          onUserJoined: (_connection, uid) => {
            setRemoteUids((current) => new Set(current).add(uid));
          },
          onUserOffline: (_connection, uid) => {
            setRemoteUids((current) => {
              const next = new Set(current);
              next.delete(uid);
              return next;
            });
            setUidToUserAccount((current) => {
              const next = new Map(current);
              next.delete(uid);
              return next;
            });
          },
          onUserInfoUpdated: (uid, info) => {
            if (info.userAccount) {
              setUidToUserAccount((current) => new Map(current).set(uid, info.userAccount!));
            }
          },
          onError: (err, msg) => setError(`Agora error ${err}: ${msg}`),
        };
        handler = eventHandler;
        engine.registerEventHandler(eventHandler);

        engine.initialize({
          appId: AGORA_APP_ID,
          channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
          autoRegisterAgoraExtensions: true,
        });

        // Video module is enabled regardless of role — unlike Live's
        // one-way broadcast, anyone in a room (seated or not) needs to be
        // able to *receive* video from whichever seats are currently
        // publishing, not just the local host.
        engine.enableVideo();

        if (role === 'host' && publishVideo) {
          engine.setCameraCapturerConfiguration({ format: { width: 640, height: 480, fps: 15 } });
        }

        if (cancelled) return;

        engine.joinChannelWithUserAccount(token, channelId, userAccount, {
          clientRoleType: role === 'host' ? ClientRoleType.ClientRoleBroadcaster : ClientRoleType.ClientRoleAudience,
          publishCameraTrack: role === 'host' && publishVideo,
          publishMicrophoneTrack: role === 'host',
        });
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Failed to set up audio/video');
      }
    };

    setup();

    return () => {
      cancelled = true;
      const engine = engineRef.current;
      if (engine) {
        try {
          if (shouldApplyVisualEffects) {
            engine.enableVirtualBackground(false, { background_source_type: VBG_SOURCE_BLUR, blur_degree: BLUR_DEGREE_LARGE }, VBG_SEGMENTATION);
            engine.setBeautyEffectOptions(false, { lighteningContrastLevel: 1, lighteningLevel: 0, smoothnessLevel: 0, rednessLevel: 0 });
          }
          engine.leaveChannel();
        } catch {}
        if (handler) engine.unregisterEventHandler(handler);
        engine.release();
      }
      engineRef.current = null;
      setIsJoined(false);
      setRemoteUids(new Set());
      setUidToUserAccount(new Map());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, token, userAccount, role, publishVideo]);

  // ── Apply beauty whenever state changes ────────────────────────────
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !shouldApplyVisualEffects) return;
    const result = engine.setBeautyEffectOptions(beauty.enabled, {
      lighteningContrastLevel: beauty.lighteningContrastLevel,
      lighteningLevel: beauty.lighteningLevel,
      smoothnessLevel: beauty.smoothnessLevel,
      rednessLevel: beauty.rednessLevel,
    });
    if (result !== 0) {
      console.warn(`[PartyRoom] setBeautyEffectOptions returned ${result} (non-zero = failure, see Agora error codes)`);
    }
  }, [beauty, shouldApplyVisualEffects]);

  // ── Apply face shaping whenever state changes ───────────────────────
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !shouldApplyVisualEffects) return;

    const styleResult = engine.setFaceShapeBeautyOptions(faceShape.enabled, {
      shapeStyle: 2, // FaceShapeBeautyStyleNatural
      styleIntensity: faceShape.enabled ? 50 : 0,
    });
    if (styleResult !== 0) {
      console.warn(`[PartyRoom] setFaceShapeBeautyOptions returned ${styleResult} (non-zero = failure — may need enabling as a value-added service on your Agora Console account)`);
    }
    if (!faceShape.enabled) return;

    const areas: [FaceShapeArea, number][] = [
      [FaceShapeArea.FaceShapeAreaEyescale, faceShape.eyes],
      [FaceShapeArea.FaceShapeAreaNosegeneral, faceShape.nose],
      [FaceShapeArea.FaceShapeAreaChin, faceShape.chin],
      [FaceShapeArea.FaceShapeAreaForehead, faceShape.forehead],
      [FaceShapeArea.FaceShapeAreaMouthlip, faceShape.lip],
    ];
    for (const [shapeArea, shapeIntensity] of areas) {
      engine.setFaceShapeAreaOptions({ shapeArea, shapeIntensity });
    }
  }, [faceShape, shouldApplyVisualEffects]);

  // ── Apply virtual background whenever state changes ────────────────
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !shouldApplyVisualEffects) return;

    if (background.mode === 'none') {
      engine.enableVirtualBackground(false, { background_source_type: VBG_SOURCE_BLUR, blur_degree: BLUR_DEGREE_LARGE }, VBG_SEGMENTATION);
      return;
    }

    let source: any;
    switch (background.mode) {
      case 'blur':
        source = { background_source_type: VBG_SOURCE_BLUR, blur_degree: background.blurDegree === 'small' ? BLUR_DEGREE_SMALL : BLUR_DEGREE_LARGE };
        break;
      case 'color':
        source = { background_source_type: VBG_SOURCE_COLOR, color: cssColorToInt(background.color ?? '#1E1E2E') };
        break;
      case 'image':
        source = { background_source_type: VBG_SOURCE_IMAGE, source: background.imagePath ?? '' };
        break;
    }
    engine.enableVirtualBackground(true, source, VBG_SEGMENTATION);
  }, [background, shouldApplyVisualEffects]);

  useEffect(() => {
    if (!forcedMuted) return;
    setIsMicMuted(true);
    engineRef.current?.muteLocalAudioStream(true);
  }, [forcedMuted, isJoined]);

  const toggleMic = () => {
    if (forcedMuted) return;
    setIsMicMuted((current) => {
      const next = !current;
      engineRef.current?.muteLocalAudioStream(next);
      return next;
    });
  };

  const switchCamera = () => {
    engineRef.current?.switchCamera();
  };

  const setBeauty = (next: Partial<BeautyState>) => setBeautyState((current) => ({ ...current, ...next }));
  const setFaceShape = (next: Partial<FaceShapeState>) => setFaceShapeState((current) => ({ ...current, ...next }));
  const setBackground = (next: Partial<BackgroundState>) => setBackgroundState((current) => ({ ...current, ...next }));

  return {
    isJoined,
    remoteUids,
    uidToUserAccount,
    error,
    isMicMuted,
    toggleMic,
    switchCamera,
    beauty,
    setBeauty,
    faceShape,
    setFaceShape,
    background,
    setBackground,
  };
}
