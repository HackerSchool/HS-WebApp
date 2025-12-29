import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useHacknightStatus from '../hooks/useHacknightStatus';
import {
    exportHacknightVotes,
    finalizeXadowDecision,
    resetHacknightEvent,
    submitChallengeVotes,
    submitCheckIn,
    submitPitchVotes,
    submitXadowDecisionVote,
    submitXadowGuessVote,
    triggerXadowStage,
    updateHacknightState,
} from '../services/hacknightService';
import { getProjects } from '../services/projectService';
import { getMembers } from '../services/memberService';
import { getMemberParticipations } from '../services/projectParticipationService';
import './HackNightVotePage.css';

const PITCH_CATEGORIES = [
    { key: 'appeal', label: 'Appeal' },
    { key: 'surprise', label: 'Surprise Topic' },
    { key: 'timeScore', label: 'Time' },
    { key: 'content', label: 'Content' },
    { key: 'effort', label: 'Effort' },
];

const clampScore = (value) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return 5;
    return Math.min(5, Math.max(1, parsed));
};

const formatCountdown = (deadline) => {
    if (!deadline) return '--:--';
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return '00:00';
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const HackNightVotePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const voterId = user?.username || localStorage.getItem('username');
    const {
        status,
        loading: statusLoading,
        refresh: refreshStatus,
    } = useHacknightStatus({ pollingInterval: 10000 });

    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const [participations, setParticipations] = useState([]);
    const [baseLoading, setBaseLoading] = useState(true);

    const [selectedCheckInTeam, setSelectedCheckInTeam] = useState('');
    const [checkInFeedback, setCheckInFeedback] = useState(null);

    const [pitchForm, setPitchForm] = useState({});
    const [pitchSubmitting, setPitchSubmitting] = useState(false);
    const [pitchFeedback, setPitchFeedback] = useState(null);

    const [challengeForm, setChallengeForm] = useState({});
    const [challengeSubmitting, setChallengeSubmitting] = useState(false);
    const [challengeFeedback, setChallengeFeedback] = useState(null);

    const [decisionVote, setDecisionVote] = useState(null);
    const [decisionSubmitting, setDecisionSubmitting] = useState(false);
    const [decisionFeedback, setDecisionFeedback] = useState(null);

    const [guessVote, setGuessVote] = useState('');
    const [guessSubmitting, setGuessSubmitting] = useState(false);
    const [guessFeedback, setGuessFeedback] = useState(null);

    const [adminActionSubmitting, setAdminActionSubmitting] = useState(false);
    const [adminFeedback, setAdminFeedback] = useState(null);

    const memberByUsername = useMemo(() => {
        const map = {};
        members.forEach((member) => {
            map[member.username] = member;
        });
        return map;
    }, [members]);

    const projectBySlug = useMemo(() => {
        const map = {};
        projects.forEach((project) => {
            map[project.slug] = project;
            if (project.id) {
                map[String(project.id)] = project;
            }
        });
        return map;
    }, [projects]);

    const groupedCheckins = useMemo(() => {
        const grouped = {};
        status?.checkins?.forEach((entry) => {
            const teamId = entry.teamId;
            if (!grouped[teamId]) {
                grouped[teamId] = {
                    teamId,
                    members: [],
                    lastCheckIn: entry.checkedInAt,
                };
            }
            if (!grouped[teamId].members.includes(entry.memberId)) {
                grouped[teamId].members.push(entry.memberId);
            }
            grouped[teamId].lastCheckIn = entry.checkedInAt;
        });
        return grouped;
    }, [status?.checkins]);

    const checkedInTeams = useMemo(
        () => Object.values(groupedCheckins),
        [groupedCheckins]
    );

    const hasUserCheckedIn = useMemo(() => {
        return status?.checkins?.some((entry) => entry.memberId === voterId);
    }, [status?.checkins, voterId]);

    const hasPitchVote = useMemo(() => {
        return status?.pitchVotes?.some((vote) => vote.voterId === voterId);
    }, [status?.pitchVotes, voterId]);

    const hasChallengeVote = useMemo(() => {
        return status?.challengeVotes?.some((vote) => vote.voterId === voterId);
    }, [status?.challengeVotes, voterId]);

    const existingDecisionVote = useMemo(() => {
        return status?.xadowVotes?.find(
            (vote) => vote.voterId === voterId && vote.stage === 'decision'
        );
    }, [status?.xadowVotes, voterId]);

    const existingGuessVote = useMemo(() => {
        return status?.xadowVotes?.find(
            (vote) => vote.voterId === voterId && vote.stage === 'guess'
        );
    }, [status?.xadowVotes, voterId]);

    const isPitchLocked = status?.state?.pitchLocked;
    const isChallengeLocked = status?.state?.challengeLocked;
    const xadowStage = status?.state?.xadowStage || 'idle';

    const sortedProjects = useMemo(() => {
        return [...projects].sort((a, b) => a.name.localeCompare(b.name));
    }, [projects]);

    const userTeamsFromParticipation = useMemo(() => {
        if (!participations) return [];
        return participations
            .map((participation) => participation.project_slug || participation.project?.slug || participation.slug)
            .filter(Boolean);
    }, [participations]);

    useEffect(() => {
        const loadBaseData = async () => {
            try {
                setBaseLoading(true);
                const [projectsData, membersData] = await Promise.all([
                    getProjects(),
                    getMembers(),
                ]);
                setProjects(projectsData || []);
                setMembers(membersData || []);
                if (voterId) {
                    try {
                        const memberParticipations = await getMemberParticipations(voterId);
                        setParticipations(memberParticipations || []);
                        if (!selectedCheckInTeam && memberParticipations?.length) {
                            const firstTeam =
                                memberParticipations[0].project_slug ||
                                memberParticipations[0].project?.slug ||
                                memberParticipations[0].slug;
                            if (firstTeam) {
                                setSelectedCheckInTeam(firstTeam);
                            }
                        }
                    } catch (error) {
                        console.error('Erro ao carregar participações do membro:', error);
                    }
                }
            } catch (error) {
                console.error('Erro ao carregar dados iniciais do HackNight:', error);
            } finally {
                setBaseLoading(false);
            }
        };

        loadBaseData();
    }, [voterId, selectedCheckInTeam]);

    useEffect(() => {
        const updatedForm = {};
        checkedInTeams.forEach((team) => {
            updatedForm[team.teamId] = pitchForm[team.teamId] || {
                appeal: 5,
                surprise: 5,
                timeScore: 5,
                content: 5,
                effort: 5,
            };
        });
        setPitchForm(updatedForm);
    }, [checkedInTeams.length]);

    useEffect(() => {
        if (hasPitchVote) {
            const existing = status.pitchVotes.filter((vote) => vote.voterId === voterId);
            const restored = {};
            existing.forEach((vote) => {
                restored[vote.teamId] = {
                    appeal: vote.appeal,
                    surprise: vote.surprise,
                    timeScore: vote.timeScore,
                    content: vote.content,
                    effort: vote.effort,
                };
            });
            setPitchForm((prev) => ({ ...prev, ...restored }));
        }
    }, [hasPitchVote, status?.pitchVotes, voterId]);

    useEffect(() => {
        const updatedOrders = {};
        checkedInTeams.forEach((team, index) => {
            const existing = status?.challengeVotes?.find(
                (vote) => vote.voterId === voterId && vote.teamId === team.teamId
            );
            updatedOrders[team.teamId] = existing?.orderPosition ?? challengeForm[team.teamId] ?? index + 1;
        });
        setChallengeForm(updatedOrders);
    }, [checkedInTeams.length, status?.challengeVotes, voterId]);

    useEffect(() => {
        if (existingDecisionVote) {
            setDecisionVote(existingDecisionVote.value === 'yes');
        }
        if (existingGuessVote) {
            setGuessVote(existingGuessVote.teamId || existingGuessVote.value || '');
        }
    }, [existingDecisionVote, existingGuessVote]);

    useEffect(() => {
        if (!selectedCheckInTeam && userTeamsFromParticipation.length) {
            setSelectedCheckInTeam(userTeamsFromParticipation[0]);
        }
    }, [selectedCheckInTeam, userTeamsFromParticipation]);

    const handleCheckIn = async () => {
        if (!voterId) return;
        if (!selectedCheckInTeam) {
            setCheckInFeedback({ type: 'error', message: 'Seleciona primeiro a tua equipa.' });
            return;
        }
        setCheckInFeedback(null);
        try {
            await submitCheckIn({
                teamId: selectedCheckInTeam,
                memberId: voterId,
            });
            await refreshStatus();
            setCheckInFeedback({ type: 'success', message: 'Check-in registado com sucesso!' });
        } catch (error) {
            console.error('Erro no check-in:', error);
            setCheckInFeedback({
                type: 'error',
                message: 'Não foi possível fazer o check-in. Tenta novamente.',
            });
        }
    };

    const handlePitchScoreChange = (teamId, key, value) => {
        setPitchForm((prev) => ({
            ...prev,
            [teamId]: {
                ...prev[teamId],
                [key]: clampScore(value),
            },
        }));
    };

    const handleSubmitPitch = async () => {
        if (!voterId) return;
        if (!checkedInTeams.length) {
            setPitchFeedback({ type: 'error', message: 'Ainda não há equipas com check-in.' });
            return;
        }
        setPitchSubmitting(true);
        setPitchFeedback(null);
        try {
            const votes = checkedInTeams.map((team) => ({
                teamId: team.teamId,
                scores: pitchForm[team.teamId] || {
                    appeal: 5,
                    surprise: 5,
                    timeScore: 5,
                    content: 5,
                    effort: 5,
                },
            }));
            await submitPitchVotes({ voterId, votes });
            await refreshStatus();
            setPitchFeedback({ type: 'success', message: 'Voto enviado! 🎉' });
        } catch (error) {
            console.error('Erro ao submeter votos de Pitch:', error);
            setPitchFeedback({
                type: 'error',
                message: 'Não foi possível registar o voto. Tenta outra vez.',
            });
        } finally {
            setPitchSubmitting(false);
        }
    };

    const handleChallengeOrderChange = (teamId, value) => {
        setChallengeForm((prev) => ({
            ...prev,
            [teamId]: value.replace(/[^0-9]/g, ''),
        }));
    };

    const handleSubmitChallenge = async () => {
        if (!voterId) return;
        if (!checkedInTeams.length) {
            setChallengeFeedback({ type: 'error', message: 'Ainda não há equipas com check-in.' });
            return;
        }
        setChallengeSubmitting(true);
        setChallengeFeedback(null);
        try {
            const orderings = checkedInTeams.map((team) => ({
                teamId: team.teamId,
                order: challengeForm[team.teamId],
            }));
            await submitChallengeVotes({ voterId, orderings });
            await refreshStatus();
            setChallengeFeedback({ type: 'success', message: 'Ordem enviada! 🚀' });
        } catch (error) {
            console.error('Erro ao submeter ordem de Challenge:', error);
            setChallengeFeedback({
                type: 'error',
                message: 'Não foi possível registar a ordem. Tenta outra vez.',
            });
        } finally {
            setChallengeSubmitting(false);
        }
    };

    const handleSubmitDecisionVote = async () => {
        if (!voterId || decisionVote === null) {
            setDecisionFeedback({
                type: 'error',
                message: 'Escolhe se queres participar na votação.',
            });
            return;
        }
        setDecisionSubmitting(true);
        setDecisionFeedback(null);
        try {
            await submitXadowDecisionVote({
                voterId,
                participate: Boolean(decisionVote),
            });
            await refreshStatus();
            setDecisionFeedback({ type: 'success', message: 'Decisão registada. 🕶️' });
        } catch (error) {
            console.error('Erro ao submeter decisão xad0w.b1ts:', error);
            setDecisionFeedback({
                type: 'error',
                message: 'Não foi possível registar. Tenta novamente.',
            });
        } finally {
            setDecisionSubmitting(false);
        }
    };

    const handleSubmitGuessVote = async () => {
        if (!voterId || !guessVote) {
            setGuessFeedback({
                type: 'error',
                message: 'Escolhe qual equipa pensas ser xad0w.b1ts.',
            });
            return;
        }
        setGuessSubmitting(true);
        setGuessFeedback(null);
        try {
            await submitXadowGuessVote({
                voterId,
                teamId: guessVote,
            });
            await refreshStatus();
            setGuessFeedback({ type: 'success', message: 'Palpite registado! 👀' });
        } catch (error) {
            console.error('Erro ao submeter palpite xad0w.b1ts:', error);
            setGuessFeedback({
                type: 'error',
                message: 'Não foi possível registar o palpite.',
            });
        } finally {
            setGuessSubmitting(false);
        }
    };

    const handleExportVotes = async () => {
        setAdminActionSubmitting(true);
        setAdminFeedback(null);
        try {
            const blob = await exportHacknightVotes(status?.eventDate);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `hacknight_votes_${status?.eventDate || 'latest'}.zip`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            setAdminFeedback({ type: 'success', message: 'Export concluído!' });
        } catch (error) {
            console.error('Erro ao exportar votos:', error);
            setAdminFeedback({ type: 'error', message: 'Falha ao exportar votos.' });
        } finally {
            setAdminActionSubmitting(false);
        }
    };

    const handleResetEvent = async () => {
        setAdminActionSubmitting(true);
        setAdminFeedback(null);
        try {
            await resetHacknightEvent(status?.eventDate);
            await refreshStatus();
            setAdminFeedback({ type: 'success', message: 'HackNight reiniciado.' });
        } catch (error) {
            console.error('Erro ao reiniciar HackNight:', error);
            setAdminFeedback({ type: 'error', message: 'Falha ao reiniciar.' });
        } finally {
            setAdminActionSubmitting(false);
        }
    };

    const handleToggleCheckins = async () => {
        setAdminActionSubmitting(true);
        setAdminFeedback(null);
        try {
            await updateHacknightState({
                checkinsOpen: !status?.state?.checkinsOpen,
            });
            await refreshStatus();
            setAdminFeedback({ type: 'success', message: 'Estado de check-in atualizado.' });
        } catch (error) {
            console.error('Erro ao atualizar estado de check-in:', error);
            setAdminFeedback({ type: 'error', message: 'Falha ao atualizar estado.' });
        } finally {
            setAdminActionSubmitting(false);
        }
    };

    const handleTriggerXadowStage = useCallback(
        async (stage) => {
            setAdminActionSubmitting(true);
            setAdminFeedback(null);
            try {
                await triggerXadowStage({
                    stage,
                    durationMinutes: 5,
                });
                await refreshStatus();
                setAdminFeedback({ type: 'success', message: `Fase ${stage} atualizada.` });
            } catch (error) {
                console.error('Erro ao atualizar fase xad0w.b1ts:', error);
                setAdminFeedback({ type: 'error', message: 'Não foi possível atualizar a fase.' });
            } finally {
                setAdminActionSubmitting(false);
            }
        },
        [refreshStatus]
    );

    const handleFinalizeXadowDecision = async (isXadowTeam) => {
        setAdminActionSubmitting(true);
        setAdminFeedback(null);
        try {
            await finalizeXadowDecision({
                teamId: guessVote || status?.xadowDecision?.teamId,
                isXadowTeam,
                adminId: voterId,
            });
            await refreshStatus();
            setAdminFeedback({ type: 'success', message: 'Decisão final registada.' });
        } catch (error) {
            console.error('Erro a finalizar xad0w.b1ts:', error);
            setAdminFeedback({ type: 'error', message: 'Falha ao finalizar decisão.' });
        } finally {
            setAdminActionSubmitting(false);
        }
    };

    const decisionDeadline = status?.state?.decisionDeadline;
    const guessDeadline = status?.state?.guessDeadline;

    const [decisionCountdown, setDecisionCountdown] = useState(formatCountdown(decisionDeadline));
    const [guessCountdown, setGuessCountdown] = useState(formatCountdown(guessDeadline));

    useEffect(() => {
        setDecisionCountdown(formatCountdown(decisionDeadline));
        if (!decisionDeadline) return undefined;
        const interval = setInterval(() => {
            setDecisionCountdown(formatCountdown(decisionDeadline));
        }, 1000);
        return () => clearInterval(interval);
    }, [decisionDeadline]);

    useEffect(() => {
        setGuessCountdown(formatCountdown(guessDeadline));
        if (!guessDeadline) return undefined;
        const interval = setInterval(() => {
            setGuessCountdown(formatCountdown(guessDeadline));
        }, 1000);
        return () => clearInterval(interval);
    }, [guessDeadline]);

    const isAdmin = Boolean(user?.roles?.includes('admin') || user?.roles?.includes('sysadmin'));

    if (!voterId) {
        return (
            <div className="hacknight-vote-container">
                <div className="vote-card warning">
                    <h2>Autenticação necessária</h2>
                    <p>Precisamos do teu utilizador para registar o check-in e as votações.</p>
                    <button type="button" onClick={() => navigate('/login')} className="primary-btn">
                        Ir para Login
                    </button>
                </div>
            </div>
        );
    }

    if (baseLoading || statusLoading) {
        return (
            <div className="hacknight-vote-container">
                <div className="vote-loading">
                    <div className="loader-spinner" />
                    <p>Sincronizando HackNight...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="hacknight-vote-container">
            <header className="vote-header">
                <button type="button" className="back-button" onClick={() => navigate('/hacknight')}>
                    ← Voltar
                </button>
                <h1>HackNight · Voting Arena</h1>
                <p className="vote-subtitle">
                    Check-in, voto e caçada xad0w.b1ts — tudo em tempo-real (não te atrases!)
                </p>
            </header>

            <section className="vote-section checkin-section">
                <div className="section-header">
                    <h2>Check-In</h2>
                    <span className={`badge ${status?.state?.checkinsOpen ? 'badge-success' : 'badge-muted'}`}>
                        {status?.state?.checkinsOpen ? 'Aberto' : 'Fechado'}
                    </span>
                </div>

                <div className="checkin-content">
                    <div className="checkin-inputs">
                        <label htmlFor="team-select">Equipa</label>
                        <select
                            id="team-select"
                            className="stylish-select"
                            value={selectedCheckInTeam}
                            onChange={(event) => setSelectedCheckInTeam(event.target.value)}
                            disabled={!status?.state?.checkinsOpen}
                        >
                            <option value="">Escolhe a tua equipa</option>
                            {userTeamsFromParticipation.map((teamSlug) => {
                                const project = projectBySlug[teamSlug];
                                return (
                                    <option key={teamSlug} value={teamSlug}>
                                        {project?.name || teamSlug}
                                    </option>
                                );
                            })}
                            {!userTeamsFromParticipation.length &&
                                sortedProjects.map((project) => (
                                    <option key={project.slug} value={project.slug}>
                                        {project.name}
                                    </option>
                                ))}
                        </select>
                        <button
                            type="button"
                            className="primary-btn"
                            onClick={handleCheckIn}
                            disabled={!status?.state?.checkinsOpen || hasUserCheckedIn}
                        >
                            {hasUserCheckedIn ? 'Já estás checked-in' : 'Check-In agora'}
                        </button>
                        {checkInFeedback && (
                            <p className={`feedback ${checkInFeedback.type}`}>{checkInFeedback.message}</p>
                        )}
                    </div>

                    <div className="team-galaxy">
                        {checkedInTeams.length ? (
                            checkedInTeams.map((team) => {
                                const project = projectBySlug[team.teamId];
                                return (
                                    <div className="team-bubble-card" key={team.teamId}>
                                        <div className="team-bubble">
                                            <span className="team-name">{project?.name || team.teamId}</span>
                                            <span className="team-slug">@{team.teamId}</span>
                                        </div>
                                        <div className="team-members">
                                            {team.members.map((username) => {
                                                const member = memberByUsername[username];
                                                return (
                                                    <div className="member-chip" key={username}>
                                                        <span className="member-avatar">
                                                            {(member?.display_name || username || '?')
                                                                .substring(0, 2)
                                                                .toUpperCase()}
                                                        </span>
                                                        <span className="member-name">
                                                            {member?.display_name || member?.name || username}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="empty-checkins">
                                <p>Aguardando o primeiro check-in... 🚀</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="vote-section pitch-section">
                <div className="section-header">
                    <h2>HackerPitch</h2>
                    <span className="badge badge-warning">1 a 5 · tudo começa em 5</span>
                </div>

                <div className="pitch-grid">
                    {checkedInTeams.length ? (
                        checkedInTeams.map((team) => {
                            const scores = pitchForm[team.teamId] || {};
                            const project = projectBySlug[team.teamId];
                            return (
                                <div className="pitch-card" key={team.teamId}>
                                    <header>
                                        <h3>{project?.name || team.teamId}</h3>
                                        <p>{team.members.length} contribuições registadas</p>
                                    </header>
                                    <div className="pitch-sliders">
                                        {PITCH_CATEGORIES.map((category) => (
                                            <label key={`${team.teamId}-${category.key}`}>
                                                {category.label}
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    value={scores[category.key] ?? 5}
                                                    onChange={(event) =>
                                                        handlePitchScoreChange(team.teamId, category.key, event.target.value)
                                                    }
                                                    disabled={isPitchLocked || hasPitchVote}
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="empty-state-card">
                            <p>Sem equipas ainda... Assim que chegarem, a arena abre!</p>
                        </div>
                    )}
                </div>
                <div className="section-actions">
                    <button
                        type="button"
                        className="primary-btn"
                        onClick={handleSubmitPitch}
                        disabled={pitchSubmitting || isPitchLocked || hasPitchVote || !checkedInTeams.length}
                    >
                        {hasPitchVote ? 'Voto registado' : 'Submeter voto'}
                    </button>
                    {pitchFeedback && (
                        <p className={`feedback ${pitchFeedback.type}`}>{pitchFeedback.message}</p>
                    )}
                    {isPitchLocked && <small className="info-text">Pitch voting está encerrado.</small>}
                </div>
            </section>

            <section className="vote-section challenge-section">
                <div className="section-header">
                    <h2>HackerChallenge</h2>
                    <span className="badge badge-info">Ordena como quiseres</span>
                </div>

                <div className="challenge-grid">
                    {checkedInTeams.length ? (
                        checkedInTeams.map((team) => {
                            const project = projectBySlug[team.teamId];
                            return (
                                <div className="challenge-card" key={`challenge-${team.teamId}`}>
                                    <span className="challenge-team">{project?.name || team.teamId}</span>
                                    <input
                                        type="number"
                                        min="1"
                                        className="order-input"
                                        value={challengeForm[team.teamId] ?? ''}
                                        onChange={(event) => handleChallengeOrderChange(team.teamId, event.target.value)}
                                        disabled={isChallengeLocked || hasChallengeVote}
                                    />
                                </div>
                            );
                        })
                    ) : (
                        <div className="empty-state-card">
                            <p>Ainda sem equipas para ordenar.</p>
                        </div>
                    )}
                </div>
                <div className="section-actions">
                    <button
                        type="button"
                        className="primary-btn"
                        onClick={handleSubmitChallenge}
                        disabled={
                            challengeSubmitting || isChallengeLocked || hasChallengeVote || !checkedInTeams.length
                        }
                    >
                        {hasChallengeVote ? 'Ordem registada' : 'Submeter ordenação'}
                    </button>
                    {challengeFeedback && (
                        <p className={`feedback ${challengeFeedback.type}`}>{challengeFeedback.message}</p>
                    )}
                    {isChallengeLocked && <small className="info-text">Challenge voting está encerrado.</small>}
                </div>
            </section>

            <section className="vote-section xadow-section">
                <div className="section-header">
                    <h2>xad0w.b1ts</h2>
                    <span className={`badge ${xadowStage === 'guess' ? 'badge-warning' : 'badge-muted'}`}>
                        Fase: {xadowStage}
                    </span>
                </div>

                <div className="xadow-content">
                    <div className="xadow-panel">
                        <h3>1. Participas da caçada?</h3>
                        <div className="xadow-countdown">
                            <span>Tempo restante: {decisionCountdown}</span>
                        </div>
                        <div className="toggle-group">
                            <button
                                type="button"
                                className={`toggle-btn ${decisionVote === true ? 'active' : ''}`}
                                onClick={() => setDecisionVote(true)}
                                disabled={xadowStage !== 'decision' || Boolean(existingDecisionVote)}
                            >
                                Bora votar
                            </button>
                            <button
                                type="button"
                                className={`toggle-btn ${decisionVote === false ? 'active' : ''}`}
                                onClick={() => setDecisionVote(false)}
                                disabled={xadowStage !== 'decision' || Boolean(existingDecisionVote)}
                            >
                                Passo esta
                            </button>
                        </div>
                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={handleSubmitDecisionVote}
                            disabled={
                                xadowStage !== 'decision' || decisionSubmitting || Boolean(existingDecisionVote)
                            }
                        >
                            {existingDecisionVote ? 'Decisão registada' : 'Enviar decisão'}
                        </button>
                        {decisionFeedback && (
                            <p className={`feedback ${decisionFeedback.type}`}>{decisionFeedback.message}</p>
                        )}
                    </div>

                    <div className="xadow-panel">
                        <h3>2. Quem é o xad0w.b1ts?</h3>
                        <div className="xadow-countdown">
                            <span>Tempo restante: {guessCountdown}</span>
                        </div>
                        <div className="guess-grid">
                            {sortedProjects.map((project) => (
                                <button
                                    type="button"
                                    key={`guess-${project.slug}`}
                                    className={`guess-chip ${guessVote === project.slug ? 'selected' : ''}`}
                                    onClick={() => setGuessVote(project.slug)}
                                    disabled={xadowStage !== 'guess' || Boolean(existingGuessVote)}
                                >
                                    {project.name}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={handleSubmitGuessVote}
                            disabled={xadowStage !== 'guess' || guessSubmitting || Boolean(existingGuessVote)}
                        >
                            {existingGuessVote ? 'Palpite registado' : 'Enviar palpite'}
                        </button>
                        {guessFeedback && (
                            <p className={`feedback ${guessFeedback.type}`}>{guessFeedback.message}</p>
                        )}
                    </div>

                    <div className="xadow-panel result-panel">
                        <h3>3. Revelação</h3>
                        {status?.xadowDecision ? (
                            <div
                                className={`reveal-card ${
                                    status.xadowDecision.isXadowTeam ? 'villain' : 'escaped'
                                }`}
                            >
                                <div className="reveal-animation">
                                    {status.xadowDecision.isXadowTeam ? '🕶️🕵️' : '🛰️💨'}
                                </div>
                                <p>
                                    {status.xadowDecision.isXadowTeam
                                        ? 'Eles eram o xad0w.b1ts! Hacker vibes confirmados.'
                                        : 'Falso alarme. O xad0w.b1ts continua à solta.'}
                                </p>
                                {status.xadowDecision.teamId && (
                                    <p className="reveal-team">
                                        Equipa alvo: {projectBySlug[status.xadowDecision.teamId]?.name || status.xadowDecision.teamId}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="waiting-card">
                                <p>Aguarda a decisão da organização...</p>
                                <div className="loading-dots">
                                    <span />
                                    <span />
                                    <span />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {isAdmin && (
                <section className="vote-section admin-controls">
                    <div className="section-header">
                        <h2>Painel de Controlo</h2>
                    </div>
                    <div className="admin-grid">
                        <button type="button" className="secondary-btn" onClick={handleToggleCheckins} disabled={adminActionSubmitting}>
                            {status?.state?.checkinsOpen ? 'Fechar Check-ins' : 'Abrir Check-ins'}
                        </button>
                        <button type="button" className="secondary-btn" onClick={() => handleTriggerXadowStage('decision')} disabled={adminActionSubmitting}>
                            Iniciar Decisão xad0w (5 min)
                        </button>
                        <button type="button" className="secondary-btn" onClick={() => handleTriggerXadowStage('guess')} disabled={adminActionSubmitting}>
                            Iniciar Palpites xad0w (5 min)
                        </button>
                        <button type="button" className="secondary-btn" onClick={() => handleTriggerXadowStage('idle')} disabled={adminActionSubmitting}>
                            Fechar xad0w
                        </button>
                        <button type="button" className="secondary-btn" onClick={() => handleFinalizeXadowDecision(true)} disabled={adminActionSubmitting}>
                            Confirmar que eram xad0w
                        </button>
                        <button type="button" className="secondary-btn" onClick={() => handleFinalizeXadowDecision(false)} disabled={adminActionSubmitting}>
                            Dizer que não eram xad0w
                        </button>
                        <button type="button" className="secondary-btn" onClick={handleExportVotes} disabled={adminActionSubmitting}>
                            Exportar votos (ZIP)
                        </button>
                        <button type="button" className="secondary-btn" onClick={handleResetEvent} disabled={adminActionSubmitting}>
                            Reset HackNight
                        </button>
                    </div>
                    {adminFeedback && (
                        <p className={`feedback ${adminFeedback.type}`}>{adminFeedback.message}</p>
                    )}
                </section>
            )}
        </div>
    );
};

export default HackNightVotePage;

