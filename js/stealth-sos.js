/**
 * SOS Vietnam 2026 — Citizen Web Emergency Camouflage (Stealth Mode & iOS Fake Call)
 *
 * Implements Hang muc 5 from the Hybrid Web3 & Stealth SOS Technical Specification:
 *  - 5.1 Fake Incoming Call (iOS UI):
 *      * 3-second cancellable countdown -> Fullscreen + iPhone ringtone + vibration
 *      * Editable caller identity (default "Ba", persisted in localStorage)
 *      * Green "Tra loi" button -> Active call timer (00:01...), 6 round iOS keypad buttons,
 *        Screen WakeLock, Vietnamese speechSynthesis voice reassurance,
 *        "Danh ba" proximity-sensor pitch-black (#000000) cover,
 *        and 3-consecutive-tap Red Hangup anti-attacker exit guard.
 *  - 5.2 Blackout Stealth Mode:
 *      * Pitch-black (#000000, 100vw x 100vh, z-index: 999999) screen-off illusion + WakeLock
 *      * 4-consecutive-tap anti-attacker unlock guard.
 *  - Covert Forensics Pipeline (active in BOTH modes):
 *      * Silent SOS creation (or attachment to active SOS) with zero visible alerts/popups
 *      * Standalone 5000ms MediaRecorder segments -> Browser WebCrypto SHA-256 digest ->
 *        multipart upload to POST /api/sos/upload-evidence (sealing 2_EVIDENCE_SEAL blocks)
 *      * Continuous GPS telemetry via navigator.geolocation.watchPosition -> POST /api/sos/stealth-gps
 */

const IS_PRODUCTION = typeof window !== 'undefined' &&
  (window.location.hostname === 'sosvie.site' || window.location.hostname === 'www.sosvie.site');

export const SYSTEM_CONFIG = Object.freeze({
  isProduction: IS_PRODUCTION,
  envName: IS_PRODUCTION
    ? 'HỆ THỐNG CHÍNH THỨC (PRODUCTION)'
    : 'MÔI TRƯỜNG THỬ NGHIỆM (TEST SANDBOX)',
  chainId: IS_PRODUCTION ? 842026 : 84202600,
  canonicalChainId: 842026,
  storageFolder: IS_PRODUCTION ? 'SOS_VIETNAM_OFFICIAL' : 'SOS_RENDER_SANDBOX'
});

const CALLER_NAME_STORAGE_KEY = 'sos_stealth_fake_caller_name_v1';
const SEGMENT_DURATION_MS = 5000;
const HANGUP_REQUIRED_TAPS = 3;
const HANGUP_TAP_WINDOW_MS = 2000;
const BLACKOUT_REQUIRED_TAPS = 4;
const BLACKOUT_TAP_WINDOW_MS = 2400;

