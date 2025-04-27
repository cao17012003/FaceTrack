import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Box, Button, CircularProgress, Typography, Paper, Card, CardContent, Fade } from '@mui/material';
import { CameraAlt as CameraIcon, Replay as ReplayIcon } from '@mui/icons-material';

const WebcamCapture = ({ onCapture, isLoading, error }) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
    
    // Convert base64 to blob
    if (imageSrc) {
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "webcam-capture.jpg", { type: "image/jpeg" });
          onCapture(file);
        });
    }
  }, [webcamRef, onCapture]);

  const retake = () => {
    setImgSrc(null);
  };

  const videoConstraints = {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    facingMode: "user"
  };
  
  const handleUserMedia = () => {
    setCameraReady(true);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '800px', mx: 'auto' }}>
      <Card elevation={4} sx={{ 
        borderRadius: 2, 
        overflow: 'hidden',
        mb: 3,
        background: 'linear-gradient(to right bottom, #fafafa, #f5f5f5)',
        position: 'relative'
      }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {!cameraReady && !imgSrc && (
            <Box sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.7)',
              zIndex: 10
            }}>
              <CircularProgress color="primary" />
              <Typography variant="body1" color="white" sx={{ ml: 2 }}>
                Đang kết nối camera...
              </Typography>
            </Box>
          )}
          
          {imgSrc ? (
            <Fade in={true} timeout={500}>
              <Box>
                <Box sx={{ 
                  position: 'relative',
                  height: '60vh',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                  backgroundColor: '#000'
                }}>
                  <img 
                    src={imgSrc} 
                    alt="webcam" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain'
                    }} 
                  />
                </Box>
                <Box sx={{ 
                  p: 2, 
                  display: 'flex', 
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5'
                }}>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={retake}
                    disabled={isLoading}
                    startIcon={<ReplayIcon />}
                    sx={{ borderRadius: 2 }}
                  >
                    {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Chụp lại'}
                  </Button>
                </Box>
              </Box>
            </Fade>
          ) : (
            <Box>
              <Box sx={{ 
                position: 'relative',
                height: '60vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                backgroundColor: '#000'
              }}>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  onUserMedia={handleUserMedia}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover'
                  }}
                />
                {cameraReady && (
                  <Box sx={{ 
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    border: '2px dashed rgba(255,255,255,0.5)',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    pointerEvents: 'none'
                  }}>
                  </Box>
                )}
              </Box>
              <Box sx={{ 
                p: 3, 
                display: 'flex', 
                justifyContent: 'center',
                backgroundColor: '#f5f5f5'
              }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={capture}
                  disabled={isLoading || !cameraReady}
                  startIcon={<CameraIcon />}
                  sx={{ 
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    boxShadow: 3
                  }}
                >
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Chụp ảnh'}
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
      
      {error && (
        <Paper elevation={2} sx={{ p: 2, mt: 2, bgcolor: '#fff5f5', borderLeft: '4px solid #f44336' }}>
          <Typography color="error">
            {error}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default WebcamCapture; 