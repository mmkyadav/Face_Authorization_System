import React, { useRef, useEffect, useState } from 'react';

const getDistance = (p1, p2) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

const getEAR = (eye) => {
  const a = getDistance(eye[1], eye[5]);
  const b = getDistance(eye[2], eye[4]);
  const c = getDistance(eye[0], eye[3]);
  return (a + b) / (2.0 * c);
};

export default function WebcamView({
  modelsLoaded,
  cameraActive,
  isAuthenticating,
  onFaceDescriptorReady,
  activeTab,
  onTimeout
}) {
  const videoRef = useRef(null);
  const requestRef = useRef(null);
  const streamRef = useRef(null);

  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [faceBox, setFaceBox] = useState(null);
  const [cameraStatus, setCameraStatus] = useState({ color: 'yellow', text: 'Camera offline' });

  // Passive Liveness & Sequence States (Login)
  const [isLivenessVerified, setIsLivenessVerified] = useState(false);
  const [livenessFeedback, setLivenessFeedback] = useState('Position your face in the oval');
  const [livenessProgress, setLivenessProgress] = useState(0);
  
  const [hasStartedLiveness, setHasStartedLiveness] = useState(false);
  const hasStartedLivenessRef = useRef(false);
  const [hasTurnedLeft, setHasTurnedLeft] = useState(false);
  const hasTurnedLeftRef = useRef(false);
  const [hasTurnedRight, setHasTurnedRight] = useState(false);
  const hasTurnedRightRef = useRef(false);

  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (!cameraActive || activeTab !== 'login' || isLivenessVerified) {
      setTimeLeft(30);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onTimeout) {
            onTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cameraActive, activeTab, isLivenessVerified, onTimeout]);

  // Dynamic Oval Guide States
  const [ovalSize, setOvalSize] = useState({ rx: 110, ry: 150 });
  const [ovalStatus, setOvalStatus] = useState('aligning');
  const [ovalMessage, setOvalMessage] = useState('Align face in oval');
  const [ovalColor, setOvalColor] = useState('rgba(99, 102, 241, 0.6)'); // Indigo default

  // Registration Captured Image Preview States
  const [capturedImage, setCapturedImage] = useState(null);
  const [tempDescriptor, setTempDescriptor] = useState(null);

  const lastDetectionRef = useRef(null);

  // Restart liveness when tab changes or camera starts
  useEffect(() => {
    resetLiveness();
  }, [activeTab, cameraActive]);

  useEffect(() => {
    if (cameraActive && modelsLoaded) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [cameraActive, modelsLoaded]);

  const resetLiveness = () => {
    hasStartedLivenessRef.current = false;
    setHasStartedLiveness(false);
    hasTurnedLeftRef.current = false;
    setHasTurnedLeft(false);
    hasTurnedRightRef.current = false;
    setHasTurnedRight(false);
    setIsLivenessVerified(false);
    setLivenessProgress(0);
    setLivenessFeedback('Position your face in the oval');
    setCapturedImage(null);
    setTempDescriptor(null);
    setOvalSize({ rx: 110, ry: 150 });
    setOvalColor('rgba(99, 102, 241, 0.6)');
    setOvalMessage('Align face in oval');
    setOvalStatus('aligning');
    setTimeLeft(30);
  };

  const startCamera = async () => {
    if (isCameraRunning) return;
    setCameraLoading(true);
    setCameraError(null);
    setCameraStatus({ color: 'yellow', text: 'Starting camera...' });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => resolve();
        });
        
        await videoRef.current.play();
        setIsCameraRunning(true);
        setCameraLoading(false);
        setCameraStatus({ color: 'green', text: activeTab === 'register' ? 'Ready to Capture' : 'Follow the turn sequence...' });
        
        startDetectionLoop();
      }
    } catch (err) {
      console.error('Webcam Start Error:', err);
      setCameraLoading(false);
      setCameraStatus({ color: 'red', text: 'Camera offline' });
      setCameraError('Could not find or access camera. Please allow permission and try again.');
    }
  };

  const stopCamera = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraRunning(false);
    setFaceBox(null);
    setCameraStatus({ color: 'yellow', text: 'Camera offline' });
  };

  const startDetectionLoop = () => {
    const video = videoRef.current;
    if (!video) return;
    
    const displaySize = { width: video.videoWidth, height: video.videoHeight };

    const loop = async () => {
      if (!videoRef.current || video.paused || video.ended) return;

      try {
        const detection = await window.faceapi.detectSingleFace(
          video,
          new window.faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
        ).withFaceLandmarks();

        if (detection) {
          const resizedDetection = window.faceapi.resizeResults(detection, displaySize);
          lastDetectionRef.current = resizedDetection;
          const landmarks = resizedDetection.landmarks;

          const { x, y, width, height } = resizedDetection.detection.box;
          const mirroredX = video.videoWidth - x - width;
          
          setFaceBox({
            left: `${(mirroredX / video.videoWidth) * 100}%`,
            top: `${(y / video.videoHeight) * 100}%`,
            width: `${(width / video.videoWidth) * 100}%`,
            height: `${(height / video.videoHeight) * 100}%`
          });

          // Dynamic Oval Guide sizing & checks
          // Video resolution is 640x480. Center is (320, 240).
          const faceCenterX = x + width / 2;
          const faceCenterY = y + height / 2;
          const distFromCenter = Math.sqrt(Math.pow(faceCenterX - 320, 2) + Math.pow(faceCenterY - 240, 2));

          // Set guide oval width/height based on detected face box
          setOvalSize({ 
            rx: Math.min(150, Math.max(90, width * 0.68)), 
            ry: Math.min(200, Math.max(120, height * 0.76)) 
          });

          let isFaceAlignedPerfect = false;
          const started = hasStartedLivenessRef.current;

          // 1. Run alignment check ONLY if not yet in liveness phase
          if (activeTab === 'register' || !started) {
            if (distFromCenter > 55) {
              setOvalStatus('centering');
              setOvalMessage('Center your face');
              setOvalColor('#f59e0b'); // Yellow
            } else if (width < 140) {
              setOvalStatus('too-far');
              setOvalMessage('Move closer');
              setOvalColor('#f59e0b');
            } else if (width > 280) {
              setOvalStatus('too-close');
              setOvalMessage('Move back');
              setOvalColor('#f59e0b');
            } else {
              setOvalStatus('perfect');
              setOvalMessage('Perfect!');
              setOvalColor('#10b981'); // Green
              isFaceAlignedPerfect = true;
            }
          }

          // YAW tracking for Liveness Sequence (Login tab only)
          const points = landmarks.positions;
          const faceLeft = points[0];
          const faceRight = points[16];
          const noseTip = points[30];
          const dLeft = noseTip.x - faceLeft.x;
          const dRight = faceRight.x - noseTip.x;
          const yawRatio = dRight !== 0 ? dLeft / dRight : 1.0;

          if (activeTab === 'login') {
            if (!started) {
              if (isFaceAlignedPerfect) {
                hasStartedLivenessRef.current = true;
                setHasStartedLiveness(true);
                setLivenessFeedback('Turn your head LEFT and RIGHT');
              } else {
                setLivenessFeedback('Align face to start challenge');
              }
              setLivenessProgress(0);
            } else {
              // Liveness challenge active - check turns
              if (yawRatio > 1.5 && !hasTurnedLeftRef.current) {
                hasTurnedLeftRef.current = true;
                setHasTurnedLeft(true);
              }
              if (yawRatio < 0.65 && !hasTurnedRightRef.current) {
                hasTurnedRightRef.current = true;
                setHasTurnedRight(true);
              }

              const leftDone = hasTurnedLeftRef.current;
              const rightDone = hasTurnedRightRef.current;

              // Calculate progress: 0 turns = 20%, 1 turn = 60%, 2 turns = 80%, centered = 100%
              let progressVal = 20;
              if (leftDone && rightDone) {
                progressVal = 80;
              } else if (leftDone || rightDone) {
                progressVal = 60;
              }
              setLivenessProgress(isLivenessVerified ? 100 : progressVal);

              if (!leftDone && !rightDone) {
                setOvalMessage('Turn head LEFT or RIGHT');
                setOvalColor('#0d9488'); // Teal active
                setLivenessFeedback('Liveness: Turn head LEFT or RIGHT');
              } else if (leftDone && !rightDone) {
                setOvalMessage('Now turn face RIGHT');
                setOvalColor('#0d9488');
                setLivenessFeedback('Liveness: Turn face RIGHT');
              } else if (!leftDone && rightDone) {
                setOvalMessage('Now turn face LEFT');
                setOvalColor('#0d9488');
                setLivenessFeedback('Liveness: Turn face LEFT');
              } else {
                // Both turns registered, return to center
                setOvalMessage('Return back to CENTER');
                setOvalColor('#0d9488');
                setLivenessFeedback('Liveness: Return back to CENTER');

                if (yawRatio >= 0.8 && yawRatio <= 1.25) {
                  setIsLivenessVerified(true);
                  setLivenessProgress(100);
                  setLivenessFeedback('Liveness verified! Logging in...');
                  setOvalMessage('Success! Logging in...');
                  setOvalColor('#10b981'); // Green
                  setCameraStatus({ color: 'green', text: 'Access Granted' });
                  
                  // Trigger auto capture & login
                  setTimeout(() => {
                    handleAutoLoginCapture();
                  }, 300);
                }
              }
            }
          }
        } else {
          lastDetectionRef.current = null;
          setFaceBox(null);
          setOvalColor('rgba(99, 102, 241, 0.6)');
          setOvalMessage('Align face in oval');
          setOvalStatus('aligning');

          if (activeTab === 'login') {
            hasStartedLivenessRef.current = false;
            setHasStartedLiveness(false);
            hasTurnedLeftRef.current = false;
            setHasTurnedLeft(false);
            hasTurnedRightRef.current = false;
            setHasTurnedRight(false);
            setLivenessProgress(0);
            setIsLivenessVerified(false);
            setLivenessFeedback('Align your face to the camera');
            setCameraStatus({ color: 'yellow', text: 'No face detected' });
          } else {
            setCameraStatus({ color: 'yellow', text: 'Place face in frame' });
          }
        }
      } catch (err) {
        console.error('Error in face recognition loop:', err);
      }

      if (cameraActive && !capturedImage) {
        requestRef.current = requestAnimationFrame(loop);
      }
    };

    requestRef.current = requestAnimationFrame(loop);
  };

  // Auto trigger capture when login liveness sequence completes
  const handleAutoLoginCapture = async () => {
    if (!videoRef.current) return;
    try {
      const finalDetection = await window.faceapi.detectSingleFace(
        videoRef.current,
        new window.faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

      if (finalDetection && finalDetection.descriptor) {
        onFaceDescriptorReady(Array.from(finalDetection.descriptor));
      }
    } catch (err) {
      console.error('Auto login capture failed:', err);
    }
  };

  // Action callback for Registration Capture button
  const handleCaptureClick = async () => {
    if (!videoRef.current || isAuthenticating) return;

    if (activeTab === 'login' && !isLivenessVerified) {
      alert('Please complete the face-turning liveness sequence first.');
      return;
    }

    const detection = lastDetectionRef.current;
    if (!detection) {
      alert('No face detected. Please align your face in the oval guide.');
      return;
    }

    setCameraStatus({ color: 'yellow', text: 'Capturing facial signature...' });
    
    try {
      // 1. Calculate the biometric 128D descriptor
      const finalDetection = await window.faceapi.detectSingleFace(
        videoRef.current,
        new window.faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

      if (finalDetection && finalDetection.descriptor) {
        if (activeTab === 'login') {
          // Immediately send to parent for authentication, no confirm/retake preview needed for login
          onFaceDescriptorReady(Array.from(finalDetection.descriptor));
          return;
        }

        // 2. Capture a photo from video frame and freeze loop
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = videoRef.current.videoWidth;
        tempCanvas.height = videoRef.current.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(videoRef.current, 0, 0);
        const dataUrl = tempCanvas.toDataURL('image/jpeg');

        // Pause feed & freeze loop
        videoRef.current.pause();
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
          requestRef.current = null;
        }

        setCapturedImage(dataUrl);
        setTempDescriptor(Array.from(finalDetection.descriptor));
        setCameraStatus({ color: 'yellow', text: 'Confirm registration photo' });
      } else {
        alert('Could not capture face structure. Please align clearly and try again.');
        setCameraStatus({ color: 'green', text: 'Ready' });
      }
    } catch (err) {
      console.error('Capture error:', err);
      alert('An error occurred during facial capture. Please try again.');
    }
  };

  // Action for captured photo: Retake
  const handleRetake = () => {
    setCapturedImage(null);
    setTempDescriptor(null);
    setCameraStatus({ color: 'green', text: 'Scanning face...' });
    if (videoRef.current) {
      videoRef.current.play();
      startDetectionLoop();
    }
  };

  // Action for captured photo: Proceed
  const handleProceed = () => {
    if (tempDescriptor) {
      onFaceDescriptorReady(tempDescriptor);
    }
  };

  const showLivenessUI = activeTab === 'login';

  return (
    <div className="viewport-card" style={{ opacity: cameraActive ? 1 : 0.4, pointerEvents: cameraActive ? 'auto' : 'none' }}>
      <div className="webcam-viewport">
        {/* Placeholder off screen */}
        {!isCameraRunning && !cameraLoading && (
          <div className="viewport-overlay active">
            <div className="placeholder-content">
              <div className="placeholder-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <h3>Camera Inactive</h3>
              <p>{cameraError || 'Submit your details above to activate the camera.'}</p>
            </div>
          </div>
        )}

        {/* Loading feed spinner */}
        {cameraLoading && (
          <div className="viewport-overlay active">
            <div className="placeholder-content">
              <div className="spinner-small"></div>
              <p>Opening camera feed...</p>
            </div>
          </div>
        )}

        {/* Video feed */}
        <video
          ref={videoRef}
          id="webcam"
          autoPlay
          muted
          playsInline
          style={{ display: isCameraRunning && !capturedImage ? 'block' : 'none' }}
        ></video>
        
        {/* Dynamic Oval Cutout Guide (Only active when camera runs & not showing preview) */}
        {isCameraRunning && !capturedImage && (
          <div className="oval-guide-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 6 }}>
            <svg width="100%" height="100%" viewBox="0 0 640 480" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0 }}>
              <defs>
                <mask id="oval-mask">
                  <rect width="640" height="480" fill="white" />
                  <ellipse cx="320" cy="240" rx={ovalSize.rx} ry={ovalSize.ry} fill="black" />
                </mask>
              </defs>
              <rect width="640" height="480" fill="rgba(8, 12, 24, 0.65)" mask="url(#oval-mask)" />
              <ellipse 
                cx="320" 
                cy="240" 
                rx={ovalSize.rx} 
                ry={ovalSize.ry} 
                fill="none" 
                stroke={ovalColor} 
                strokeWidth="3.5" 
                style={{ 
                  filter: `drop-shadow(0px 0px 8px ${ovalColor})`, 
                  transition: 'rx 0.1s ease, ry 0.1s ease, stroke 0.2s ease' 
                }}
              />
            </svg>
            <div 
              className={`oval-instruction-prompt`}
              style={{
                position: 'absolute',
                top: '30px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: ovalColor,
                background: 'rgba(7,7,15,0.8)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '700',
                border: `1px solid ${ovalColor}`,
                boxShadow: `0 2px 10px rgba(0,0,0,0.5)`,
                zIndex: 10,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              {ovalMessage}
            </div>
          </div>
        )}

        {/* Registration captured image preview panel */}
        {capturedImage && (
          <div className="captured-preview-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20, background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src={capturedImage} 
              alt="Biometric registration portrait" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'linear-gradient(to top, rgba(8,12,24,0.95), transparent)', padding: '20px 15px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '5px', textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}>Proceed with this facial profile?</p>
              <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '240px' }}>
                <button onClick={handleRetake} className="btn btn-sm btn-danger" style={{ flex: 1 }}>Retake</button>
                <button onClick={handleProceed} className="btn btn-sm btn-success" style={{ flex: 1 }} disabled={isAuthenticating}>Proceed</button>
              </div>
            </div>
          </div>
        )}

        {/* 30-Second Countdown Timer Badge */}
        {isCameraRunning && !capturedImage && showLivenessUI && (
          <div 
            className="timer-badge" 
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              zIndex: 12,
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '20px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-accent)',
              fontSize: '12px',
              fontWeight: '700',
              color: '#f87171',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '13px', height: '13px' }}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{timeLeft}s</span>
          </div>
        )}

        {/* Dribbble Style Circular Progress Ring (Only show during Login) */}
        {isCameraRunning && !capturedImage && showLivenessUI && (
          <div className="progress-ring-container">
            <svg width="46" height="46" viewBox="0 0 46 46">
              <circle
                cx="23"
                cy="23"
                r="18"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="2.5"
                fill="none"
              />
              <circle
                cx="23"
                cy="23"
                r="18"
                stroke="var(--accent-secondary)"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray="113"
                strokeDashoffset={113 - (113 * livenessProgress) / 100}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 0.35s ease',
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%'
                }}
              />
            </svg>
            <span className="progress-percent">{livenessProgress}%</span>
          </div>
        )}

        {/* Bottom Sci-fi Text Overlay */}
        {isCameraRunning && !capturedImage && (
          <div className="scifi-overlay-text">
            {activeTab === 'register' ? 'FACIAL REGISTRATION' : 'FACIAL RECOGNITION'}
          </div>
        )}
      </div>
      
      <div className="viewport-footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div className="status-message">
            <span className={`pulse-icon ${cameraStatus.color}`}></span>
            <span className="message-text" style={{ fontSize: '12px' }}>{cameraStatus.text}</span>
          </div>
          {showLivenessUI && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{livenessFeedback}</span>
          )}
        </div>

        {isCameraRunning && !capturedImage && (
          <button
            onClick={handleCaptureClick}
            className={`btn btn-block ${(!showLivenessUI || isLivenessVerified) ? 'btn-success' : 'btn-primary'}`}
            disabled={!faceBox || isAuthenticating || (showLivenessUI && !isLivenessVerified)}
            style={{ marginTop: '5px' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>
              {showLivenessUI
                ? (isLivenessVerified ? 'Capture Face & Login' : 'Liveness Verifying...')
                : 'Capture Face & Register'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
