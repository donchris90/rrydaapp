import { useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  AudioAinsMode,
  FaceShapeArea,
  type IRtcEngine,
  type IRtcEngineEventHandler,
} from 'react-native-agora';
import { AGORA_APP_ID } from '../config';

export type AgoraRole = 'host' | 'audience';

// ── Beauty + background shape exposed to screens ──────────────────
export interface BeautyState {
  enabled: boolean;
  lighteningContrastLevel: number; // 0 = low, 1 = normal, 2 = high
  lighteningLevel: number;         // [0.0, 1.0] whitening
  smoothnessLevel: number;         // [0.0, 1.0] skin smoothing
  rednessLevel: number;            // [0.0, 1.0] rosy
}

// Face SHAPING (Eyes/Nose/Chin/Forehead/Lip) is a genuinely different
// Agora API from skin beautification above — setFaceShapeAreaOptions,
// not setBeautyEffectOptions. Real, verified against the actual SDK type
// definitions (FaceShapeArea enum values and their documented ranges),
// but worth being explicit about: the SDK's own docs mark face shaping
// as a "value-added service" with separate billing — this may need to
// be specifically enabled on the Agora Console account before it does
// anything visible at all, regardless of how correctly it's wired here.
export interface FaceShapeState {
  enabled: boolean;
  eyes: number;     // [0,100], default 50 — FaceShapeAreaEyescale
  nose: number;     // [-100,100], default 50 — FaceShapeAreaNosegeneral
  chin: number;     // [-100,100], default 0 — FaceShapeAreaChin
  forehead: number; // [0,100], default 0 — FaceShapeAreaForehead
  lip: number;      // [0,100], default 0 — FaceShapeAreaMouthlip
}

export type BackgroundMode = 'none' | 'blur' | 'color' | 'image';

export interface BackgroundState {
  mode: BackgroundMode;
  color?: string;
  imagePath?: string;
  blurDegree: 'small' | 'large';
}

export const DEFAULT_BEAUTY: BeautyState = {
  enabled: false,
  lighteningContrastLevel: 1,
  lighteningLevel: 0.7,
  smoothnessLevel: 0.5,
  rednessLevel: 0.1,
};

export const DEFAULT_FACE_SHAPE: FaceShapeState = {
  enabled: false,
  eyes: 50,
  nose: 50,
  chin: 0,
  forehead: 0,
  lip: 0,
};

export const DEFAULT_BACKGROUND: BackgroundState = {
  mode: 'none',
  blurDegree: 'large',
};

// Agora numeric enum values — 4.6.4 does not expose these as runtime
// objects, only as types. Confirmed against the native SDK reference.
const VBG_SOURCE_BLUR = 1;
const VBG_SOURCE_COLOR = 2;
const VBG_SOURCE_IMAGE = 3;
const BLUR_DEGREE_SMALL = 1;
const BLUR_DEGREE_LARGE = 2;

interface UseAgoraEngineParams {
  channelId: string;
  token: string;
  userAccount: string;
  role: AgoraRole;
}

interface UseAgoraEngineResult {
  isJoined: boolean;
  remoteUid: number | null;
  error: string | null;
  isMicMuted: boolean;
  toggleMic: () => void;
  switchCamera: () => void;
  isNoiseSuppressionOn: boolean;
  toggleNoiseSuppression: () => void;

  // Beauty + virtual background
  beauty: BeautyState;
  setBeauty: (next: Partial<BeautyState>) => void;
  background: BackgroundState;
  setBackground: (next: Partial<BackgroundState>) => void;
  faceShape: FaceShapeState;
  setFaceShape: (next: Partial<FaceShapeState>) => void;
}

