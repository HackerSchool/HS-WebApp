import { Fragment, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {getProjects} from '../../services/projectService';
import {getMembers} from '../../services/memberService';
import {getMemberTasks} from '../../services/taskService';
import { getProjectTasks } from '../../services/taskService';
import './Leaderboard.css';

const LeaderboardTable = () => {
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [individuals, setIndividuals] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('teams');
    const [sortBy, setSortBy] = useState('totalPoints');
    const [expandedTeams, setExpandedTeams] = useState(new Set());
    const [expandedIndividuals, setExpandedIndividuals] = useState(new Set());
    const [teamHistory, setTeamHistory] = useState({});
    const [individualHistory, setIndividualHistory] = useState({});

    useEffect(() => {
        fetchLeaderboardData();
    }, []);

    // Função helper para calcular pontos a partir das tasks
    const calculatePointsFromTasks = (tasks) => {
        const points = { pj: 0, pcc: 0 };
        
        if (!tasks || !Array.isArray(tasks)) {
            return points;
        }
        
        tasks.forEach(task => {
            if (task.point_type === 'pj') {
                points.pj += task.points || 0;
            } else if (task.point_type === 'pcc') {
                points.pcc += task.points || 0;
            }
        });
        
        return points;
    };

    const fetchLeaderboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // 1. Buscar projetos e membros básicos
            const [projectsData, membersData] = await Promise.all([
                getProjects(),
                getMembers()
            ]);
            
            // 2. Buscar tasks para cada projeto (em paralelo)
            const projectsWithTasks = await Promise.all(
                projectsData.map(async (project) => {
                    try {
                        const tasks = await getProjectTasks(project.slug);
                        const calculatedPoints = calculatePointsFromTasks(tasks);
                        
                        return {
                            ...project,
                            pjPoints: calculatedPoints.pj,
                            pccPoints: calculatedPoints.pcc,
                            totalPoints: calculatedPoints.pj + calculatedPoints.pcc,
                            name: project.name || project.title,
                            id: project.id
                        };
                    } catch (error) {
                        console.error(`Error fetching tasks for project ${project.slug}:`, error);
                        // Em caso de erro, retorna projeto com 0 pontos
                        return {
                            ...project,
                            pjPoints: 0,
                            pccPoints: 0,
                            totalPoints: 0,
                            name: project.name || project.title,
                            id: project.id
                        };
                    }
                })
            );
            
            // 3. Buscar tasks para cada membro (em paralelo)
            const membersWithTasks = await Promise.all(
                membersData.map(async (member) => {
                    try {
                        const tasks = await getMemberTasks(member.username);
                        const calculatedPoints = calculatePointsFromTasks(tasks);
                        
                        return {
                            ...member,
                            pjPoints: calculatedPoints.pj,
                            pccPoints: calculatedPoints.pcc,
                            totalPoints: calculatedPoints.pj + calculatedPoints.pcc,
                            name: member.name || `${member.firstName} ${member.lastName}`,
                            id: member.id
                        };
                    } catch (error) {
                        console.error(`Error fetching tasks for member ${member.username}:`, error);
                        // Em caso de erro, retorna membro com 0 pontos
                        return {
                            ...member,
                            pjPoints: 0,
                            pccPoints: 0,
                            totalPoints: 0,
                            name: member.name || `${member.firstName} ${member.lastName}`,
                            id: member.id
                        };
                    }
                })
            );
            
            setTeams(projectsWithTasks);
            setIndividuals(membersWithTasks);
            
            // Calcular stats baseadas nos dados reais
            const calculatedStats = {
                totalTeams: projectsWithTasks.length,
                totalIndividuals: membersWithTasks.length,
                totalPjPoints: membersWithTasks.reduce((sum, member) => sum + member.pjPoints, 0),
                totalPccPoints: membersWithTasks.reduce((sum, member) => sum + member.pccPoints, 0)
            };
            
            setStats(calculatedStats);
            
        } catch (error) {
            console.error('Error fetching leaderboard data:', error);
            setError('Failed to load leaderboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Sort data based on sortBy selection
    const getSortedData = (data) => {
        return [...data].sort((a, b) => {
            switch (sortBy) {
                case 'totalPoints':
                    return b.totalPoints - a.totalPoints;
            case 'pjPoints':
                return (b.pjPoints || 0) - (a.pjPoints || 0);
            case 'pccPoints':
                return (b.pccPoints || 0) - (a.pccPoints || 0);
                default:
                    return b.totalPoints - a.totalPoints;
            }
        });
    };

    const toggleTeamExpansion = async (teamName) => {
        const newExpandedTeams = new Set(expandedTeams);
        
        if (newExpandedTeams.has(teamName)) {
            newExpandedTeams.delete(teamName);
        } else {
            newExpandedTeams.add(teamName);
            // Buscar histórico do projeto
            if (!teamHistory[teamName]) {
                try {
                    // Encontrar o projeto para obter o slug
                    const project = teams.find(t => t.name === teamName);
                    if (project && project.slug) {
                        const tasks = await getProjectTasks(project.slug);
                        
                        // Converter tasks para o formato do histórico
                        const history = tasks.map(task => ({
                            membro: task.username,
                            data: task.finished_at,
                            descrição: task.description,
                            tipo: task.point_type.toUpperCase(), // PJ ou PCC
                            pontos: task.points
                        }));
                        
                        setTeamHistory(prev => ({
                            ...prev,
                            [teamName]: history
                        }));
                    }
                } catch (error) {
                    console.error('Error fetching team history:', error);
                    // Em caso de erro, manter array vazio
                    setTeamHistory(prev => ({
                        ...prev,
                        [teamName]: []
                    }));
                }
            }
        }
        
        setExpandedTeams(newExpandedTeams);
    };

    const toggleIndividualExpansion = async (individualName) => {
        const newExpandedIndividuals = new Set(expandedIndividuals);
        
        if (newExpandedIndividuals.has(individualName)) {
            newExpandedIndividuals.delete(individualName);
        } else {
            newExpandedIndividuals.add(individualName);
            // Buscar histórico do membro
            if (!individualHistory[individualName]) {
                try {
                    // Encontrar o membro para obter o username
                    const member = individuals.find(i => i.name === individualName);
                    if (member && member.username) {
                        const tasks = await getMemberTasks(member.username);
                        
                        // Converter tasks para o formato do histórico
                        const history = tasks.map(task => ({
                            membro: task.username,
                            data: task.finished_at,
                            descrição: task.description,
                            tipo: task.point_type.toUpperCase(), // PJ ou PCC
                            pontos: task.points
                        }));
                        
                        setIndividualHistory(prev => ({
                            ...prev,
                            [individualName]: history
                        }));
                    }
                } catch (error) {
                    console.error('Error fetching individual history:', error);
                    // Em caso de erro, manter array vazio
                    setIndividualHistory(prev => ({
                        ...prev,
                        [individualName]: []
                    }));
                }
            }
        }
        
        setExpandedIndividuals(newExpandedIndividuals);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getPointTypeColor = (type) => {
        return type === 'PJ' ? '#e74c3c' : '#3498db';
    };

    // Função para retry em caso de erro
    const handleRetry = () => {
        fetchLeaderboardData();
    };

    if (loading) {
        return <div className="loading">Loading leaderboard...</div>;
    }

    if (error) {
        return (
            <div className="error">
                <p>{error}</p>
                <button onClick={handleRetry} className="retry-button">
                    Try Again
                </button>
            </div>
        );
    }

    // Get sorted data
    const sortedTeams = getSortedData(teams);
    const sortedIndividuals = getSortedData(individuals);


    return (
        <div className="leaderboard-container">
            <div className="leaderboard-header">
                <h1>Hacker League Leaderboard</h1>
                <div className="stats">
                    <div className="stat-item">
                        <span className="stat-number">{stats.totalIndividuals || 0}</span>
                        <span className="stat-label">Participants</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{stats.totalTeams || 0}</span>
                        <span className="stat-label">Teams</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{stats.totalPccPoints + stats.totalPjPoints || 0}</span>
                        <span className="stat-label">Total Points</span>
                    </div>
                </div>
            </div>



            {activeTab === 'teams' && (
                <div className="leaderboard-table">
                    <table>
                        <thead>
                            <tr>
                                <th>
                                    <div className="header-controls">
                                        <span>Rank</span>
                                        <select className="inline-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                            <option value="totalPoints">Total Points</option>
                                            <option value="pjPoints">PJ Points</option>
                                            <option value="pccPoints">PCC Points</option>
                                        </select>
                                    </div>
                                </th>
                                <th>
                                    <div className="header-controls">
                                        <span>Team</span>
                                        <select className="inline-select" value={activeTab} onChange={(e) => setActiveTab(e.target.value)}>
                                            <option value="teams">Teams</option>
                                            <option value="individuals">Individuals</option>
                                        </select>
                                    </div>
                                </th>
                                {sortBy === 'pjPoints' ? (
                                    <>
                                        <th>PCC Points</th>
                                        <th>Total Points</th>
                                        <th className="highlighted-column">PJ Points</th>
                                    </>
                                ) : sortBy === 'pccPoints' ? (
                                    <>
                                        <th>PJ Points</th>
                                        <th>Total Points</th>
                                        <th className="highlighted-column">PCC Points</th>
                                    </>
                                ) : (
                                    <>
                                        <th>PJ Points</th>
                                        <th>PCC Points</th>
                                        <th className="highlighted-column">Total Points</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTeams.map((team, index) => (
                                <Fragment key={team.name}>
                                    <tr 
                                        className={`${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : index === 3 ? 'rank-4' : index === 4 ? 'rank-5' : 'top-three'} ${expandedTeams.has(team.name) ? 'expanded' : ''}`}
                                        onClick={() => toggleTeamExpansion(team.name)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td className="rank">
                                            <div className="rank-content">
                                                {index + 1}
                                                {index === 0 && <span className="medal">🥇</span>}
                                                {index === 1 && <span className="medal">🥈</span>}
                                                {index === 2 && <span className="medal">🥉</span>}
                                                {index === 3 && <span className="medal">🎖️</span>}
                                                {index === 4 && <span className="medal">🎖️</span>}
                                            </div>
                                        </td>
                                        <td className="team-name">
                                            <div className="team-name-content">
                                                {team.name}
                                            </div>
                                        </td>
                                        {sortBy === 'pjPoints' ? (
                                            <>
                                                <td className="pcc-points">{team.pccPoints}</td>
                                                <td className="total-points dimmed">{team.totalPoints}</td>
                                                <td className="pj-points highlighted">{team.pjPoints}</td>
                                            </>
                                        ) : sortBy === 'pccPoints' ? (
                                            <>
                                                <td className="pj-points">{team.pjPoints}</td>
                                                <td className="total-points dimmed">{team.totalPoints}</td>
                                                <td className="pcc-points highlighted">{team.pccPoints}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="pj-points">{team.pjPoints}</td>
                                                <td className="pcc-points">{team.pccPoints}</td>
                                                <td className="total-points highlighted">{team.totalPoints}</td>
                                            </>
                                        )}
                                        
                                    </tr>
                                    {expandedTeams.has(team.name) && (
                                        <tr className="history-row">
                                            <td colSpan="5">
                                                <div className="team-history">
                                                    <h4>Recent Activity</h4>
                                                    {teamHistory[team.name] ? (
                                                        <>
                                                            <div className="history-list">
                                                                {teamHistory[team.name].map((entry, idx) => (
                                                                    <div key={idx} className="history-item">
                                                                        <div className="history-info">
                                                                            <span className="member-name">{entry.membro}</span>
                                                                            <span className="activity-date">{formatDate(entry.data)}</span>
                                                                            <span className="activity-description">{entry.descrição}</span>
                                                                        </div>
                                                                        <div className="history-points">
                                                                            <span 
                                                                                className="point-type"
                                                                                style={{ color: getPointTypeColor(entry.tipo) }}
                                                                            >
                                                                                {entry.tipo}
                                                                            </span>
                                                                            <span className="point-value">+{entry.pontos}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="history-footer">
                                                                <button 
                                                                    className="btn btn-secondary see-more-btn"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigate('/history');
                                                                    }}
                                                                >
                                                                    See more...
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="loading-history">Loading log...</div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'individuals' && (
                <div className="leaderboard-table">
                    <table>
                        <thead>
                            <tr>
                                <th>
                                    <div className="header-controls">
                                        <span>Rank</span>
                                        <select className="inline-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                            <option value="totalPoints">Total Points</option>
                                            <option value="pjPoints">PJ Points</option>
                                            <option value="pccPoints">PCC Points</option>
                                        </select>
                                    </div>
                                </th>
                                <th>
                                    <div className="header-controls">
                                        <span>Name</span>
                                        <select className="inline-select" value={activeTab} onChange={(e) => setActiveTab(e.target.value)}>
                                            <option value="teams">Teams</option>
                                            <option value="individuals">Individuals</option>
                                        </select>
                                    </div>
                                </th>
                                {sortBy === 'pjPoints' ? (
                                    <>
                                        <th>PCC Points</th>
                                        <th>Total Points</th>
                                        <th className="highlighted-column">PJ Points</th>
                                    </>
                                ) : sortBy === 'pccPoints' ? (
                                    <>
                                        <th>PJ Points</th>
                                        <th>Total Points</th>
                                        <th className="highlighted-column">PCC Points</th>
                                    </>
                                ) : (
                                    <>
                                        <th>PJ Points</th>
                                        <th>PCC Points</th>
                                        <th className="highlighted-column">Total Points</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedIndividuals.map((individual, index) => (
                                <Fragment key={individual.name}>
                                    <tr 
                                        className={`${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : index === 3 ? 'rank-4' : index === 4 ? 'rank-5' : 'top-three'} ${expandedIndividuals.has(individual.name) ? 'expanded' : ''}`}
                                        onClick={() => toggleIndividualExpansion(individual.name)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td className="rank">
                                            <div className="rank-content">
                                                {index + 1}
                                                {index === 0 && <span className="medal">🥇</span>}
                                                {index === 1 && <span className="medal">🥈</span>}
                                                {index === 2 && <span className="medal">🥉</span>}
                                                {index === 3 && <span className="medal">🎖️</span>}
                                                {index === 4 && <span className="medal">🎖️</span>}
                                            </div>
                                        </td>
                                        <td className="individual-name">
                                            <div className="team-name-content">
                                                {individual.name}
                                            </div>
                                        </td>
                                        {sortBy === 'pjPoints' ? (
                                            <>
                                                <td className="pcc-points">{individual.pccPoints}</td>
                                                <td className="total-points dimmed">{individual.totalPoints}</td>
                                                <td className="pj-points highlighted">{individual.pjPoints}</td>
                                            </>
                                        ) : sortBy === 'pccPoints' ? (
                                            <>
                                                <td className="pj-points">{individual.pjPoints}</td>
                                                <td className="total-points dimmed">{individual.totalPoints}</td>
                                                <td className="pcc-points highlighted">{individual.pccPoints}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="pj-points">{individual.pjPoints}</td>
                                                <td className="pcc-points">{individual.pccPoints}</td>
                                                <td className="total-points highlighted">{individual.totalPoints}</td>
                                            </>
                                        )}
                                    </tr>
                                    {expandedIndividuals.has(individual.name) && (
                                        <tr className="history-row">
                                            <td colSpan="5">
                                                <div className="individual-history">
                                                    <h4>Recent Activity</h4>
                                                    {individualHistory[individual.name] ? (
                                                        <>
                                                            <div className="history-list">
                                                                {individualHistory[individual.name].map((entry, idx) => (
                                                                    <div key={idx} className="history-item">
                                                                        <div className="history-info">
                                                                            <span className="activity-date">{formatDate(entry.data)}</span>
                                                                            <span className="activity-description">{entry.descrição}</span>
                                                                        </div>
                                                                        <div className="history-points">
                                                                            <span 
                                                                                className="point-type"
                                                                                style={{ color: getPointTypeColor(entry.tipo) }}
                                                                            >
                                                                                {entry.tipo}
                                                                            </span>
                                                                            <span className="point-value">+{entry.pontos}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="history-footer">
                                                                <button 
                                                                    className="btn btn-secondary see-more-btn"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigate('/history');
                                                                    }}
                                                                >
                                                                    See more...
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="loading-history">Loading log...</div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default LeaderboardTable;
