import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useHacknightStatus from '../hooks/useHacknightStatus';
import { useAuth } from '../contexts/AuthContext';
import { getProjects } from '../services/projectService';
import { getMembers } from '../services/memberService';
import { getMemberParticipations } from '../services/projectParticipationService';
import {
    submitCheckIn,
    submitPitchVotes,
    submitChallengeVotes,
    submitXadowDecisionVote,
    submitXadowGuessVote,
} from '../services/hacknightService';
import './HackNightVotingPage.css';

const PITCH_CATEGORIES = [
    { key: 'appeal', label: 'Appeal', emoji: '✨' },
    { key: 'surprise', label: 'Surprise Topic', emoji: '🎲' },
    { key: 'time', label: 'Time', emoji: '⏱️' },
    { key: 'content', label: 'Content', emoji: '📚' },
    { key: 'effort', label: 'Effort', emoji: '🔥' },
];

const TEAM_COLORS = [
    '#ff6b6b',
    '#60c3ff',
    '#ffd166',
    '#8ac926',
    '#c77dff',
    '#00bbf9',
    '#f15bb5',
    '#9b5de5',
];

const ensureScoreRange = (value) => {
    const numeric = parseInt(value, 10);
    if (Number.isNaN(numeric)) return 5;
    return Math.min(5, Math.max(1, numeric));
};

const getDisplayName = (member) => {
    if (!member) return '';
    if (member.displayName) return member.displayName;
    if (member.name) return member.name;
    const parts = [member.firstName, member.lastName].filter(Boolean);
    if (parts.length) return parts.join(' ');
    return member.username;
};

const HackNightVotingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        status,
        refresh,
        loading: statusLoading,
    } = useHacknightStatus({ pollingInterval: 8000 });

    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const [initialLoad, setInitialLoad] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [checkInTeam, setCheckInTeam] = useState('');
    const [checkInMessage, setCheckInMessage] = useState(null);
    const [checkInSubmitting, setCheckInSubmitting] = useState(false);

    const [pitchScores, setPitchScores] = useState({});
    const [pitchSubmitting, setPitchSubmitting] = useState(false);
    const [pitchMessage, setPitchMessage] = useState(null);
    const [localPitchLocked, setLocalPitchLocked] = useState(false);

    const [challengeOrder, setChallengeOrder] = useState({});
    const [challengeSubmitting, setChallengeSubmitting] = useState(false);
    const [challengeMessage, setChallengeMessage] = useState(null);
    const [localChallengeLocked, setLocalChallengeLocked] = useState(false);

    const [decisionChoice, setDecisionChoice] = useState(null);
    const [decisionSubmitting, setDecisionSubmitting] = useState(false);
    const [guessSelection, setGuessSelection] = useState('');
    const [guessSubmitting, setGuessSubmitting] = useState(false);
    const [xadowMessage, setXadowMessage] = useState(null);

    const [lastResetAt, setLastResetAt] = useState(null);
    const [userParticipations, setUserParticipations] = useState([]);
    const [nowTimestamp, setNowTimestamp] = useState(Date.now());
    const previousXadowStageRef = useRef(null);

    const currentUserId = user?.username || localStorage.getItem('username');

    useEffect(() => {
        const loadBasics = async () => {
            try {
                setLoadError(null);
                const [projectsData, membersData] = await Promise.all([
                    getProjects(),
                    getMembers(),
                ]);
                setProjects(projectsData);
                setMembers(membersData);
            } catch (error) {
                console.error('Erro ao carregar dados base do HackNight:', error);
                setLoadError('Não foi possível carregar os dados base. Tenta novamente.');
            } finally {
                setInitialLoad(false);
            }
        };
        loadBasics();
    }, []);

    useEffect(() => {
        const fetchParticipations = async () => {
            if (!currentUserId) {
                setUserParticipations([]);
                return;
            }
            try {
                const data = await getMemberParticipations(currentUserId);
                setUserParticipations(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Erro a carregar participações do membro:', error);
                setUserParticipations([]);
            }
        };
        fetchParticipations();
    }, [currentUserId]);

    useEffect(() => {
        const resetMarker = status?.state?.lastResetAt || null;
        if (resetMarker && resetMarker !== lastResetAt) {
            setLocalPitchLocked(false);
            setLocalChallengeLocked(false);
            setPitchMessage(null);
            setChallengeMessage(null);
            setXadowMessage(null);
            setDecisionChoice(null);
            setGuessSelection('');
            setLastResetAt(resetMarker);
        }
    }, [status, lastResetAt]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setNowTimestamp(Date.now());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const membersMap = useMemo(() => {
        const map = new Map();
        members.forEach((member) => {
            if (!member?.username) return;
            map.set(member.username, {
                ...member,
                displayName: getDisplayName(member),
            });
        });
        return map;
    }, [members]);

    const projectsMap = useMemo(() => {
        const map = new Map();
        projects.forEach((project) => {
            if (!project) return;
            const identifier = project.slug || project.id || project.name;
            if (!identifier) return;
            map.set(identifier, {
                ...project,
                displayName: project.name || project.title || identifier,
                slug: project.slug || project.id || project.name,
            });
        });
        return map;
    }, [projects]);

    const allowedCheckInProjects = useMemo(() => {
        if (!currentUserId) return [];
        if (!projects.length) return [];
        if (!userParticipations.length) return [];

        const allowedNames = new Set(
            userParticipations
                .map((participation) => participation?.project_name)
                .filter(Boolean)
        );

        return projects.filter((project) =>
            allowedNames.has(project.name || project.title)
        );
    }, [projects, userParticipations, currentUserId]);

    const checkedInTeams = useMemo(() => {
        if (!status?.checkins) return [];
        const byTeam = new Map();
        status.checkins.forEach((entry) => {
            if (!entry?.teamId) return;
            const teamId = entry.teamId;
            if (!byTeam.has(teamId)) {
                const projectInfo = projectsMap.get(teamId);
                byTeam.set(teamId, {
                    teamId,
                    name: projectInfo?.displayName || teamId,
                    slug: projectInfo?.slug || teamId,
                    members: [],
                    color: TEAM_COLORS[byTeam.size % TEAM_COLORS.length],
                });
            }
            const team = byTeam.get(teamId);
            const memberInfo = membersMap.get(entry.memberId);
            team.members.push({
                id: entry.memberId,
                name: getDisplayName(memberInfo) || entry.memberId,
                avatar: memberInfo?.avatarUrl,
            });
        });
        return Array.from(byTeam.values());
    }, [status, projectsMap, membersMap]);

    const ownTeamIds = useMemo(() => {
        const ids = new Set();
        if (currentUserId) {
            checkedInTeams.forEach((team) => {
                if (team.members.some((member) => member.id === currentUserId)) {
                    ids.add(team.teamId);
                }
            });
        }
        userParticipations.forEach((participation) => {
            if (!participation) return;
            const slugCandidates = [
                participation.project_slug,
                participation.slug,
                participation.project?.slug,
            ].filter(Boolean);
            slugCandidates.forEach((slug) => ids.add(slug));
            const projectName =
                participation.project_name || participation.project?.name || null;
            if (projectName) {
                projects.forEach((project) => {
                    const identifier = project.slug || project.id || project.name;
                    const comparableName = project.name || project.title;
                    if (identifier && comparableName === projectName) {
                        ids.add(identifier);
                    }
                });
            }
        });
        return ids;
    }, [checkedInTeams, currentUserId, userParticipations, projects]);

    useEffect(() => {
        if (!allowedCheckInProjects.length) {
            setCheckInTeam('');
            return;
        }

        const currentExists = allowedCheckInProjects.some((project) => {
            const id = project.slug || project.id || project.name;
            return id === checkInTeam;
        });

        if (!currentExists) {
            const firstAllowed = allowedCheckInProjects[0];
            setCheckInTeam(firstAllowed.slug || firstAllowed.id || firstAllowed.name || '');
        }
    }, [allowedCheckInProjects, checkInTeam]);

    const userPitchVotes = useMemo(() => {
        if (!status?.pitchVotes || !currentUserId) return [];
        return status.pitchVotes.filter((vote) => vote.voterId === currentUserId);
    }, [status, currentUserId]);

    const userChallengeVotes = useMemo(() => {
        if (!status?.challengeVotes || !currentUserId) return [];
        return status.challengeVotes.filter((vote) => vote.voterId === currentUserId);
    }, [status, currentUserId]);

    const xadowVotes = useMemo(() => status?.xadowVotes || [], [status?.xadowVotes]);

    const userDecisionVote = useMemo(() => {
        if (!xadowVotes.length || !currentUserId) return null;
        return xadowVotes.find(
            (vote) => vote.voterId === currentUserId && vote.stage === 'decision'
        );
    }, [xadowVotes, currentUserId]);

    const userGuessVote = useMemo(() => {
        if (!xadowVotes.length || !currentUserId) return null;
        return xadowVotes.find(
            (vote) => vote.voterId === currentUserId && vote.stage === 'guess'
        );
    }, [xadowVotes, currentUserId]);

    useEffect(() => {
        if (!checkedInTeams.length) {
            setPitchScores({});
            setChallengeOrder({});
            return;
        }

        setPitchScores((prev) => {
            const next = {};
            const existingScores = new Map();
            userPitchVotes.forEach((vote) => {
                existingScores.set(vote.teamId, {
                    appeal: ensureScoreRange(vote.appeal),
                    surprise: ensureScoreRange(vote.surprise),
                    time: ensureScoreRange(vote.timeScore ?? vote.time),
                    content: ensureScoreRange(vote.content),
                    effort: ensureScoreRange(vote.effort),
                });
            });

            checkedInTeams.forEach((team) => {
                if (existingScores.has(team.teamId)) {
                    next[team.teamId] = existingScores.get(team.teamId);
                } else if (prev[team.teamId]) {
                    next[team.teamId] = prev[team.teamId];
                } else {
                    next[team.teamId] = {
                        appeal: 5,
                        surprise: 5,
                        time: 5,
                        content: 5,
                        effort: 5,
                    };
                }
            });
            return next;
        });

        setChallengeOrder((prev) => {
            const next = {};
            const existingOrders = new Map();
            userChallengeVotes.forEach((vote) => {
                existingOrders.set(vote.teamId, vote.orderPosition);
            });

            let index = 1;
            checkedInTeams.forEach((team) => {
                if (existingOrders.has(team.teamId)) {
                    next[team.teamId] = existingOrders.get(team.teamId);
                } else if (prev[team.teamId] != null) {
                    next[team.teamId] = prev[team.teamId];
                } else {
                    next[team.teamId] = index;
                }
                index += 1;
            });
            return next;
        });
    }, [checkedInTeams, userPitchVotes, userChallengeVotes]);

    useEffect(() => {
        if (userDecisionVote?.value) {
            setDecisionChoice(userDecisionVote.value);
        }
        if (userGuessVote?.teamId || userGuessVote?.value) {
            setGuessSelection(userGuessVote.teamId || userGuessVote.value);
        }
    }, [userDecisionVote, userGuessVote]);

    const pitchLocked = Boolean(
        status?.state?.pitchLocked || localPitchLocked || userPitchVotes.length
    );
    const challengeLocked = Boolean(
        status?.state?.challengeLocked || localChallengeLocked || userChallengeVotes.length
    );

    const checkinsOpen = Boolean(status?.state?.checkinsOpen);
    const xadowStage = status?.state?.xadowStage || 'idle';
    const decisionDeadline = status?.state?.decisionDeadline || null;
    const guessDeadline = status?.state?.guessDeadline || null;
    const xadowDecision = status?.xadowDecision || null;
    const stateDecisionResults = status?.state?.decisionResults || null;
    const stateGuessResults = status?.state?.guessResults || null;

    const getTimeRemainingLabel = (isoDate) => {
        if (!isoDate) return null;
        const deadline = new Date(isoDate).getTime();
        const diff = deadline - nowTimestamp;
        if (diff <= 0) return '00:00';
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`;
    };

    const decisionVotes = useMemo(
        () => xadowVotes.filter((vote) => vote.stage === 'decision'),
        [xadowVotes]
    );

    const computedDecisionSummary = useMemo(() => {
        if (!decisionVotes.length) {
            return { yes: 0, no: 0, total: 0, majority: null };
        }
        const yes = decisionVotes.filter((vote) => (vote.value || '').toLowerCase() === 'yes').length;
        const no = decisionVotes.filter((vote) => (vote.value || '').toLowerCase() === 'no').length;
        return {
            yes,
            no,
            total: decisionVotes.length,
            majority: yes === no ? 'tie' : yes > no ? 'yes' : 'no',
        };
    }, [decisionVotes]);

    const publicDecisionResults = stateDecisionResults || computedDecisionSummary;

    const guessResultsList = useMemo(() => {
        let tally = stateGuessResults?.tally || null;
        if (!tally && xadowVotes.length) {
            tally = xadowVotes
                .filter((vote) => vote.stage === 'guess')
                .reduce((acc, vote) => {
                    const key = vote.teamId || vote.value || 'unknown';
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                }, {});
        }
        if (!tally) {
            return [];
        }
        return Object.entries(tally)
            .map(([teamId, count]) => ({
                teamId,
                count,
                name: projectsMap.get(teamId)?.displayName || projectsMap.get(teamId)?.name || teamId,
            }))
            .sort((a, b) => {
                if (b.count === a.count) {
                    return a.teamId.localeCompare(b.teamId);
                }
                return b.count - a.count;
            });
    }, [stateGuessResults, xadowVotes, projectsMap]);

    const isXadowDecisionActive = useMemo(() => {
        if (xadowStage !== 'decision' || !decisionDeadline) return false;
        const deadlineDate = new Date(decisionDeadline);
        return deadlineDate.getTime() > nowTimestamp;
    }, [xadowStage, decisionDeadline, nowTimestamp]);

    const isXadowGuessActive = useMemo(() => {
        if (xadowStage !== 'guess' || !guessDeadline) return false;
        const deadlineDate = new Date(guessDeadline);
        return deadlineDate.getTime() > nowTimestamp;
    }, [xadowStage, guessDeadline, nowTimestamp]);

    useEffect(() => {
        const previousStage = previousXadowStageRef.current;
        if (previousStage === 'decision' && xadowStage !== 'decision') {
            setXadowMessage(null);
        }
        previousXadowStageRef.current = xadowStage;
    }, [xadowStage]);

    const handleCheckInSubmit = async (event) => {
        event.preventDefault();
        if (!currentUserId) {
            setCheckInMessage({ type: 'error', text: 'Precisas de estar autenticado para fazer check-in.' });
            return;
        }
        if (!checkInTeam) {
            setCheckInMessage({ type: 'error', text: 'Seleciona uma equipa antes de confirmar.' });
            return;
        }
        const isAllowedTeam = allowedCheckInProjects.some((project) => {
            const id = project.slug || project.id || project.name;
            return id === checkInTeam;
        });
        if (!isAllowedTeam) {
            setCheckInMessage({ type: 'error', text: 'Essa equipa não está associada à tua conta.' });
            return;
        }
        try {
            setCheckInSubmitting(true);
            setCheckInMessage(null);
            await submitCheckIn({
                teamId: checkInTeam,
                memberId: currentUserId,
                eventDate: status?.eventDate,
            });
            setCheckInMessage({ type: 'success', text: 'Check-in confirmado! Boa sorte 🎉' });
            refresh();
        } catch (error) {
            console.error('Erro ao fazer check-in:', error);
            setCheckInMessage({
                type: 'error',
                text: error?.response?.data?.error || 'Não foi possível registar o check-in.',
            });
        } finally {
            setCheckInSubmitting(false);
        }
    };

    const handlePitchScoreChange = (teamId, category, value) => {
        if (ownTeamIds.has(teamId)) {
            return;
        }
        setPitchScores((prev) => {
            const current = prev[teamId] || {
                appeal: 5,
                surprise: 5,
                time: 5,
                content: 5,
                effort: 5,
            };
            return {
                ...prev,
                [teamId]: {
                    ...current,
                    [category]: ensureScoreRange(value),
                },
            };
        });
    };

    const handlePitchQuickSet = (teamId, category, value) => {
        if (ownTeamIds.has(teamId)) {
            return;
        }
        handlePitchScoreChange(teamId, category, value);
    };

    const handlePitchSubmit = async (event) => {
        event.preventDefault();
        if (!currentUserId) {
            setPitchMessage({ type: 'error', text: 'Autentica-te para votar.' });
            return;
        }
        try {
            setPitchSubmitting(true);
            setPitchMessage(null);
            const eligibleTeams = checkedInTeams.filter(
                (team) => !ownTeamIds.has(team.teamId)
            );
            if (!eligibleTeams.length) {
                setPitchMessage({
                    type: 'error',
                    text: 'Não há equipas elegíveis para avaliares — a tua própria equipa está bloqueada.',
                });
                setPitchSubmitting(false);
                return;
            }
            const votesPayload = eligibleTeams.map((team) => ({
                teamId: team.teamId,
                scores: pitchScores[team.teamId] || {
                    appeal: 5,
                    surprise: 5,
                    time: 5,
                    content: 5,
                    effort: 5,
                },
            }));
            await submitPitchVotes({
                voterId: currentUserId,
                votes: votesPayload,
                eventDate: status?.eventDate,
            });
            setPitchMessage({
                type: 'success',
                text: 'Voto registado com sucesso! 🔐',
            });
            setLocalPitchLocked(true);
            refresh();
        } catch (error) {
            console.error('Erro ao submeter votos Pitch:', error);
            setPitchMessage({
                type: 'error',
                text: error?.response?.data?.error || 'Não foi possível registar o voto.',
            });
        } finally {
            setPitchSubmitting(false);
        }
    };

    const handleChallengeOrderChange = (teamId, value) => {
        if (ownTeamIds.has(teamId)) {
            return;
        }
        setChallengeOrder((prev) => ({
            ...prev,
            [teamId]: value === '' ? '' : parseInt(value, 10),
        }));
    };

    const handleChallengeSubmit = async (event) => {
        event.preventDefault();
        if (!currentUserId) {
            setChallengeMessage({ type: 'error', text: 'Autentica-te para votar.' });
            return;
        }
        try {
            setChallengeSubmitting(true);
            setChallengeMessage(null);
            const eligibleTeams = checkedInTeams.filter(
                (team) => !ownTeamIds.has(team.teamId)
            );
            if (!eligibleTeams.length) {
                setChallengeMessage({
                    type: 'error',
                    text: 'Não podes ordenar a tua própria equipa — nenhuma outra equipa está disponível.',
                });
                setChallengeSubmitting(false);
                return;
            }
            const orderings = eligibleTeams.map((team) => ({
                teamId: team.teamId,
                order: challengeOrder[team.teamId] ?? '',
            }));
            await submitChallengeVotes({
                voterId: currentUserId,
                orderings,
                eventDate: status?.eventDate,
            });
            setChallengeMessage({
                type: 'success',
                text: 'Ordem registada! 🎯',
            });
            setLocalChallengeLocked(true);
            refresh();
        } catch (error) {
            console.error('Erro ao submeter votos Challenge:', error);
            setChallengeMessage({
                type: 'error',
                text: error?.response?.data?.error || 'Não foi possível guardar a ordem.',
            });
        } finally {
            setChallengeSubmitting(false);
        }
    };

    const handleDecisionVote = async (choice) => {
        if (!currentUserId) {
            setXadowMessage({ type: 'error', text: 'Autentica-te para votar.' });
            return;
        }
        if (decisionSubmitting) return;
        try {
            setDecisionSubmitting(true);
            setDecisionChoice(choice);
            setXadowMessage(null);
            await submitXadowDecisionVote({
                voterId: currentUserId,
                participate: choice === 'yes',
                eventDate: status?.eventDate,
            });
            setXadowMessage({
                type: 'success',
                text: 'Decisão registada. Espera pelo resultado do grupo 👁️',
            });
            refresh();
        } catch (error) {
            console.error('Erro na votação xad0w.b1ts decisão:', error);
            setXadowMessage({
                type: 'error',
                text: error?.response?.data?.error || 'Não foi possível registar a decisão.',
            });
            setDecisionChoice(userDecisionVote?.value || decisionChoice);
        } finally {
            setDecisionSubmitting(false);
        }
    };

    const handleGuessSubmit = async (event) => {
        event.preventDefault();
        if (!currentUserId) {
            setXadowMessage({ type: 'error', text: 'Autentica-te para votar.' });
            return;
        }
        if (!guessSelection) {
            setXadowMessage({ type: 'error', text: 'Escolhe uma equipa como suspeita.' });
            return;
        }
        if (ownTeamIds.has(guessSelection)) {
            setXadowMessage({ type: 'error', text: 'Não podes votar na tua própria equipa.' });
            return;
        }
        try {
            setGuessSubmitting(true);
            setXadowMessage(null);
            await submitXadowGuessVote({
                voterId: currentUserId,
                teamId: guessSelection,
                eventDate: status?.eventDate,
            });
            setXadowMessage({
                type: 'success',
                text: 'Voto registado. A identidade será revelada em breve 🕶️',
            });
            refresh();
        } catch (error) {
            console.error('Erro na votação xad0w.b1ts guess:', error);
            setXadowMessage({
                type: 'error',
                text: error?.response?.data?.error || 'Não foi possível registar o voto.',
            });
        } finally {
            setGuessSubmitting(false);
        }
    };

    const renderMessage = (message) => {
        if (!message) return null;
        return (
            <div className={`voting-message voting-message--${message.type}`}>
                {message.text}
            </div>
        );
    };

    const renderPitchControls = () => {
        if (!checkedInTeams.length) {
            return (
                <div className="placeholder-card">
                    <p>Nenhuma equipa fez check-in ainda. Assim que as equipas chegarem, vais poder votar aqui.</p>
                </div>
            );
        }
        return (
            <form className="pitch-grid" onSubmit={handlePitchSubmit}>
                {checkedInTeams.map((team) => {
                    const isOwnTeam = ownTeamIds.has(team.teamId);
                    const teamLocked = pitchLocked || isOwnTeam;
                    const scores = pitchScores[team.teamId] || {
                        appeal: 5,
                        surprise: 5,
                        time: 5,
                        content: 5,
                        effort: 5,
                    };
                    return (
                        <div
                            key={team.teamId}
                            className={`pitch-card ${teamLocked ? 'pitch-card--locked' : ''} ${
                                isOwnTeam ? 'pitch-card--self' : ''
                            }`}
                        >
                            <div className="pitch-card__header" style={{ '--team-color': team.color }}>
                                <h3>{team.name}</h3>
                                <span className="pitch-card__members-count">
                                    {team.members.length} participante{team.members.length === 1 ? '' : 's'}
                                </span>
                                {isOwnTeam && <span className="pitch-card__self-tag">A tua equipa</span>}
                            </div>
                            <div className="pitch-card__body">
                                {PITCH_CATEGORIES.map((category) => (
                                    <div key={category.key} className="pitch-category">
                                        <div className="pitch-category__label">
                                            <span className="pitch-category__emoji">{category.emoji}</span>
                                            <span>{category.label}</span>
                                        </div>
                                        <div className="pitch-category__controls">
                                            <div className="pitch-category__number">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={5}
                                                    step={1}
                                                    value={scores[category.key]}
                                                    disabled={teamLocked}
                                                    onChange={(event) =>
                                                        handlePitchScoreChange(
                                                            team.teamId,
                                                            category.key,
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="pitch-category__quick">
                                                {[1, 2, 3, 4, 5].map((value) => (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        className={`quick-score ${
                                                            value === scores[category.key] ? 'is-active' : ''
                                                        }`}
                                                    disabled={teamLocked}
                                                        onClick={() =>
                                                            handlePitchQuickSet(
                                                                team.teamId,
                                                                category.key,
                                                                value
                                                            )
                                                        }
                                                    >
                                                        {value}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isOwnTeam && (
                                    <p className="pitch-card__self-note">
                                        Não podes avaliar a tua própria equipa.
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div className="pitch-actions">
                    {renderMessage(pitchMessage)}
                    <button
                        type="submit"
                        className="pitch-submit-button"
                        disabled={pitchLocked || pitchSubmitting}
                    >
                        {pitchLocked ? 'Voto bloqueado' : pitchSubmitting ? 'A guardar...' : 'Votar no HackerPitch'}
                    </button>
                </div>
            </form>
        );
    };

    const renderChallengeControls = () => {
        if (!checkedInTeams.length) {
            return (
                <div className="placeholder-card">
                    <p>Sem equipas em check-in. Assim que alguém chegar, podes sugerir a ordem de apresentação.</p>
                </div>
            );
        }
        return (
            <form className="challenge-grid" onSubmit={handleChallengeSubmit}>
                {checkedInTeams.map((team) => {
                    const isOwnTeam = ownTeamIds.has(team.teamId);
                    return (
                    <div
                        key={team.teamId}
                        className={`challenge-card ${
                            challengeLocked ? 'challenge-card--locked' : ''
                        }`}
                        data-own-team={isOwnTeam ? 'true' : 'false'}
                    >
                        <div className="challenge-card__team">
                            <span className="challenge-card__badge" style={{ '--team-color': team.color }}>
                                {team.name.substring(0, 2).toUpperCase()}
                            </span>
                            <div>
                                <h3>{team.name}</h3>
                                {isOwnTeam && <span className="challenge-card__self-tag">A tua equipa</span>}
                            </div>
                        </div>
                        <div className="challenge-card__input">
                            <label htmlFor={`challenge-order-${team.teamId}`}>Ordem</label>
                            <input
                                id={`challenge-order-${team.teamId}`}
                                type="number"
                                value={challengeOrder[team.teamId] ?? ''}
                                onChange={(event) =>
                                    handleChallengeOrderChange(team.teamId, event.target.value)
                                }
                                disabled={challengeLocked || isOwnTeam}
                            />
                        </div>
                        {isOwnTeam && (
                            <p className="challenge-card__self-note">
                                Não podes definir a ordem da tua própria equipa.
                            </p>
                        )}
                    </div>
                );
                })}
                <div className="challenge-actions">
                    {renderMessage(challengeMessage)}
                    <button
                        type="submit"
                        className="challenge-submit-button"
                        disabled={challengeLocked || challengeSubmitting}
                    >
                        {challengeLocked
                            ? 'Ordem registada'
                            : challengeSubmitting
                            ? 'A guardar...'
                            : 'Votar no HackerChallenge'}
                    </button>
                </div>
            </form>
        );
    };

    const renderXadowSection = () => {
        const teamsList = projects.map((project, index) => ({
            id: project.slug || project.id || project.name,
            name: project.name || project.title || project.slug || project.id,
            color: TEAM_COLORS[index % TEAM_COLORS.length],
        }));

        if (xadowStage === 'idle') {
            return (
                <div className="placeholder-card">
                    <h3>xad0w.b1ts</h3>
                    <p>O admin ainda não abriu a votação misteriosa. Fica atento! 👀</p>
                </div>
            );
        }

        if (xadowStage === 'decision') {
            return (
                <div className="xadow-card">
                    <header className="xadow-card__header">
                        <h3>Decidimos caçar os xad0w.b1ts?</h3>
                        {decisionDeadline && isXadowDecisionActive && (
                            <span className="xadow-card__timer">
                                Tempo restante: {getTimeRemainingLabel(decisionDeadline)}
                            </span>
                        )}
                    </header>
                    <p className="xadow-card__info">
                        Tens 5 minutos para dizer se queres votar. Se a maioria aceitar, passamos para a fase de
                        descoberta!
                    </p>
                    {isXadowDecisionActive ? (
                        <>
                            <div className="xadow-card__actions">
                                <button
                                    type="button"
                                    className={`xadow-choice ${decisionChoice === 'yes' ? 'is-active' : ''}`}
                                    disabled={decisionSubmitting || !!userDecisionVote}
                                    onClick={() => handleDecisionVote('yes')}
                                >
                                    Bora caçar! 💣
                                </button>
                                <button
                                    type="button"
                                    className={`xadow-choice ${decisionChoice === 'no' ? 'is-active' : ''}`}
                                    disabled={decisionSubmitting || !!userDecisionVote}
                                    onClick={() => handleDecisionVote('no')}
                                >
                                    Passo esta ❌
                                </button>
                            </div>
                            {renderMessage(xadowMessage)}
                        </>
                    ) : (
                        <div className="xadow-results-banner">
                            <h4>Resultado da votação</h4>
                            <p>
                                <strong>Sim:</strong> {publicDecisionResults.yes} &nbsp; | &nbsp;
                                <strong>Não:</strong> {publicDecisionResults.no} &nbsp; | &nbsp;
                                <strong>Total:</strong> {publicDecisionResults.total}
                            </p>
                            <p>
                                {publicDecisionResults.majority === 'yes'
                                    ? '✅ Maioria aceitou investigar! Aguarda a próxima fase.'
                                    : publicDecisionResults.majority === 'no'
                                        ? '❌ A maioria preferiu não avançar. Aguarda decisão do admin.'
                                        : '⚖️ Empate — aguarda decisão do admin.'}
                            </p>
                        </div>
                    )}
                </div>
            );
        }

        if (xadowStage === 'guess') {
            return (
                <div className="xadow-card">
                    <header className="xadow-card__header">
                        <h3>Quem são os xad0w.b1ts?</h3>
                        {guessDeadline && isXadowGuessActive && (
                            <span className="xadow-card__timer">
                                Tempo restante: {getTimeRemainingLabel(guessDeadline)}
                            </span>
                        )}
                    </header>
                    {publicDecisionResults.total > 0 && (
                        <div className="xadow-results-banner">
                            <h4>Resultado da decisão anterior</h4>
                            <p>
                                <strong>Sim:</strong> {publicDecisionResults.yes} &nbsp; | &nbsp;
                                <strong>Não:</strong> {publicDecisionResults.no}
                            </p>
                            <p>
                                {publicDecisionResults.majority === 'yes'
                                    ? 'A maioria decidiu continuar! Boa caça!'
                                    : publicDecisionResults.majority === 'no'
                                        ? 'Mesmo assim avançamos — prepara-te.'
                                        : 'Empate — o admin decidiu continuar.'}
                            </p>
                        </div>
                    )}

                    {isXadowGuessActive ? (
                        <>
                            <p className="xadow-card__info">
                                Escolhe a equipa que achas que anda a operar nas sombras. Tensão máxima!
                            </p>
                            <form className="xadow-guess-grid" onSubmit={handleGuessSubmit}>
                                {teamsList.map((team) => {
                                    const isOwnTeam = ownTeamIds.has(team.id);
                                    const isSelected = guessSelection === team.id;
                                    return (
                                        <button
                                            type="button"
                                            key={team.id}
                                            className={`xadow-guess ${isSelected ? 'is-selected' : ''} ${
                                                isOwnTeam ? 'is-locked' : ''
                                            }`}
                                            style={{ '--team-color': team.color }}
                                            onClick={() => {
                                                if (isOwnTeam) {
                                                    setXadowMessage({
                                                        type: 'error',
                                                        text: 'Não podes votar na tua própria equipa.',
                                                    });
                                                    return;
                                                }
                                                setGuessSelection(team.id);
                                            }}
                                            disabled={guessSubmitting || !!userGuessVote || isOwnTeam}
                                            title={isOwnTeam ? 'Não podes votar na tua própria equipa.' : undefined}
                                        >
                                            <span className="xadow-guess__badge">
                                                {team.name.slice(0, 2).toUpperCase()}
                                            </span>
                                            <span>{team.name}</span>
                                        </button>
                                    );
                                })}
                                <div className="xadow-actions">
                                    {renderMessage(xadowMessage)}
                                    <button
                                        type="submit"
                                        className="xadow-submit-button"
                                        disabled={guessSubmitting || !!userGuessVote}
                                    >
                                        {guessSubmitting ? 'A enviar...' : userGuessVote ? 'Voto registado' : 'Votar'}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="xadow-loading">
                            <div className="xadow-spinner" />
                            <p>Votação encerrada! A processar resultados... 🔍</p>
                        </div>
                    )}
                </div>
            );
        }

        if (xadowStage === 'complete') {
            const playersSucceeded = Boolean(xadowDecision?.isXadowTeam);
            const actualTeamName = xadowDecision?.teamId
                ? projectsMap.get(xadowDecision.teamId)?.displayName || xadowDecision.teamId
                : null;
            const topGuess = guessResultsList.length ? guessResultsList[0] : null;
            const votesInfo = stateGuessResults
                ? {
                      votes: stateGuessResults.votes ?? 0,
                      eligible: stateGuessResults.eligible ?? 0,
                      required: stateGuessResults.required ?? 0,
                      hasEnough: stateGuessResults.hasEnoughVotes !== false,
                  }
                : null;
            const insufficientVotes = votesInfo ? !votesInfo.hasEnough : false;
            return (
                <div
                    className={`xadow-reveal ${
                        playersSucceeded ? 'xadow-reveal--villain' : 'xadow-reveal--escaped'
                    }`}
                >
                    <div className="xadow-reveal__content">
                        {insufficientVotes ? (
                            <>
                                <div className="escaped-icon">🕵️‍♂️</div>
                                <h3>Votos insuficientes</h3>
                                <p>Não houve votos suficientes (&gt;80%) para chegar a uma conclusão. Os xad0w.b1ts continuarão à solta!</p>
                            </>
                        ) : playersSucceeded ? (
                            <>
                                <div className="villain-mask" />
                                <h3>
                                    {actualTeamName
                                        ? `${actualTeamName} eram os xad0w.b1ts!`
                                        : 'Os xad0w.b1ts foram apanhados!'}
                                </h3>
                                <p>Fantástico! Os vilões foram expostos. Mantém a guarda alta para a próxima jornada.</p>
                            </>
                        ) : (
                            <>
                                <div className="escaped-icon">🕵️‍♂️</div>
                                <h3>Catástrofe: DESASTRE TOTAL! 💀</h3>
                                <p>Os xad0w.b1ts ESCAPARAM das vossas mãos! <strong>-10 pontos PJ pelo vosso julgamento FALHADO!</strong></p>
                                <p> A equipa xb continua à solta, e com mais 25 PS... e vocês pagaram o preço! 👁️
                                </p>
                            </>
                        )}
                        <div className="xadow-reveal__summary">
                            {playersSucceeded && actualTeamName && (
                                <p>
                                    <strong>Equipa alvo:</strong> {actualTeamName}
                                </p>
                            )}
                            {topGuess && (
                                <p>
                                    <strong>Palpite mais votado:</strong>{' '}
                                    {topGuess.name || topGuess.teamId} ({topGuess.count} voto{topGuess.count === 1 ? '' : 's'})
                                </p>
                            )}
                            {votesInfo && (
                                <p>
                                    <strong>Participação:</strong> {votesInfo.votes}/{votesInfo.eligible} votos (mín. {votesInfo.required})
                                </p>
                            )}
                            {guessResultsList.length > 0 && (
                                <ul className="xadow-reveal__ranking">
                                    {guessResultsList.map((entry) => (
                                        <li key={entry.teamId}>
                                            <span>{entry.name || entry.teamId}</span>
                                            <span>{entry.count}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    const renderTeamBlobs = () => {
        if (!checkedInTeams.length) {
            return (
                <div className="placeholder-card">
                    <p>Ainda sem check-ins. Sê o primeiro a marcar presença e desbloquear a votação! 🚀</p>
                </div>
            );
        }
        return (
            <div className="team-blob-grid">
                {checkedInTeams.map((team, index) => (
                    <div
                        key={team.teamId}
                        className="team-blob"
                        style={{
                            '--team-color': team.color,
                            '--blob-index': index,
                        }}
                    >
                        <div className="team-blob__header">
                            <span className="team-blob__emoji">🪐</span>
                            <h3>{team.name}</h3>
                        </div>
                        <div className="team-blob__members">
                            {team.members.map((member) => (
                                <span key={member.id} className="team-member-chip">
                                    {member.name}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (initialLoad || statusLoading) {
        return (
            <div className="hacknight-voting-page hacknight-voting-page--loading">
                <div className="loading-orb" />
                <p>A preparar o palco do HackNight...</p>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="hacknight-voting-page hacknight-voting-page--error">
                <p>{loadError}</p>
                <button type="button" onClick={() => window.location.reload()} className="retry-button">
                    Tentar novamente
                </button>
            </div>
        );
    }

    return (
        <div className="hacknight-voting-page">
            <header className="voting-header">
                <div>
                    <button
                        type="button"
                        className="back-button"
                        onClick={() => navigate('/hacknight')}
                    >
                        ← Voltar a HackNight
                    </button>
                    <h1>Hub de Votação HackNight</h1>
                    <p className="voting-subtitle">
                        Marca presença, vibra com os pitches e ajuda a desmascarar os xad0w.b1ts.
                    </p>
                </div>
                <div className="event-meta">
                    <span className="event-tag">Evento atual</span>
                    <strong>{status?.eventDate ? new Date(status.eventDate).toLocaleDateString() : 'Hoje'}</strong>
                </div>
            </header>

            <section className="voting-section">
                <div className="section-header">
                    <h2>Check-In</h2>
                    {checkinsOpen ? (
                        <span className="section-chip section-chip--open">Aberto</span>
                    ) : (
                        <span className="section-chip section-chip--closed">Fechado</span>
                    )}
                </div>
                <p className="section-description">
                    Traz a tua crew para a arena!
                </p>
                {renderTeamBlobs()}
                {checkinsOpen && (
                    <form className="checkin-form" onSubmit={handleCheckInSubmit}>
                        <div className="checkin-form__fields">
                            <label htmlFor="checkin-team">A tua equipa</label>
                            <select
                                id="checkin-team"
                                value={checkInTeam}
                                onChange={(event) => setCheckInTeam(event.target.value)}
                                disabled={checkInSubmitting || !allowedCheckInProjects.length}
                            >
                                <option value="">
                                    {allowedCheckInProjects.length
                                        ? 'Seleciona uma equipa'
                                        : 'Sem equipa atribuída'}
                                </option>
                                {allowedCheckInProjects.map((project) => {
                                    const id = project.slug || project.id || project.name;
                                    const label = project.name || project.title || id;
                                    return (
                                        <option key={id} value={id}>
                                            {label}
                                        </option>
                                    );
                                })}
                            </select>
                            {!allowedCheckInProjects.length && (
                                <p className="info-message">
                                    Parece que ainda não estás inscrito em nenhuma equipa. Fala com a organização para seres associado.
                                </p>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="checkin-submit-button"
                            disabled={checkInSubmitting || !allowedCheckInProjects.length}
                        >
                            {checkInSubmitting ? 'A confirmar...' : 'Fazer Check-In'}
                        </button>
                        {renderMessage(checkInMessage)}
                    </form>
                )}
            </section>

            <section className="voting-section">
                <div className="section-header">
                    <h2>HackerPitch</h2>
                    {pitchLocked ? (
                        <span className="section-chip section-chip--locked">Voto bloqueado</span>
                    ) : (
                        <span className="section-chip section-chip--ready">Pronto para votar</span>
                    )}
                </div>
                <p className="section-description">
                    Avalia cada equipa em cinco critérios. Valores entre 1 e 5 (por default tudo no máximo).
                </p>
                {renderPitchControls()}
            </section>

            <section className="voting-section">
                <div className="section-header">
                    <h2>HackerChallenge</h2>
                    {challengeLocked ? (
                        <span className="section-chip section-chip--locked">Voto bloqueado</span>
                    ) : (
                        <span className="section-chip section-chip--ready">Pronto para votar</span>
                    )}
                </div>
                <p className="section-description">
                    Define a ordem das equipas para o desafio.
                </p>
                {renderChallengeControls()}
            </section>

            <section className="voting-section">
                <div className="section-header">
                    <h2>xad0w.b1ts</h2>
                    <span className={`section-chip section-chip--stage-${xadowStage}`}>
                        {xadowStage === 'decision' && 'Decisão'}
                        {xadowStage === 'guess' && 'Palpite'}
                        {xadowStage === 'complete' && 'Revelação'}
                        {xadowStage === 'idle' && 'Aguardando'}
                    </span>
                </div>
                <p className="section-description">
                    A aventura misteriosa da HackNight. Primeiro decidimos se votamos, depois descobrimos quem são os xad0w.b1ts.
                </p>
                {renderXadowSection()}
            </section>
        </div>
    );
};

export default HackNightVotingPage;