export function useAgoraEngine({
  channelId,
  token,
  userAccount,
  role,
}: UseAgoraEngineParams): UseAgoraEngineResult {
  const engineRef = useRef<IRtcEngine | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isNoiseSuppressionOn, setIsNoiseSuppressionOn] = useState(false);
  const [engineReady, setEngineReady] = useState(false);

  const [beauty, setBeautyState] = useState<BeautyState>(DEFAULT_BEAUTY);
  const [background, setBackgroundState] = useState<BackgroundState>(DEFAULT_BACKGROUND);
  const [faceShape, setFaceShapeState] = useState<FaceShapeState>(DEFAULT_FACE_SHAPE);

  // Beauty + virtual background only make sense on the publishing side.
  const shouldApplyVisualEffects = role === 'host';

  useEffect(() => {
    let cancelled = false;
    let previewTimeout: ReturnType<typeof setTimeout> | undefined;
    let handler: IRtcEngineEventHandler | null = null;

    const requestCameraPermission = async () => {
      if (role !== 'host' || Platform.OS !== 'android') return true;

      const permissions = [
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ];

      const result = await PermissionsAndroid.requestMultiple(permissions);
      const cameraGranted = result[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
      const micGranted = result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;

      if (!cameraGranted) {
        throw new Error('Camera permission was denied. Allow camera access in Android Settings and try again.');
      }
      if (!micGranted) {
        throw new Error('Microphone permission was denied. Allow microphone access in Android Settings and try again.');
      }
      return true;
    };

    const setup = async () => {
      if (!AGORA_APP_ID) {
        setError("Agora App ID is not configured — set app.json's expo.extra.agoraAppId");
        return;
      }
      if (!userAccount) return;

      try {
        await requestCameraPermission();
        if (cancelled) return;

        const engine = createAgoraRtcEngine();
        engineRef.current = engine;

        const eventHandler: IRtcEngineEventHandler = {
          onJoinChannelSuccess: () => setIsJoined(true),
          onUserJoined: (_connection, uid) => setRemoteUid(uid),
          onUserOffline: (_connection, uid) => {
            setRemoteUid((current) => (current === uid ? null : current));
          },
          onError: (err, msg) => setError(`Agora error ${err}: ${msg}`),
          // These callbacks are deliberately diagnostic: a blank local
          // surface is usually caused by capture/permission failure, not
          // by the RtcSurfaceView itself.
          onLocalVideoStateChanged: (_source, state, reason) => {
            if (role !== 'host') return;
            console.log('[Agora] local video state:', state, 'reason:', reason);
            if (reason !== 0 && reason !== 1) {
              setError(`Camera capture error (state ${state}, reason ${reason}).`);
            }
          },
        };
        handler = eventHandler;
        engine.registerEventHandler(eventHandler);

        const initResult = engine.initialize({
          appId: AGORA_APP_ID,
          channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
          autoRegisterAgoraExtensions: true,
        });
        console.log('[Agora] initialize:', initResult);

        if (role === 'host') {
          const videoResult = engine.enableVideo();
          console.log('[Agora] enableVideo:', videoResult);

          // Keep capture conservative for devices whose camera HAL rejects
          // Agora's higher default resolutions.
          const configResult = engine.setCameraCapturerConfiguration({
            format: { width: 640, height: 480, fps: 15 },
          });
          console.log('[Agora] camera configuration:', configResult);

          // Do not put beauty/face shaping on the critical camera startup
          // path. Those are optional extensions and can return -1 without
          // preventing ordinary camera capture.
          previewTimeout = setTimeout(() => {
            if (cancelled || engineRef.current !== engine) return;
            const previewResult = engine.startPreview();
            console.log('[Agora] startPreview:', previewResult);
            if (previewResult !== 0) {
              setError(`Camera preview failed (Agora code ${previewResult}).`);
            }
          }, 150);
        } else {
          engine.enableVideo();
        }

        if (!cancelled) setEngineReady(true);
      } catch (e: any) {
        if (!cancelled) {
          setEngineReady(false);
          setError(e?.message ?? 'Unable to initialize the camera.');
        }
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (previewTimeout) clearTimeout(previewTimeout);
      const engine = engineRef.current;
      if (!engine) return;

      try {
        if (shouldApplyVisualEffects) {
          engine.enableVirtualBackground(false, {
            backgroundSourceType: VBG_SOURCE_BLUR,
            blurDegree: BLUR_DEGREE_LARGE,
          });
          engine.setBeautyEffectOptions(false, {
            lighteningContrastLevel: 1,
            lighteningLevel: 0,
            smoothnessLevel: 0,
            rednessLevel: 0,
          });
        }
        engine.stopPreview();
        engine.leaveChannel();
      } catch {}

      if (handler) engine.unregisterEventHandler(handler);
      engine.release();
      engineRef.current = null;
      setEngineReady(false);
      setIsJoined(false);
      setRemoteUid(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAccount, role]);

  // ── Join the channel once channelId/token become available ─────────
  // Deliberately a separate effect from engine creation above: engine
  // creation must NOT depend on channelId/token, or the preview-then-go-
  // live flow would tear down and recreate the engine (flickering the
  // camera, losing whatever beauty settings were being previewed) the
  // moment createLiveSession() finally produces a real channel. This
  // effect only ever calls a method on the already-existing engine —
  // it never creates or destroys one.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engineReady || !engine || !channelId || !token || !userAccount || isJoined) return;

    engine.joinChannelWithUserAccount(token, channelId, userAccount, {
      clientRoleType:
        role === 'host'
          ? ClientRoleType.ClientRoleBroadcaster
          : ClientRoleType.ClientRoleAudience,
      publishCameraTrack: role === 'host',
      publishMicrophoneTrack: role === 'host',
    });
  }, [channelId, token, userAccount, role, isJoined, engineReady]);

  // ── Apply beauty whenever state changes ────────────────────────────
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !shouldApplyVisualEffects) return;

    // setBeautyEffectOptions depends on a separate native extension
    // library (libagora_clear_vision_extension per the SDK's own docs)
    // and can return -4 ("device/feature not supported") silently — this
    // was never being checked, so if the call was failing, nothing would
    // ever surface it. Logging the return code to find out which case
    // this actually is before guessing further.
    const result = engine.setBeautyEffectOptions(beauty.enabled, {
      lighteningContrastLevel: beauty.lighteningContrastLevel,
      lighteningLevel: beauty.lighteningLevel,
      smoothnessLevel: beauty.smoothnessLevel,
      rednessLevel: beauty.rednessLevel,
    });
    if (result !== 0) {
      console.warn(`setBeautyEffectOptions returned ${result} (non-zero = failure, see Agora error codes)`);
    }
  }, [beauty, shouldApplyVisualEffects]);

  // ── Apply face shaping whenever state changes ───────────────────────
  // setFaceShapeAreaOptions fine-tunes individual areas, but per the
  // SDK's own docs it only has a visible effect once a baseline style is
  // active via setFaceShapeBeautyOptions — so enabling any area here
  // also turns on a neutral baseline style (Natural, mid intensity) for
  // the area adjustments to actually apply on top of.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !shouldApplyVisualEffects) return;

    const styleResult = engine.setFaceShapeBeautyOptions(faceShape.enabled, {
      shapeStyle: 2, // FaceShapeBeautyStyleNatural — minimal adjustment beyond the explicit area values below
      styleIntensity: faceShape.enabled ? 50 : 0,
    });
    if (styleResult !== 0) {
      console.warn(`setFaceShapeBeautyOptions returned ${styleResult} (non-zero = failure — if this is -4 or similar, face shaping may need enabling as a value-added service on your Agora Console account, separate from anything in this code)`);
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
      engine.enableVirtualBackground(false, {
        backgroundSourceType: VBG_SOURCE_BLUR,
        blurDegree: BLUR_DEGREE_LARGE,
      });
      return;
    }

    let source: any;
    switch (background.mode) {
      case 'blur':
        source = {
          backgroundSourceType: VBG_SOURCE_BLUR,
          blurDegree:
            background.blurDegree === 'small'
              ? BLUR_DEGREE_SMALL
              : BLUR_DEGREE_LARGE,
        };
        break;
      case 'color':
        source = {
          backgroundSourceType: VBG_SOURCE_COLOR,
          color: background.color ?? '#1E1E2E',
        };
        break;
      case 'image':
        source = {
          backgroundSourceType: VBG_SOURCE_IMAGE,
          source: background.imagePath ?? '',
        };
        break;
    }

    engine.enableVirtualBackground(true, source);
  }, [background, shouldApplyVisualEffects]);

  const setBeauty = (next: Partial<BeautyState>) => {
    setBeautyState((current) => ({ ...current, ...next }));
  };

  const setBackground = (next: Partial<BackgroundState>) => {
    setBackgroundState((current) => ({ ...current, ...next }));
  };

  const setFaceShape = (next: Partial<FaceShapeState>) => {
    setFaceShapeState((current) => ({ ...current, ...next }));
  };

  const toggleMic = () => {
    setIsMicMuted((current) => {
      const next = !current;
      engineRef.current?.muteLocalAudioStream(next);
      return next;
    });
  };

  const switchCamera = () => {
    engineRef.current?.switchCamera();
  };

  const toggleNoiseSuppression = () => {
    setIsNoiseSuppressionOn((current) => {
      const next = !current;
      engineRef.current?.setAINSMode(next, AudioAinsMode.AinsModeBalanced);
      return next;
    });
  };

  return {
    isJoined,
    remoteUid,
    error,
    // Exposed so the screen can key its AgoraVideoView off this — a
    // SurfaceView created before it has real, laid-out dimensions is a
    // well-known class of Android bug where the surface can permanently
    // fail to bind properly, even if the view is later resized. Since
    // the diagnostic logging now shows capture genuinely succeeding
    // (state 1, reason 0 — actively capturing) while the screen still
    // shows blank, the fault has narrowed specifically to rendering,
    // not capture — this is the most likely remaining explanation and a
    // cheap, real thing to test: force a fresh SurfaceView only once the
    // engine (and by extension, the screen's layout) is confirmed ready,
    // rather than whatever moment React happens to mount it.
    engineReady,
    isMicMuted,
    toggleMic,
    switchCamera,
    isNoiseSuppressionOn,
    toggleNoiseSuppression,
    beauty,
    setBeauty,
    background,
    setBackground,
    faceShape,
    setFaceShape,
  };
}