function bytesToPrefixedHex(buffer) {
  const bytes = new Uint8Array(buffer);
  let out = '0x';
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

function formatCallDuration(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function negotiateAudioMimeType() {
  if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') {
    return { mimeType: '', ext: 'webm' };
  }
  const candidates = [
    { mimeType: 'audio/webm;codecs=opus', ext: 'webm' },
    { mimeType: 'audio/webm', ext: 'webm' },
    { mimeType: 'audio/mp4', ext: 'm4a' },
    { mimeType: 'audio/ogg;codecs=opus', ext: 'ogg' }
  ];
  for (const item of candidates) {
    try {
      if (!window.MediaRecorder.isTypeSupported || window.MediaRecorder.isTypeSupported(item.mimeType)) {
        return item;
      }
    } catch (_) {
      // Ignore unsupported mime check errors on older WebViews
    }
  }
  return { mimeType: '', ext: 'webm' };
}

export function initStealthSOS(app) {
  if (!app || typeof document === 'undefined') return null;
  if (window.__sosStealthController) return window.__sosStealthController;

  const state = {
    active: false,
    mode: null, // 'FAKE_IOS_CALL' | 'BLACKOUT_SCREEN'
    callPhase: 'idle', // 'idle' | 'countdown' | 'incoming' | 'active'
    proximityBlackout: false,
    callerName: (localStorage.getItem(CALLER_NAME_STORAGE_KEY) || 'Ba').trim() || 'Ba',
    countdownTimer: null,
    countdownRemaining: 0,
    callSeconds: 0,
    callDurationTimer: null,
    vibrationTimer: null,
    ringtoneAudioCtx: null,
    ringtoneSynthTimer: null,
    mediaStream: null,
    syntheticAudioCtx: null,
    currentRecorder: null,
    segmentTimer: null,
    chunkIndex: 0,
    chunksUploaded: 0,
    gpsWatchId: null,
    gpsHeartbeatTimer: null,
    wakeLockSentinel: null,
    incidentPromise: null,
    redTapCount: 0,
    redLastTapAt: 0,
    blackoutTapCount: 0,
    blackoutLastTapAt: 0,
    proximityTapCount: 0,
    proximityLastTapAt: 0,
    lastEvidenceReceipt: null
  };

  // Expose non-sensitive telemetry for diagnostics and Playwright E2E verification
  const syncWindowStats = () => {
    window.__sosStealthActive = state.active;
    window.__sosStealthStats = {
      active: state.active,
      mode: state.mode,
      callPhase: state.callPhase,
      proximityBlackout: state.proximityBlackout,
      callerName: state.callerName,
      incidentId: app.activeIncident?.id || null,
      chunkIndex: state.chunkIndex,
      chunksUploaded: state.chunksUploaded,
      redTapCount: state.redTapCount,
      blackoutTapCount: state.blackoutTapCount,
      lastEvidenceReceipt: state.lastEvidenceReceipt,
      systemConfig: SYSTEM_CONFIG
    };
  };
  syncWindowStats();

  // Suppress audible SOS message chimes or incoming dispatcher call popups while victim is in Stealth Camouflage
  if (typeof app.playMessageTing === 'function' && !app.__stealthWrappedTing) {
    const origTing = app.playMessageTing.bind(app);
    app.playMessageTing = (...args) => {
      if (window.__sosStealthActive) return;
      return origTing(...args);
    };
    app.__stealthWrappedTing = true;
  }
  if (typeof app.handleVideoCallSignal === 'function' && !app.__stealthWrappedCallSignal) {
    const origSignal = app.handleVideoCallSignal.bind(app);
    app.handleVideoCallSignal = (signal, ...rest) => {
      if (window.__sosStealthActive && signal && signal.action === 'request') {
        // Silently avoid blowing the victim's cover with a dispatcher ringing popup
        return;
      }
      return origSignal(signal, ...rest);
    };
    app.__stealthWrappedCallSignal = true;
  }

  // DOM References
  const btnFakeCall = document.getElementById('btnFakeIncomingCall');
  const btnEditCaller = document.getElementById('btnEditFakeCaller');
  const callerNameBadge = document.getElementById('stealthCallerNameLabel');
  const btnBlackout = document.getElementById('btnBlackoutStealth');
  const btnTrackingFakeCall = document.getElementById('btnTrackingFakeCall');
  const btnTrackingBlackout = document.getElementById('btnTrackingBlackout');
  const countdownBanner = document.getElementById('stealthCountdownBanner');
  const countdownSecEl = document.getElementById('stealthCountdownSeconds');
  const btnCancelCountdown = document.getElementById('btnCancelStealthCountdown');

  const iosOverlay = document.getElementById('iosFakeCallOverlay');
  const iosIncomingScreen = document.getElementById('iosIncomingCallScreen');
  const iosActiveScreen = document.getElementById('iosActiveCallScreen');
  const iosCallerNameEls = document.querySelectorAll('.js-ios-caller-name');
  const iosCallTimerEl = document.getElementById('iosCallTimer');
  const btnIosAnswer = document.getElementById('btnIosAnswerCall');
  const btnIosDecline = document.getElementById('btnIosDeclineCall');
  const btnIosHangup = document.getElementById('btnIosHangupCall');
  const btnIosContactsProximity = document.getElementById('btnIosContactsProximity');
  const iosProximityBlackout = document.getElementById('iosProximityBlackout');
  const iosKeypadSheet = document.getElementById('iosDtmfSheet');
  const btnIosKeypad = document.getElementById('btnIosKeypad');
  const btnIosHideKeypad = document.getElementById('btnIosHideKeypad');

  const blackoutOverlay = document.getElementById('blackoutStealthOverlay');
  const sfxIncomingCall = document.getElementById('sfxIncomingCall');

  const updateCallerLabels = (name) => {
    const clean = String(name || '').trim().slice(0, 28) || 'Ba';
    state.callerName = clean;
    try {
      localStorage.setItem(CALLER_NAME_STORAGE_KEY, clean);
    } catch (_) {}
    if (callerNameBadge) callerNameBadge.textContent = clean;
    iosCallerNameEls.forEach((el) => {
      el.textContent = clean;
    });
    syncWindowStats();
  };
  updateCallerLabels(state.callerName);

  // Best-effort Screen WakeLock
  const acquireWakeLock = async () => {
    try {
      if (navigator.wakeLock && typeof navigator.wakeLock.request === 'function') {
        if (state.wakeLockSentinel) {
          try { await state.wakeLockSentinel.release(); } catch (_) {}
        }
        state.wakeLockSentinel = await navigator.wakeLock.request('screen');
      }
    } catch (_) {
      // Non-blocking on browsers/HTTP contexts without WakeLock permission
    }
  };

  const releaseWakeLock = async () => {
    if (state.wakeLockSentinel) {
      try {
        await state.wakeLockSentinel.release();
      } catch (_) {}
      state.wakeLockSentinel = null;
    }
  };

  const tryEnterFullscreen = () => {
    try {
      const root = document.documentElement;
      if (!document.fullscreenElement && root.requestFullscreen) {
        root.requestFullscreen().catch(() => {});
      } else if (!document.webkitFullscreenElement && root.webkitRequestFullscreen) {
        root.webkitRequestFullscreen();
      }
    } catch (_) {}
  };

  const tryExitFullscreen = () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } catch (_) {}
  };

  // Ringtone + WebAudio Marimba Fallback + Vibration
  const startIncomingRingtoneAndVibration = () => {
    stopIncomingRingtoneAndVibration();
    try {
      if (navigator.vibrate) {
        navigator.vibrate([850, 400, 850, 400, 850]);
        state.vibrationTimer = setInterval(() => {
          if (state.active && state.callPhase === 'incoming') {
            try { navigator.vibrate([850, 400, 850]); } catch (_) {}
          }
        }, 2600);
      }
    } catch (_) {}

    let htmlAudioPlaying = false;
    if (sfxIncomingCall) {
      try {
        sfxIncomingCall.currentTime = 0;
        sfxIncomingCall.loop = true;
        sfxIncomingCall.volume = 1.0;
        const p = sfxIncomingCall.play();
        if (p && typeof p.then === 'function') {
          p.then(() => { htmlAudioPlaying = true; }).catch(() => {
            startSynthMarimbaRingtone();
          });
        } else {
          htmlAudioPlaying = true;
        }
      } catch (_) {
        startSynthMarimbaRingtone();
      }
    } else if (!htmlAudioPlaying) {
      startSynthMarimbaRingtone();
    }
  };

  const startSynthMarimbaRingtone = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx || state.ringtoneAudioCtx) return;
      const ctx = new AudioCtx();
      state.ringtoneAudioCtx = ctx;
      const notes = [587.33, 659.25, 880.0, 987.77, 880.0, 659.25];
      const playPhrase = () => {
        if (!state.ringtoneAudioCtx || state.callPhase !== 'incoming') return;
        const base = ctx.currentTime + 0.02;
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, base + idx * 0.17);
          gain.gain.setValueAtTime(0.0001, base + idx * 0.17);
          gain.gain.exponentialRampToValueAtTime(0.16, base + idx * 0.17 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, base + idx * 0.17 + 0.24);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(base + idx * 0.17);
          osc.stop(base + idx * 0.17 + 0.25);
        });
      };
      playPhrase();
      state.ringtoneSynthTimer = setInterval(playPhrase, 2200);
    } catch (_) {}
  };

  const stopIncomingRingtoneAndVibration = () => {
    if (state.vibrationTimer) {
      clearInterval(state.vibrationTimer);
      state.vibrationTimer = null;
    }
    try { navigator.vibrate?.(0); } catch (_) {}
    if (sfxIncomingCall) {
      try {
        sfxIncomingCall.pause();
        sfxIncomingCall.currentTime = 0;
      } catch (_) {}
    }
    if (state.ringtoneSynthTimer) {
      clearInterval(state.ringtoneSynthTimer);
      state.ringtoneSynthTimer = null;
    }
    if (state.ringtoneAudioCtx) {
      try { state.ringtoneAudioCtx.close(); } catch (_) {}
      state.ringtoneAudioCtx = null;
    }
  };

  // Vietnamese reassurance voice when citizen taps Green "Tra loi"
  const playReassuranceCallerVoice = () => {
    const line = 'Alo, con đang ở đâu đó? Bố đang ra đón đây, bật định vị lên nhé.';
    try {
      if ('speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function') {
        window.speechSynthesis.cancel();
        const utter = new window.SpeechSynthesisUtterance(line);
        utter.lang = 'vi-VN';
        utter.rate = 0.96;
        utter.pitch = 0.9;
        utter.volume = 1.0;
        const voices = window.speechSynthesis.getVoices?.() || [];
        const viVoice = voices.find((v) => /vi(-|_|$)/i.test(v.lang)) || null;
        if (viVoice) utter.voice = viVoice;
        window.speechSynthesis.speak(utter);
      }
    } catch (_) {}
  };

  // Resolve current GPS coordinates silently without blocking SOS creation
  const resolveSilentCoordinates = async () => {
    const loc = app.locationService;
    if (loc?.currentCoords && Number.isFinite(loc.currentCoords.lat) && Number.isFinite(loc.currentCoords.lng)) {
      return {
        lat: loc.currentCoords.lat,
        lng: loc.currentCoords.lng,
        accuracy: Number(loc.accuracy || 15),
        address: loc.currentAddress || 'Tọa độ GPS vệ tinh ngụy trang khẩn cấp'
      };
    }
    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 2400,
            maximumAge: 30000
          });
        });
        return {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 15),
          address: loc?.currentAddress || `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`
        };
      } catch (_) {}
    }
    // Fallback to Can Tho / Vietnam center if browser denies geolocation so emergency covert SOS still dispatches
    return {
      lat: 10.0342,
      lng: 105.7834,
      accuracy: 50,
      address: 'Định vị khẩn cấp (Chế độ ngụy trang bảo vệ nạn nhân)'
    };
  };

  const getCitizenTokenForIncident = (incidentId) => {
    if (app.citizenAccessToken && app.activeIncident?.id === incidentId) {
      return app.citizenAccessToken;
    }
    try {
      const key = typeof app.getCitizenTokenKey === 'function'
        ? app.getCitizenTokenKey(incidentId)
        : `citizen_sos_token_${incidentId}`;
      return sessionStorage.getItem(key) || '';
    } catch (_) {
      return '';
    }
  };

  // Covert SOS creation or reuse of existing active SOS
  const ensureCovertIncident = (stealthMode) => {
    if (state.incidentPromise) return state.incidentPromise;

    state.incidentPromise = (async () => {
      if (app.activeIncident?.id && app.activeIncident.status !== 'resolved') {
        const existingId = app.activeIncident.id;
        const existingToken = getCitizenTokenForIncident(existingId);
        const coords = await resolveSilentCoordinates();
        sendStealthGpsPing(existingId, existingToken, coords, stealthMode, true).catch(() => {});
        syncWindowStats();
        return { incidentId: existingId, accessToken: existingToken };
      }

      const coords = await resolveSilentCoordinates();
      const modeTag = stealthMode === 'FAKE_IOS_CALL'
        ? '📞 Ngụy trang Cuộc gọi đến iOS'
        : '🌑 Ngụy trang Tắt màn hình (Blackout)';

      const payload = {
        agency: 'police',
        subType: 'stealth_emergency',
        lat: coords.lat,
        lng: coords.lng,
        accuracy: coords.accuracy,
        address: coords.address,
        isStealthSos: true,
        stealthMode,
        cannotSpeak: true,
        incidentTags: [
          modeTag,
          'Không thể nói chuyện — Thu âm chứng cứ 5s/lần (SHA-256)'
        ],
        note: stealthMode === 'FAKE_IOS_CALL'
          ? `[NGỤY TRANG CUỘC GỌI ĐẾN iOS - "${state.callerName}"] Nạn nhân đang đối mặt trực tiếp mối đe dọa, không thể nói chuyện công khai. Hệ thống tự động thu âm hiện trường 5 giây/lần niêm phong SHA-256.`
          : '[NGỤY TRANG TẮT MÀN HÌNH BLACKOUT] Nạn nhân kích hoạt màn hình đen ngụy trang khẩn cấp. Hệ thống tự động thu âm hiện trường 5 giây/lần niêm phong SHA-256 và bám sát GPS.'
      };

      const res = await fetch('/api/sos/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data || !data.ok || !data.incident?.id) {
        throw new Error(data?.error || 'Không thể khởi tạo phiên SOS ngụy trang');
      }

      const token = data.citizenAccessToken || '';
      if (token) {
        app.citizenAccessToken = token;
        try {
          const tokenKey = typeof app.getCitizenTokenKey === 'function'
            ? app.getCitizenTokenKey(data.incident.id)
            : `citizen_sos_token_${data.incident.id}`;
          sessionStorage.setItem(tokenKey, token);
        } catch (_) {}
      }

      // Silently prepare tracking view underneath the fullscreen Stealth overlay
      try {
        app.startTracking(data.incident);
      } catch (_) {
        app.activeIncident = data.incident;
      }
      syncWindowStats();
      return { incidentId: data.incident.id, accessToken: token };
    })().catch((err) => {
      console.warn('[STEALTH-SOS] Silent SOS init warning:', err.message);
      state.incidentPromise = null;
      return null;
    });

    return state.incidentPromise;
  };

  const sendStealthGpsPing = async (incidentId, accessToken, coords, stealthMode, stealthActive = true) => {
    if (!incidentId) return;
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) headers['X-SOS-Access-Token'] = accessToken;
    await fetch('/api/sos/stealth-gps', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        incidentId,
        accessToken,
        lat: coords.lat,
        lng: coords.lng,
        accuracy: coords.accuracy,
        stealthMode,
        stealthActive
      })
    });
  };

  const startStealthGpsWatch = (stealthMode) => {
    stopStealthGpsWatch();
    if (navigator.geolocation && typeof navigator.geolocation.watchPosition === 'function') {
      try {
        state.gpsWatchId = navigator.geolocation.watchPosition(
          async (pos) => {
            if (!state.active) return;
            const ctx = await ensureCovertIncident(stealthMode);
            if (!ctx?.incidentId) return;
            sendStealthGpsPing(
              ctx.incidentId,
              ctx.accessToken,
              {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: Math.round(pos.coords.accuracy || 15)
              },
              stealthMode,
              true
            ).catch(() => {});
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
      } catch (_) {}
    }

    // Periodic heartbeat every 10s even if stationary
    state.gpsHeartbeatTimer = setInterval(async () => {
      if (!state.active) return;
      const ctx = await ensureCovertIncident(stealthMode);
      if (!ctx?.incidentId) return;
      const coords = await resolveSilentCoordinates();
      sendStealthGpsPing(ctx.incidentId, ctx.accessToken, coords, stealthMode, true).catch(() => {});
    }, 10000);
  };

  const stopStealthGpsWatch = () => {
    if (state.gpsWatchId !== null && navigator.geolocation) {
      try { navigator.geolocation.clearWatch(state.gpsWatchId); } catch (_) {}
      state.gpsWatchId = null;
    }
    if (state.gpsHeartbeatTimer) {
      clearInterval(state.gpsHeartbeatTimer);
      state.gpsHeartbeatTimer = null;
    }
  };

  // Upload a standalone 5-second audio Blob with pre-computed WebCrypto SHA-256
  const hashAndUploadEvidenceSegment = async (blob, ext, chunkIdx, durationMs, stealthMode) => {
    if (!blob || blob.size === 0) return;
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const digestBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const clientSha256 = bytesToPrefixedHex(digestBuffer);

      const ctx = await ensureCovertIncident(stealthMode);
      if (!ctx?.incidentId) return;

      const coords = await resolveSilentCoordinates();
      const fileName = `stealth_${ctx.incidentId}_seg${String(chunkIdx).padStart(3, '0')}.${ext}`;
      const formData = new FormData();
      formData.append('file', blob, fileName);
      formData.append('incidentId', ctx.incidentId);
      if (ctx.accessToken) formData.append('accessToken', ctx.accessToken);
      formData.append('clientSha256', clientSha256);
      formData.append('lat', String(coords.lat));
      formData.append('lng', String(coords.lng));
      formData.append('accuracy', String(coords.accuracy || 15));
      formData.append('stealthMode', stealthMode);
      formData.append('chunkIndex', String(chunkIdx));
      formData.append('durationMs', String(durationMs));

      const headers = {};
      if (ctx.accessToken) headers['X-SOS-Access-Token'] = ctx.accessToken;

      const res = await fetch('/api/sos/upload-evidence', {
        method: 'POST',
        headers,
        body: formData
      });
      const json = await res.json();
      if (json && json.ok) {
        state.chunksUploaded += 1;
        state.lastEvidenceReceipt = {
          evidenceId: json.evidenceId,
          sha256Hash: json.sha256Hash,
          clientSha256,
          clientHashMatched: json.clientHashMatched,
          blockNumber: json.blockNumber,
          txHash: json.txHash,
          storageProvider: json.storageProvider,
          storageFolder: json.storageFolder,
          mediaUrl: json.mediaUrl
        };
        syncWindowStats();
      }
    } catch (err) {
      console.warn('[STEALTH-SOS] Evidence chunk upload warning:', err.message);
    }
  };

  // Acquire microphone stream (with clean WebAudio fallback ONLY if hardware mic is absent)
  const acquireAudioStream = async () => {
    if (state.mediaStream && state.mediaStream.active) return state.mediaStream;
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        });
        state.mediaStream = stream;
        return stream;
      } catch (err) {
        console.warn('[STEALTH-SOS] Microphone fallback notice:', err.message);
      }
    }
    // Fallback stream only when device has no physical mic or permission is unavailable
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      state.syntheticAudioCtx = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 440;
      gain.gain.value = 0.002;
      const dest = ctx.createMediaStreamDestination();
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      state.mediaStream = dest.stream;
      return dest.stream;
    }
    return null;
  };

  // Standalone 5000ms segment recorder so EVERY 5s clip has complete WebM/MP4 headers & standalone SHA-256
  const startStealthEvidenceLoop = async (stealthMode) => {
    if ( typeof window.MediaRecorder === 'undefined') return;
    const stream = await acquireAudioStream();
    if (!stream || !state.active) return;

    const { mimeType, ext } = negotiateAudioMimeType();

    const recordOneSegment = () => {
      if (!state.active || !state.mediaStream || !state.mediaStream.active) return;
      state.chunkIndex += 1;
      const segIndex = state.chunkIndex;
      const segStartedAt = Date.now();
      const parts = [];
      let recorder;
      try {
        recorder = mimeType
          ? new MediaRecorder(state.mediaStream, { mimeType, audioBitsPerSecond: 64000 })
          : new MediaRecorder(state.mediaStream);
      } catch (_) {
        recorder = new MediaRecorder(state.mediaStream);
      }
      state.currentRecorder = recorder;
      syncWindowStats();

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) parts.push(ev.data);
      };

      recorder.onstop = () => {
        const elapsedMs = Math.max(500, Date.now() - segStartedAt);
        // Immediately spin up next 5s segment before uploading so zero gap occurs
        if (state.active) {
          recordOneSegment();
        }
        if (parts.length > 0 && elapsedMs >= 650) {
          const finalType = recorder.mimeType || mimeType || 'audio/webm';
          const blob = new Blob(parts, { type: finalType });
          hashAndUploadEvidenceSegment(blob, ext, segIndex, elapsedMs, stealthMode);
        }
      };

      try {
        recorder.start();
        state.segmentTimer = setTimeout(() => {
          if (recorder && recorder.state === 'recording') {
            try { recorder.stop(); } catch (_) {}
          }
        }, SEGMENT_DURATION_MS);
      } catch (err) {
        console.warn('[STEALTH-SOS] MediaRecorder start error:', err.message);
      }
    };

    recordOneSegment();
  };

  const stopStealthEvidenceLoop = () => {
    if (state.segmentTimer) {
      clearTimeout(state.segmentTimer);
      state.segmentTimer = null;
    }
    if (state.currentRecorder && state.currentRecorder.state === 'recording') {
      try { state.currentRecorder.stop(); } catch (_) {}
    }
    state.currentRecorder = null;
    if (state.mediaStream) {
      try {
        state.mediaStream.getTracks().forEach((t) => t.stop());
      } catch (_) {}
      state.mediaStream = null;
    }
    if (state.syntheticAudioCtx) {
      try { state.syntheticAudioCtx.close(); } catch (_) {}
      state.syntheticAudioCtx = null;
    }
  };

  // -------------------------------------------------------------------------
  // 5.1 FAKE INCOMING CALL (iOS UI) FLOW
  // -------------------------------------------------------------------------
  const cancelFakeCallCountdown = () => {
    if (state.countdownTimer) {
      clearInterval(state.countdownTimer);
      state.countdownTimer = null;
    }
    state.countdownRemaining = 0;
    if (state.callPhase === 'countdown') state.callPhase = 'idle';
    if (countdownBanner) countdownBanner.hidden = true;
    syncWindowStats();
  };

  const triggerFakeCallCountdown = (delaySeconds = 3) => {
    if (state.active) return;
    cancelFakeCallCountdown();
    state.callPhase = 'countdown';
    state.countdownRemaining = delaySeconds;
    if (countdownSecEl) countdownSecEl.textContent = String(state.countdownRemaining);
    if (countdownBanner) countdownBanner.hidden = false;
    syncWindowStats();

    state.countdownTimer = setInterval(() => {
      state.countdownRemaining -= 1;
      if (state.countdownRemaining <= 0) {
        cancelFakeCallCountdown();
        launchIosFakeIncomingCall();
      } else if (countdownSecEl) {
        countdownSecEl.textContent = String(state.countdownRemaining);
      }
    }, 1000);
  };

  const launchIosFakeIncomingCall = () => {
    state.active = true;
    state.mode = 'FAKE_IOS_CALL';
    state.callPhase = 'incoming';
    state.proximityBlackout = false;
    state.redTapCount = 0;
    state.callSeconds = 0;
    document.body.classList.add('sos-stealth-camo-active');

    if (iosOverlay) {
      iosOverlay.hidden = false;
      iosOverlay.classList.add('is-active');
      iosOverlay.setAttribute('data-call-phase', 'incoming');
    }
    if (iosIncomingScreen) iosIncomingScreen.hidden = false;
    if (iosActiveScreen) iosActiveScreen.hidden = true;
    if (iosProximityBlackout) iosProximityBlackout.hidden = true;
    if (iosKeypadSheet) iosKeypadSheet.hidden = true;

    tryEnterFullscreen();
    acquireWakeLock();
    startIncomingRingtoneAndVibration();

    // Start covert SOS + 5s SHA-256 audio sealing + GPS tracking immediately
    state.incidentPromise = null;
    ensureCovertIncident('FAKE_IOS_CALL');
    startStealthEvidenceLoop('FAKE_IOS_CALL');
    startStealthGpsWatch('FAKE_IOS_CALL');
    syncWindowStats();
  };

  const answerIosFakeCall = () => {
    if (!state.active || state.mode !== 'FAKE_IOS_CALL') return;
    stopIncomingRingtoneAndVibration();
    state.callPhase = 'active';
    state.callSeconds = 1;
    if (iosOverlay) iosOverlay.setAttribute('data-call-phase', 'active');
    if (iosIncomingScreen) iosIncomingScreen.hidden = true;
    if (iosActiveScreen) iosActiveScreen.hidden = false;
    if (iosCallTimerEl) iosCallTimerEl.textContent = formatCallDuration(state.callSeconds);

    tryEnterFullscreen();
    acquireWakeLock();

    if (state.callDurationTimer) clearInterval(state.callDurationTimer);
    state.callDurationTimer = setInterval(() => {
      state.callSeconds += 1;
      if (iosCallTimerEl) iosCallTimerEl.textContent = formatCallDuration(state.callSeconds);
    }, 1000);

    setTimeout(() => {
      if (state.active && state.callPhase === 'active') {
        playReassuranceCallerVoice();
      }
    }, 550);
    syncWindowStats();
  };

  // 3-Tap Red Hangup Guard (prevents attacker from closing Fake Call with 1 or 2 taps)
  const handleIosRedHangupTap = (ev) => {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    const now = Date.now();
    if (now - state.redLastTapAt <= HANGUP_TAP_WINDOW_MS) {
      state.redTapCount += 1;
    } else {
      state.redTapCount = 1;
    }
    state.redLastTapAt = now;
    syncWindowStats();

    if (state.redTapCount >= HANGUP_REQUIRED_TAPS) {
      exitStealthMode();
    }
  };

  // "Danh ba" Proximity Sensor Blackout (#000000)
  const activateProximityBlackout = (ev) => {
    if (ev) ev.preventDefault();
    if (!state.active || state.mode !== 'FAKE_IOS_CALL') return;
    state.proximityBlackout = true;
    state.proximityTapCount = 0;
    if (iosProximityBlackout) iosProximityBlackout.hidden = false;
    syncWindowStats();
  };

  const handleProximityBlackoutTap = (ev) => {
    if (ev) ev.preventDefault();
    const now = Date.now();
    if (now - state.proximityLastTapAt <= 900) {
      state.proximityTapCount += 1;
    } else {
      state.proximityTapCount = 1;
    }
    state.proximityLastTapAt = now;
    if (state.proximityTapCount >= 2) {
      state.proximityBlackout = false;
      state.proximityTapCount = 0;
      if (iosProximityBlackout) iosProximityBlackout.hidden = true;
      syncWindowStats();
    }
  };

  // -------------------------------------------------------------------------
  // 5.2 BLACKOUT STEALTH MODE (SCREEN-OFF ILLUSION) FLOW
  // -------------------------------------------------------------------------
  const launchBlackoutStealthMode = () => {
    cancelFakeCallCountdown();
    stopIncomingRingtoneAndVibration();
    state.active = true;
    state.mode = 'BLACKOUT_SCREEN';
    state.callPhase = 'idle';
    state.blackoutTapCount = 0;
    state.blackoutLastTapAt = 0;
    document.body.classList.add('sos-stealth-camo-active');

    if (blackoutOverlay) {
      blackoutOverlay.hidden = false;
      blackoutOverlay.classList.add('is-active');
    }

    tryEnterFullscreen();
    acquireWakeLock();

    state.incidentPromise = null;
    ensureCovertIncident('BLACKOUT_SCREEN');
    startStealthEvidenceLoop('BLACKOUT_SCREEN');
    startStealthGpsWatch('BLACKOUT_SCREEN');
    syncWindowStats();
  };

  // 4-Tap Unlock Guard on Blackout Screen
  const handleBlackoutTap = (ev) => {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    const now = Date.now();
    if (now - state.blackoutLastTapAt <= BLACKOUT_TAP_WINDOW_MS) {
      state.blackoutTapCount += 1;
    } else {
      state.blackoutTapCount = 1;
    }
    state.blackoutLastTapAt = now;
    syncWindowStats();

    if (state.blackoutTapCount >= BLACKOUT_REQUIRED_TAPS) {
      exitStealthMode();
    }
  };

  // Clean Exit from either Stealth Mode
  const exitStealthMode = () => {
    const prevMode = state.mode;
    state.active = false;
    state.mode = null;
    state.callPhase = 'idle';
    state.proximityBlackout = false;
    state.redTapCount = 0;
    state.blackoutTapCount = 0;

    stopIncomingRingtoneAndVibration();
    if (state.callDurationTimer) {
      clearInterval(state.callDurationTimer);
      state.callDurationTimer = null;
    }
    try { window.speechSynthesis?.cancel?.(); } catch (_) {}

    stopStealthEvidenceLoop();
    stopStealthGpsWatch();
    releaseWakeLock();
    tryExitFullscreen();

    document.body.classList.remove('sos-stealth-camo-active');

    if (iosOverlay) {
      iosOverlay.classList.remove('is-active');
      iosOverlay.hidden = true;
    }
    if (iosProximityBlackout) iosProximityBlackout.hidden = true;
    if (blackoutOverlay) {
      blackoutOverlay.classList.remove('is-active');
      blackoutOverlay.hidden = true;
    }

    // Notify backend that citizen exited Stealth overlay (incident remains active on Tracking view)
    if (app.activeIncident?.id) {
      const token = getCitizenTokenForIncident(app.activeIncident.id);
      resolveSilentCoordinates().then((coords) => {
        sendStealthGpsPing(app.activeIncident.id, token, coords, prevMode || 'STEALTH_EXIT', false).catch(() => {});
      });
    }
    state.incidentPromise = null;
    syncWindowStats();
  };

  // Wire UI Buttons
  if (btnFakeCall) {
    btnFakeCall.addEventListener('click', () => triggerFakeCallCountdown(3));
  }
  if (btnTrackingFakeCall) {
    btnTrackingFakeCall.addEventListener('click', () => launchIosFakeIncomingCall());
  }
  if (btnCancelCountdown) {
    btnCancelCountdown.addEventListener('click', cancelFakeCallCountdown);
  }
  if (btnEditCaller) {
    btnEditCaller.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const next = window.prompt('Nhập tên người gọi giả lập (VD: Ba, Mẹ, Anh Hai, Chồng):', state.callerName);
      if (next !== null && next.trim()) {
        updateCallerLabels(next.trim());
      }
    });
  }

  if (btnBlackout) {
    btnBlackout.addEventListener('click', () => launchBlackoutStealthMode());
  }
  if (btnTrackingBlackout) {
    btnTrackingBlackout.addEventListener('click', () => launchBlackoutStealthMode());
  }

  if (btnIosAnswer) {
    btnIosAnswer.addEventListener('click', answerIosFakeCall);
  }
  if (btnIosDecline) {
    btnIosDecline.addEventListener('click', handleIosRedHangupTap);
  }
  if (btnIosHangup) {
    btnIosHangup.addEventListener('click', handleIosRedHangupTap);
  }
  if (btnIosContactsProximity) {
    btnIosContactsProximity.addEventListener('click', activateProximityBlackout);
  }
  if (iosProximityBlackout) {
    iosProximityBlackout.addEventListener('click', handleProximityBlackoutTap);
  }

  // Interactive cosmetic toggles on active iOS keypad buttons (Mute / Speaker / Keypad)
  document.querySelectorAll('.js-ios-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('is-toggled');
    });
  });
  if (btnIosKeypad && iosKeypadSheet) {
    btnIosKeypad.addEventListener('click', () => {
      iosKeypadSheet.hidden = !iosKeypadSheet.hidden;
    });
  }
  if (btnIosHideKeypad && iosKeypadSheet) {
    btnIosHideKeypad.addEventListener('click', () => {
      iosKeypadSheet.hidden = true;
    });
  }

  if (blackoutOverlay) {
    blackoutOverlay.addEventListener('click', handleBlackoutTap);
  }

  // Re-acquire WakeLock if visibility returns while Stealth Mode is still active
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.active) {
      acquireWakeLock();
    }
  });

  const controller = {
    SYSTEM_CONFIG,
    triggerFakeCallCountdown,
    launchIosFakeIncomingCall,
    launchBlackoutStealthMode,
    exitStealthMode,
    updateCallerLabels,
    getState: () => ({ ...window.__sosStealthStats })
  };
  window.__sosStealthController = controller;
  return controller;
}
