import React from 'react';
import { Button, type ButtonProps, styled } from '@mui/material';

const StyledButton = styled(Button)(({ theme }) => ({
    borderRadius: 20,
    padding: '12px 32px',
    fontSize: '1.1rem',
    fontWeight: 900,
    letterSpacing: '0.05em',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
        transform: 'translateY(-2px) scale(1.02)',
        boxShadow: `0 8px 25px ${theme.palette.primary.main}40`,
    },
    '&:active': {
        transform: 'translateY(0) scale(0.98)',
    },
}));

export const ActionButton: React.FC<ButtonProps> = (props) => {
    return <StyledButton variant="contained" {...props} />;
};
