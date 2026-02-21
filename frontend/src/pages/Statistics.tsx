import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Users, LayoutGrid, Activity, Clock,
    ArrowLeft, RefreshCcw, TrendingUp
} from 'lucide-react';
import {
    Container, Typography, Box, Grid,
    Paper, alpha, Stack, IconButton, CircularProgress
} from '@mui/material';
import { statsApi } from '../utils/api';
import Logger from '../utils/logger';

interface Stats {
    onlinePlayers: number;
    activeRooms: number;
    requestsProcessed: number;
    uptime: string;
    gamesCreated: number;
}

const Statistics: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await statsApi.get('/stats');
            setStats(res.data);
            setError(null);
        } catch (err) {
            Logger.error('Statistics', 'Failed to fetch stats', err);
            setError('Não foi possível carregar as estatísticas agora.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const StatCard = ({ title, value, icon, color, delay }: any) => (
        <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            sx={{ height: '100%' }}
        >
            <Paper sx={{
                p: 4, borderRadius: 8, height: '100%',
                bgcolor: alpha('#0f172a', 0.4),
                backdropFilter: 'blur(10px)',
                border: '1px solid',
                borderColor: alpha(color, 0.2),
                display: 'flex', flexDirection: 'column', gap: 2,
                position: 'relative', overflow: 'hidden',
                '&:hover': { borderColor: color, transform: 'translateY(-4px)', transition: 'all 0.3s' }
            }}>
                <Box sx={{
                    position: 'absolute', top: -20, right: -20,
                    color: alpha(color, 0.05), transform: 'rotate(-20deg)'
                }}>
                    {React.cloneElement(icon, { size: 120 })}
                </Box>

                <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    w: 48, h: 48, borderRadius: 4, bgcolor: alpha(color, 0.1),
                    color: color, border: '1px solid', borderColor: alpha(color, 0.3)
                }}>
                    {icon}
                </Box>
                <Box>
                    <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 900, letterSpacing: 2 }}>
                        {title}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 900, mt: 0.5 }}>
                        {value}
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: 6, pb: 12 }}>
            <Container maxWidth="lg">
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 8 }}>
                    <IconButton
                        onClick={() => navigate('/')}
                        sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3, p: 1.5 }}
                    >
                        <ArrowLeft />
                    </IconButton>
                    <Box>
                        <Typography variant="h3" sx={{ fontWeight: 900, fontStyle: 'italic' }}>
                            PLATFORM<Box component="span" sx={{ color: 'primary.main' }}>STATS</Box>
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                            Monitoramento em tempo real do ecossistema Roletrando.
                        </Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton
                        onClick={fetchStats}
                        disabled={loading}
                        sx={{ bgcolor: alpha('#a78bfa', 0.1), color: '#a78bfa', borderRadius: 3, p: 1.5 }}
                    >
                        <RefreshCcw size={24} className={loading ? 'animate-spin' : ''} />
                    </IconButton>
                </Stack>

                {loading && !stats ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 20 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: alpha('#ef4444', 0.05), borderColor: 'error.main', border: '1px solid' }}>
                        <Typography color="error">{error}</Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <StatCard
                                title="Jogadores Online"
                                value={stats?.onlinePlayers || 0}
                                icon={<Users size={32} />}
                                color="#10b981"
                                delay={0.1}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <StatCard
                                title="Salas Ativas"
                                value={stats?.activeRooms || 0}
                                icon={<LayoutGrid size={32} />}
                                color="#3b82f6"
                                delay={0.2}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <StatCard
                                title="Jogos na Sessão"
                                value={stats?.gamesCreated || 0}
                                icon={<TrendingUp size={32} />}
                                color="#f59e0b"
                                delay={0.3}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <StatCard
                                title="Requisições Processadas"
                                value={stats?.requestsProcessed.toLocaleString() || 0}
                                icon={<Activity size={32} />}
                                color="#ec4899"
                                delay={0.4}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <StatCard
                                title="Uptime do Servidor"
                                value={stats?.uptime || '0d 0h 0m 0s'}
                                icon={<Clock size={32} />}
                                color="#a78bfa"
                                delay={0.5}
                            />
                        </Grid>
                    </Grid>
                )}
            </Container>
        </Box>
    );
};

export default Statistics;
