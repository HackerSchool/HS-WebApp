import { useState, useEffect, useMemo } from 'react';
import adminAPIService from '../../../services/adminAPIService';
import { getProjects } from '../../../services/projectService';
import {
    updateHacknightState,
    triggerXadowStage,
    setXadowTargetTeam,
    resetHacknightEvent,
    exportHacknightVotes,
} from '../../../services/hacknightService';
import useHacknightStatus from '../../../hooks/useHacknightStatus';
import './ContentManagement.css';

const HackNightAdmin = () => {
    const [hacknightData, setHacknightData] = useState({});
    const [teams, setTeams] = useState([]);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [stateSaving, setStateSaving] = useState(false);
    const [stateMessage, setStateMessage] = useState('');
    const [xadowDuration, setXadowDuration] = useState(5);

    const {
        status: hacknightStatus,
        loading: statusLoading,
        error: statusError,
        refresh: refreshStatus,
    } = useHacknightStatus({ pollingInterval: 15000 });

    useEffect(() => {
        loadData();
        
        // Listen for real-time updates
        const unsubscribe = adminAPIService.addUpdateListener((updateData) => {
            if (updateData.type === 'hacknight') {
                setHacknightData(prev => ({
                    ...prev,
                    [updateData.key]: updateData.data
                }));
            }
        });

        return unsubscribe;
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [data, projectsData] = await Promise.all([
                adminAPIService.getHackNightData(),
                getProjects()
            ]);
            setHacknightData(data);
            setTeams(projectsData);
        } catch (error) {
            setMessage('Error loading data. Please try again.');
            console.error('Error loading HackNight data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (section, field, value) => {
        setHacknightData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        try {
            // Save all sections
            const sections = ['nextEvent', 'hackerChallenge', 'lastWinner', 'finalCall'];
            for (const section of sections) {
                if (hacknightData[section]) {
                    await adminAPIService.updateHackNightData(section, hacknightData[section]);
                }
            }
            
            setMessage('HackNight data saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Error saving data. Please try again.');
            console.error('Error saving HackNight data:', error);
        } finally {
            setSaving(false);
        }
    };

    const normalizedState = useMemo(() => ({
        checkinsOpen: hacknightStatus?.state?.checkinsOpen ?? false,
        pitchLocked: hacknightStatus?.state?.pitchLocked ?? false,
        challengeLocked: hacknightStatus?.state?.challengeLocked ?? false,
        xadowStage: hacknightStatus?.state?.xadowStage ?? 'idle',
        decisionDeadline: hacknightStatus?.state?.decisionDeadline ?? null,
        guessDeadline: hacknightStatus?.state?.guessDeadline ?? null,
        xadowTargetTeam: hacknightStatus?.state?.xadowTargetTeam ?? '',
        decisionResults: hacknightStatus?.state?.decisionResults ?? null,
        guessResults: hacknightStatus?.state?.guessResults ?? null,
    }), [hacknightStatus]);

    const currentEventDate = hacknightStatus?.eventDate || hacknightData?.nextEvent?.date || null;

    const handleStateUpdate = async (patch, successMessage = 'State updated!') => {
        if (!currentEventDate) {
            setStateMessage('⚠️ Define o próximo evento antes de controlar a votação.');
            return;
        }
        setStateSaving(true);
        setStateMessage('');
        try {
            await updateHacknightState(patch);
            await refreshStatus();
            setStateMessage(successMessage);
        } catch (error) {
            console.error('Error updating HackNight state:', error);
            setStateMessage(error?.response?.data?.error || 'Erro a atualizar o estado. Tenta novamente.');
        } finally {
            setStateSaving(false);
        }
    };

    const handleTriggerStage = async (stage) => {
        if (!currentEventDate) {
            setStateMessage('⚠️ Define o próximo evento antes de controlar xad0w.b1ts.');
            return;
        }
        setStateSaving(true);
        setStateMessage('');
        try {
            await triggerXadowStage({
                stage,
                durationMinutes: stage === 'decision' || stage === 'guess' ? xadowDuration : undefined,
                eventDate: currentEventDate,
                resetVotes: stage === 'decision',
            });
            await refreshStatus();
            setStateMessage(stage === 'decision'
                ? 'Janela de decisão aberta!'
                : stage === 'guess'
                    ? 'Janela de palpite aberta!'
                    : 'Estado de xad0w.b1ts atualizado.');
        } catch (error) {
            console.error('Error triggering xad0w stage:', error);
            setStateMessage(error?.response?.data?.error || 'Erro ao atualizar a fase xad0w.b1ts.');
        } finally {
            setStateSaving(false);
        }
    };

    const handleResetEvent = async () => {
        if (!currentEventDate) {
            setStateMessage('⚠️ Define o próximo evento antes de fazer reset.');
            return;
        }
        setStateSaving(true);
        setStateMessage('');
        try {
            await resetHacknightEvent(currentEventDate);
            await refreshStatus();
            setStateMessage('Votação resetada com sucesso.');
        } catch (error) {
            console.error('Error resetting hacknight event:', error);
            setStateMessage(error?.response?.data?.error || 'Erro ao resetar a votação.');
        } finally {
            setStateSaving(false);
        }
    };

    const handleExportVotes = async () => {
        if (!currentEventDate) {
            setStateMessage('⚠️ Define o próximo evento antes de exportar.');
            return;
        }
        setStateSaving(true);
        setStateMessage('');
        try {
            const blob = await exportHacknightVotes(currentEventDate);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const safeDate = currentEventDate.replace(/[:]/g, '-');
            link.download = `hacknight_votes_${safeDate}.zip`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setStateMessage('Export concluído com sucesso.');
        } catch (error) {
            console.error('Error exporting votes:', error);
            setStateMessage(error?.response?.data?.error || 'Erro ao exportar votos.');
        } finally {
            setStateSaving(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading HackNight data...</div>;
    }

    return (
        <div className="content-management">
            <div className="content-header">
                <h2>🌙 HackNight Management</h2>
                <p>Manage the next HackNight event and related content</p>
            </div>

            {message && (
                <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
                    {message}
                </div>
            )}
            {stateMessage && (
                <div
                    className={`alert ${stateMessage.toLowerCase().includes('erro') || stateMessage.includes('⚠️') ? 'alert-error' : 'alert-success'}`}
                    style={{ marginTop: '1rem' }}
                >
                    {stateMessage}
                </div>
            )}

            <div className="sections-grid">
                {/* Next Event Section */}
                <div className="section-card full-width">
                    <div className="section-header">
                        <span className="section-icon">📅</span>
                        <h3>Next HackNight Event</h3>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={hacknightData.nextEvent.isActive}
                                onChange={(e) => handleInputChange('nextEvent', 'isActive', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Event Name</label>
                            <input
                                type="text"
                                value={hacknightData.nextEvent.name}
                                onChange={(e) => handleInputChange('nextEvent', 'name', e.target.value)}
                                placeholder="e.g., HackNight Setembro"
                            />
                        </div>

                        <div className="form-group">
                            <label>Event Date & Time</label>
                            <input
                                type="datetime-local"
                                value={hacknightData.nextEvent.date}
                                onChange={(e) => handleInputChange('nextEvent', 'date', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirmed Hackers</label>
                            <input
                                type="number"
                                value={hacknightData.nextEvent.confirmedHackers}
                                onChange={(e) => handleInputChange('nextEvent', 'confirmedHackers', parseInt(e.target.value) || 0)}
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                {/* HackerChallenge Section */}
                <div className="section-card">
                    <div className="section-header">
                        <span className="section-icon">🎯</span>
                        <h3>HackerChallenge</h3>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={hacknightData.hackerChallenge.isActive}
                                onChange={(e) => handleInputChange('hackerChallenge', 'isActive', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            value={hacknightData.hackerChallenge.title}
                            onChange={(e) => handleInputChange('hackerChallenge', 'title', e.target.value)}
                            placeholder="HackerChallenge"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={hacknightData.hackerChallenge.description}
                            onChange={(e) => handleInputChange('hackerChallenge', 'description', e.target.value)}
                            placeholder="Challenge description..."
                            rows="4"
                        />
                    </div>

                    <div className="form-group">
                        <label>Status Label</label>
                        <input
                            type="text"
                            value={hacknightData.hackerChallenge.statusLabel || hacknightData.hackerChallenge.status || 'Coming Soon'}
                            onChange={(e) => handleInputChange('hackerChallenge', 'statusLabel', e.target.value)}
                            placeholder="e.g., Coming Soon, Live Now"
                        />
                    </div>

                    <div className="form-group">
                        <label>Status State</label>
                        <select
                            value={hacknightData.hackerChallenge.status || 'coming-soon'}
                            onChange={(e) => handleInputChange('hackerChallenge', 'status', e.target.value)}
                        >
                            <option value="coming-soon">Coming Soon</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Button Text</label>
                        <input
                            type="text"
                            value={hacknightData.hackerChallenge.buttonText || 'Learn More'}
                            onChange={(e) => handleInputChange('hackerChallenge', 'buttonText', e.target.value)}
                            placeholder="e.g., Register Now, Learn More"
                        />
                    </div>

                    <div className="form-group">
                        <label>Button URL</label>
                        <input
                            type="url"
                            value={hacknightData.hackerChallenge.buttonUrl || ''}
                            onChange={(e) => handleInputChange('hackerChallenge', 'buttonUrl', e.target.value)}
                            placeholder="https://example.com/challenge"
                        />
                    </div>
                </div>

                {/* Last Winner Section */}
                <div className="section-card">
                    <div className="section-header">
                        <span className="section-icon">🏆</span>
                        <h3>Last Winner</h3>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={hacknightData.lastWinner.isActive}
                                onChange={(e) => handleInputChange('lastWinner', 'isActive', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="form-group">
                        <label>Select Winning Team</label>
                        <select
                            value={hacknightData.lastWinner.teamSlug || ''}
                            onChange={(e) => {
                                const selectedTeam = teams.find(t => t.slug === e.target.value);
                                handleInputChange('lastWinner', 'teamSlug', e.target.value);
                                handleInputChange('lastWinner', 'name', selectedTeam?.name || '');
                            }}
                            disabled={!hacknightData.lastWinner.isActive}
                        >
                            <option value="">No winner yet</option>
                            {teams.map(team => (
                                <option key={team.slug} value={team.slug}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                        <small className="form-help" style={{ color: '#b8c1ec', fontSize: '0.85rem', marginTop: '0.5rem', display: 'block' }}>
                            {hacknightData.lastWinner.isActive ? 'Choose the winning team from your projects' : 'Enable to select a winner'}
                        </small>
                    </div>

                    <div className="form-group">
                        <label>Winner Description</label>
                        <textarea
                            value={hacknightData.lastWinner.description}
                            onChange={(e) => handleInputChange('lastWinner', 'description', e.target.value)}
                            placeholder="Amazing achievement description..."
                            rows="3"
                        />
                    </div>
                </div>

                {/* Final Call Section */}
                <div className="section-card">
                    <div className="section-header">
                        <span className="section-icon">⚡</span>
                        <h3>Final Call to Action</h3>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={hacknightData.finalCall.isActive}
                                onChange={(e) => handleInputChange('finalCall', 'isActive', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            value={hacknightData.finalCall.title}
                            onChange={(e) => handleInputChange('finalCall', 'title', e.target.value)}
                            placeholder="e.g., X-Biters are still on the loose!"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={hacknightData.finalCall.description}
                            onChange={(e) => handleInputChange('finalCall', 'description', e.target.value)}
                            placeholder="Call to action description..."
                            rows="4"
                        />
                    </div>

                    <div className="form-group">
                        <label>Button Text</label>
                        <input
                            type="text"
                            value={hacknightData.finalCall.buttonText || 'Join the Hunt'}
                            onChange={(e) => handleInputChange('finalCall', 'buttonText', e.target.value)}
                            placeholder="e.g., Join the Hunt, Register Now"
                        />
                    </div>

                    <div className="form-group">
                        <label>Button URL</label>
                        <input
                            type="url"
                            value={hacknightData.finalCall.buttonUrl || ''}
                            onChange={(e) => handleInputChange('finalCall', 'buttonUrl', e.target.value)}
                            placeholder="https://example.com/register"
                        />
                    </div>
                </div>

            </div>

            <div className="section-card full-width" style={{ marginTop: '2rem' }}>
                <div className="section-header">
                    <span className="section-icon">🗳️</span>
                    <h3>HackNight Voting Controls</h3>
                </div>

                {statusLoading && <p className="info-text">A carregar estado da votação...</p>}
                {statusError && (
                    <p className="info-text" style={{ color: '#ff6b6b' }}>
                        Erro a carregar estado atual. Garante que o backend Node está ativo.
                    </p>
                )}

                <div className="form-row">
                    <div className="form-group">
                        <label>Evento atual</label>
                        <input
                            type="text"
                            value={currentEventDate ? new Date(currentEventDate).toLocaleString() : 'Sem evento ativo'}
                            readOnly
                        />
                        <small className="form-help">
                            Os controlos abaixo aplicam-se ao evento atual.
                        </small>
                    </div>
                    <div className="form-group">
                        <label>Duração (min) para fases xad0w</label>
                        <input
                            type="number"
                            min="1"
                            value={xadowDuration}
                            onChange={(e) => setXadowDuration(parseInt(e.target.value, 10) || 1)}
                            disabled={stateSaving}
                        />
                    </div>
                </div>

                <div className="toggle-grid">
                    <label className="toggle-label">
                        <span>Check-in aberto</span>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={normalizedState.checkinsOpen}
                                onChange={(e) => handleStateUpdate(
                                    { checkinsOpen: e.target.checked },
                                    e.target.checked ? 'Check-in aberto.' : 'Check-in fechado.'
                                )}
                                disabled={stateSaving}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </label>
                    <label className="toggle-label">
                        <span>HackerPitch bloqueado</span>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={normalizedState.pitchLocked}
                                onChange={(e) => handleStateUpdate(
                                    { pitchLocked: e.target.checked },
                                    e.target.checked ? 'HackerPitch bloqueado.' : 'HackerPitch desbloqueado.'
                                )}
                                disabled={stateSaving}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </label>
                    <label className="toggle-label">
                        <span>HackerChallenge bloqueado</span>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={normalizedState.challengeLocked}
                                onChange={(e) => handleStateUpdate(
                                    { challengeLocked: e.target.checked },
                                    e.target.checked ? 'HackerChallenge bloqueado.' : 'HackerChallenge desbloqueado.'
                                )}
                                disabled={stateSaving}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </label>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Fase atual xad0w.b1ts</label>
                        <input
                            type="text"
                            value={normalizedState.xadowStage}
                            readOnly
                        />
                        <small className="form-help">
                            Deadlines &nbsp;
                            {normalizedState.decisionDeadline
                                ? `decisão ${new Date(normalizedState.decisionDeadline).toLocaleString()}`
                                : 'decisão -'}
                            {' | '}
                            {normalizedState.guessDeadline
                                ? `palpite ${new Date(normalizedState.guessDeadline).toLocaleString()}`
                                : 'palpite -'}
                        </small>
                    </div>
                </div>

                <div className="button-grid">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleTriggerStage('decision')}
                        disabled={stateSaving}
                    >
                        Abrir decisão (reinicia votos)
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleTriggerStage('guess')}
                        disabled={stateSaving}
                    >
                        Abrir palpite
                    </button>
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => handleTriggerStage('idle')}
                        disabled={stateSaving}
                    >
                        Voltar a idle
                    </button>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Equipa xad0w.b1ts (secreta)</label>
                        <select
                            value={normalizedState.xadowTargetTeam || ''}
                            onChange={async (e) => {
                                const teamId = e.target.value || null;
                                setStateSaving(true);
                                setStateMessage('');
                                try {
                                    await setXadowTargetTeam({ teamId });
                                    await refreshStatus();
                                    setStateMessage('Equipa xad0w.b1ts definida!');
                                } catch (error) {
                                    console.error('Error setting xad0w target team:', error);
                                    setStateMessage(error?.response?.data?.error || 'Erro ao definir equipa xad0w.b1ts.');
                                } finally {
                                    setStateSaving(false);
                                }
                            }}
                            disabled={stateSaving}
                        >
                            <option value="">Seleciona uma equipa</option>
                            {teams.map(team => (
                                <option key={team.slug} value={team.slug}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                        <small className="form-help">
                            Apenas visível para admins. Define antes de abrir a fase de palpites.
                        </small>
                    </div>
                    <div className="form-group">
                        <label>Resumo da decisão</label>
                        {normalizedState.decisionResults ? (
                            <div className="decision-results-card">
                                <span>Sim: {normalizedState.decisionResults.yes}</span>
                                <span>Não: {normalizedState.decisionResults.no}</span>
                                <span>Total: {normalizedState.decisionResults.total}</span>
                                <strong>
                                    {normalizedState.decisionResults.majority === 'yes'
                                        ? '✅ Maioria quer avançar'
                                        : normalizedState.decisionResults.majority === 'no'
                                            ? '❌ Maioria quer parar'
                                            : '⚖️ Empate'}
                                </strong>
                            </div>
                        ) : (
                            <p className="form-help">Aparece automaticamente após os 5 minutos da fase Decision.</p>
                        )}
                    </div>
                </div>

                {normalizedState.guessResults && (
                    <div className="results-summary-card">
                        <h4>Resumo dos palpites</h4>
                        <ul>
                            {Object.entries(normalizedState.guessResults.tally).map(([teamId, count]) => (
                                <li key={teamId}>
                                    {teams.find(team => team.slug === teamId)?.name || teamId}: {count}
                                </li>
                            ))}
                        </ul>
                        <strong>
                            {normalizedState.guessResults.success
                                ? 'Os hackers descobriram os xad0w.b1ts! 🎉'
                                : 'Os xad0w.b1ts escaparam desta vez.'}
                        </strong>
                    </div>
                )}

                <div className="button-grid">
                    <button
                        type="button"
                        className="btn btn-danger"
                        onClick={handleResetEvent}
                        disabled={stateSaving}
                    >
                        Reset votos do evento
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleExportVotes}
                        disabled={stateSaving}
                    >
                        Exportar votos (.zip)
                    </button>
                </div>
            </div>

            <div className="action-buttons">
                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save All Changes'}
                </button>
            </div>
        </div>
    );
};

export default HackNightAdmin;
