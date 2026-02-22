import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, RefreshCcw, Medal, Star } from 'lucide-react';
import {
    Container, Typography, Box, Paper, Stack,
    IconButton, Avatar, CircularProgress, alpha, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import { statsApi } from '../utils/api';
import Logger from '../utils/logger';

interface RankingEntry {
    playerName: string;
    totalScore: number;
    gamesPlayed: number;
    wins: number;
}

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];


const Ranking: React.FC = () => {
    const navigate = useNavigate();
    const [ranking, setRanking] = useState<RankingEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRanking = async () => {
        setLoading(true);
        try {
            const res = await statsApi.get('/ranking');
            setRanking(res.data);
            setError(null);
        } catch (err) {
            Logger.error('Ranking', 'Failed to fetch ranking', err);
            setError('Não foi possível carregar o ranking agora.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRanking(); }, []);

    const getPositionIcon = (index: number) => {
        if (index === 0) return <Trophy size={20} color={MEDAL_COLORS[0]} />;
        if (index === 1) return <Medal size={20} color={MEDAL_COLORS[1]} />;
        if (index === 2) return <Medal size={20} color={MEDAL_COLORS[2]} />;
        return <Typography fontWeight={900} color="text.secondary">#{index + 1}</Typography>;
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: 6, pb: 12 }}>
            <Container maxWidth="md">
                {/* Header */}
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 8 }}>
                    <IconButton
                        onClick={() => navigate('/')}
                        sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3, p: 1.5 }}
                    >
                        <ArrowLeft />
                    </IconButton>
                    <Box>
                        <Typography variant="h3" sx={{ fontWeight: 900, fontStyle: 'italic' }}>
                            RANKING<Box component="span" sx={{ color: 'primary.main' }}>GLOBAL</Box>
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                            Pontuação acumulada de todos os jogos.
                        </Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton
                        onClick={fetchRanking}
                        disabled={loading}
                        sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b', borderRadius: 3, p: 1.5 }}
                    >
                        <RefreshCcw size={22} />
                    </IconButton>
                </Stack>

                {/* Top 3 Podium */}
                {!loading && !error && ranking.length >= 3 && (
                    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 6 }} alignItems="flex-end">
                        {[1, 0, 2].map((pos) => {
                            const player = ranking[pos];
                            if (!player) return null;
                            const isFirst = pos === 0;
                            return (
                                <Box
                                    key={player.playerName}
                                    component={motion.div}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: pos * 0.1 }}
                                    sx={{ textAlign: 'center', flex: 1 }}
                                >
                                    <Avatar
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.playerName}`}
                                        sx={{
                                            width: isFirst ? 80 : 64, height: isFirst ? 80 : 64,
                                            mx: 'auto', mb: 1,
                                            border: `3px solid ${MEDAL_COLORS[pos]}`,
                                            boxShadow: `0 0 20px ${MEDAL_COLORS[pos]}55`
                                        }}
                                    />
                                    <Typography fontWeight={900} sx={{ color: MEDAL_COLORS[pos] }}>
                                        {player.playerName}
                                    </Typography>
                                    <Typography variant="h5" fontWeight={900}>
                                        {player.totalScore.toLocaleString()}
                                    </Typography>
                                    <Paper sx={{
                                        mt: 1, py: isFirst ? 6 : pos === 1 ? 4 : 3, px: 2,
                                        borderRadius: '8px 8px 0 0',
                                        bgcolor: alpha(MEDAL_COLORS[pos], 0.1),
                                        border: `1px solid ${alpha(MEDAL_COLORS[pos], 0.3)}`
                                    }}>
                                        <Typography variant="h4" sx={{ color: MEDAL_COLORS[pos], fontWeight: 900 }}>
                                            {pos + 1}
                                        </Typography>
                                    </Paper>
                                </Box>
                            );
                        })}
                    </Stack>
                )}

                {/* Full Table */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 16 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Paper sx={{ p: 4, textAlign: 'center', border: '1px solid', borderColor: 'error.main', bgcolor: alpha('#ef4444', 0.05) }}>
                        <Typography color="error">{error}</Typography>
                    </Paper>
                ) : ranking.length === 0 ? (
                    <Paper sx={{ p: 6, textAlign: 'center', bgcolor: alpha('#0f172a', 0.4), borderRadius: 4 }}>
                        <Star size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                        <Typography variant="h6" color="text.secondary">
                            Nenhuma partida registrada ainda.
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Jogue e seu nome aparecerá aqui!
                        </Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} sx={{
                        borderRadius: 4, bgcolor: alpha('#0f172a', 0.4),
                        backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 900, color: 'text.secondary', letterSpacing: 1 }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 900, color: 'text.secondary', letterSpacing: 1 }}>JOGADOR</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 900, color: 'text.secondary', letterSpacing: 1 }}>PONTUAÇÃO</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 900, color: 'text.secondary', letterSpacing: 1 }}>PARTIDAS</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 900, color: 'text.secondary', letterSpacing: 1 }}>VITÓRIAS</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ranking.map((entry, index) => (
                                    <TableRow
                                        key={entry.playerName}
                                        component={motion.tr as React.ElementType}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        sx={{
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                                            bgcolor: index < 3 ? alpha(MEDAL_COLORS[index], 0.03) : 'transparent'
                                        }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {getPositionIcon(index)}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                                <Avatar
                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.playerName}`}
                                                    sx={{ width: 36, height: 36 }}
                                                />
                                                <Typography fontWeight={700}>{entry.playerName}</Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography fontWeight={900} sx={{ color: index === 0 ? MEDAL_COLORS[0] : 'text.primary' }}>
                                                {entry.totalScore.toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Chip label={entry.gamesPlayed} size="small"
                                                sx={{ bgcolor: alpha('#a78bfa', 0.1), color: '#a78bfa', fontWeight: 700 }} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Chip label={entry.wins} size="small"
                                                sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981', fontWeight: 700 }} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Container>
        </Box>
    );
};

export default Ranking;
