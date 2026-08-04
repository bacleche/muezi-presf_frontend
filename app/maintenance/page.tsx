import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import HomeIcon from '@mui/icons-material/Home';

export default function MaintenancePage() {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          py: 4,
        }}
      >
        <ConstructionIcon 
          color="primary" 
          sx={{ fontSize: 80, mb: 2 }} 
        />
        
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{ fontWeight: 'bold' }}
        >
          Interface  en Construction
        </Typography>

        <Typography variant="body1" color="textSecondary" sx={{ mb: 4, maxWidth: 500 }}>
          Notre plateforme fait l'objet de mises à jour importantes pour vous offrir une meilleure expérience. Nous serons de retour très bientôt !
        </Typography>

        
      </Box>
    </Container>
  );
}