import React, { type ReactNode } from 'react';
import { Card, CardActionArea, CardContent, Typography, Box, styled, alpha } from '@mui/material';

const StyledCard = styled(Card)(({ theme }) => ({
    background: alpha(theme.palette.background.paper, 0.6),
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.05)',
    transition: 'all 0.4s ease',
    '&:hover': {
        transform: 'translateY(-8px)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
        boxShadow: `0 20px 40px rgba(0,0,0,0.4)`,
    },
}));

interface GameCardProps {
    title: string;
    description: string;
    icon: ReactNode;
    onClick: () => void;
    color?: string;
    disabled?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({ title, description, icon, onClick, color = '#10b981', disabled = false }) => {
    return (
        <StyledCard sx={{ opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
            <CardActionArea onClick={onClick} sx={{ p: 1 }} disabled={disabled}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', textAlign: 'center' }}>
                    <Box sx={{
                        p: 2,
                        borderRadius: 4,
                        bgcolor: alpha(color, 0.1),
                        color: color,
                        mb: 1
                    }}>
                        {icon}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'white' }}>
                        {title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                        {description}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </StyledCard>
    );
};
