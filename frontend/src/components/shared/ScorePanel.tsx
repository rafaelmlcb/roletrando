import React from 'react';
import { Paper, Typography, Box, styled, alpha } from '@mui/material';
import { Trophy } from 'lucide-react';

const Panel = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    borderRadius: 32,
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
}));

interface ScorePanelProps {
    label: string;
    value: string | number;
    highlighted?: boolean;
}

export const ScorePanel: React.FC<ScorePanelProps> = ({ label, value, highlighted }) => {
    return (
        <Panel elevation={highlighted ? 8 : 1}>
            <Box sx={{ p: 1, bgcolor: alpha('#10b981', 0.1), borderRadius: 3 }}>
                <Trophy size={20} color="#10b981" />
            </Box>
            <Box>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 900, lineHeight: 1 }}>
                    {label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', fontStyle: 'italic' }}>
                    {value}
                </Typography>
            </Box>
        </Panel>
    );
};
