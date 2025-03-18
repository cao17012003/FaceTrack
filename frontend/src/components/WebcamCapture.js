import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Box, Button, CircularProgress, Typography, Paper } from '@mui/material';
import { CameraAlt as CameraIcon } from '@mui/icons-material';

const WebcamCapture = ({ onCapture, isLoading, error }) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);

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
    width: 720,
    height: 480,
    facingMode: "user"
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          mb: 2, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          maxWidth: 720,
          mx: 'auto'
        }}
      >
        {imgSrc ? (
          <Box>
            <img src={imgSrc} alt="webcam" style={{ width: '100%', maxWidth: '720px' }} />
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={retake}
                disabled={isLoading}
                sx={{ mr: 1 }}
              >
                Chụp lại
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              style={{ width: '100%', maxWidth: '720px' }}
            />
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={capture}
                disabled={isLoading}
                startIcon={<CameraIcon />}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Chụp ảnh'}
              </Button>
            </Box>
          </Box>
        )}
        
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default WebcamCapture; 