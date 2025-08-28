import { useState, useEffect, useMemo } from 'react';
import './HallOfFame.css';

const HallOfFame = () => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [animatedCards, setAnimatedCards] = useState(new Set());

    // Mock data for Hall of Fame categories with winners
    const categories = useMemo(() => [
        {
            id: 'pitch-month',
            title: 'Pitch do Mês',
            subtitle: 'Equipa que ganhou mais pontos no pitch da HackNight anterior',
            icon: '🎯',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            winner: {
                name: 'Cyber Warriors',
                photo: '/images/team-cyber-warriors.jpg',
                score: '1,200 pts',
                achievement: 'Pitch revolucionário sobre IA em Cybersecurity',
                badge: 'gold',
                streak: 2
            },
            rarity: 'legendary'
        },
        {
            id: 'rising-star',
            title: 'Estrela em Ascensão',
            subtitle: 'Equipa que ganhou mais pontos',
            icon: '⭐',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            winner: {
                name: 'Code Breakers',
                photo: '/images/team-code-breakers.jpg',
                score: '2,650 pts',
                achievement: 'Crescimento de 400% nos últimos 3 meses',
                badge: 'gold',
                streak: 1
            },
            rarity: 'epic'
        },
        {
            id: 'most-assists',
            title: 'Mais Assistências',
            subtitle: 'Jogador que contribuiu com mais pontos para a sua equipa',
            icon: '🤝',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            winner: {
                name: 'Alex Chen',
                photo: '/images/alex-chen.jpg',
                score: '850 pts',
                achievement: 'Contribuiu com 71% dos pontos da equipa',
                badge: 'platinum',
                streak: 3
            },
            rarity: 'rare'
        },
        {
            id: 'most-defenses',
            title: 'Mais Defesas',
            subtitle: 'Jogador que votou mais vezes corretamente no impostor',
            icon: '🛡️',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            winner: {
                name: 'Maria Santos',
                photo: '/images/maria-santos.jpg',
                score: '94% accuracy',
                achievement: '47/50 votações corretas no último mês',
                badge: 'diamond',
                streak: 1
            },
            rarity: 'epic'
        },
        {
            id: 'side-quester',
            title: 'Side Quester',
            subtitle: 'Player que completou uma side quest durante a última hacknight',
            icon: '🗺️',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            winner: {
                name: 'David Kim',
                photo: '/images/david-kim.jpg',
                score: 'Quest Master',
                achievement: 'Completou "The Hidden Algorithm" em tempo recorde',
                badge: 'mystic',
                streak: 1
            },
            rarity: 'legendary'
        },
        {
            id: 'best-xb',
            title: 'Best XB',
            subtitle: 'X-biter que completou mais missões sem ser descoberto',
            icon: '🕵️',
            gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            winner: {
                name: 'Sarah Johnson',
                photo: '/images/sarah-johnson.jpg',
                score: '12 missões',
                achievement: 'Infiltração perfeita durante 3 hacknight seguidas',
                badge: 'shadow',
                streak: 3
            },
            rarity: 'mythic'
        },
        {
            id: 'legacy-keeper',
            title: 'Legacy Keeper',
            subtitle: 'Para quem inclui mais lore no seu pitch',
            icon: '📜',
            gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
            winner: {
                name: 'Carlos Rodriguez',
                photo: '/images/carlos-rodriguez.jpg',
                score: 'Lore Master',
                achievement: 'Conectou 15 elementos da mitologia HackerSchool',
                badge: 'ancient',
                streak: 2
            },
            rarity: 'legendary'
        }
    ], []);

    const specialAchievements = useMemo(() => [
        {
            id: 'grand-slam',
            title: 'Grand Slam',
            description: 'Conquistou 4+ categorias diferentes no mesmo mês',
            winner: 'Alex Chen',
            icon: '🏆',
            rarity: 'mythic'
        },
        {
            id: 'hat-trick',
            title: 'Hat Trick',
            description: '3 vitórias consecutivas na mesma categoria',
            winner: 'Sarah Johnson',
            icon: '🎩',
            rarity: 'legendary'
        },
        {
            id: 'renaissance-hacker',
            title: 'Renaissance Hacker',
            description: 'Vitórias em categorias muito diferentes',
            winner: 'Maria Santos',
            icon: '🎨',
            rarity: 'epic'
        }
    ], []);

    useEffect(() => {
        // Animate cards on load
        const timer = setTimeout(() => {
            categories.forEach((_, index) => {
                setTimeout(() => {
                    setAnimatedCards(prev => new Set([...prev, index]));
                }, index * 100);
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [categories]);

    const filteredCategories = selectedCategory === 'all' 
        ? categories 
        : categories.filter(cat => cat.rarity === selectedCategory);

    const getRarityColor = (rarity) => {
        const colors = {
            common: '#95a5a6',
            rare: '#3498db',
            epic: '#9b59b6',
            legendary: '#f39c12',
            mythic: '#e74c3c'
        };
        return colors[rarity] || colors.common;
    };

    const getBadgeEmoji = (badge) => {
        const badges = {
            gold: '🥇',
            silver: '🥈',
            bronze: '🥉',
            platinum: '💎',
            diamond: '💠',
            mystic: '🔮',
            shadow: '🌙',
            ancient: '⚱️'
        };
        return badges[badge] || '🏅';
    };

    return (
        <div className="hall-of-fame">
            <div className="hall-header">
                <div className="hall-title-container">
                    <h1 className="hall-title">
                        <span className="title-icon">👑</span>
                        Hall of Fame
                        <span className="title-sparkle">✨</span>
                    </h1>
                    <p className="hall-subtitle">
                        Celebrando os maiores feitos da HackerSchool
                    </p>
                </div>
                
                <div className="filter-container">
                    <div className="filter-buttons">
                        <button 
                            className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('all')}
                        >
                            Todas
                        </button>
                        <button 
                            className={`filter-btn rarity-rare ${selectedCategory === 'rare' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('rare')}
                        >
                            Rare
                        </button>
                        <button 
                            className={`filter-btn rarity-epic ${selectedCategory === 'epic' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('epic')}
                        >
                            Epic
                        </button>
                        <button 
                            className={`filter-btn rarity-legendary ${selectedCategory === 'legendary' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('legendary')}
                        >
                            Legendary
                        </button>
                        <button 
                            className={`filter-btn rarity-mythic ${selectedCategory === 'mythic' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('mythic')}
                        >
                            Mythic
                        </button>
                    </div>
                </div>
            </div>

            <div className="categories-grid">
                {filteredCategories.map((category, index) => (
                    <div 
                        key={category.id}
                        className={`category-card ${animatedCards.has(index) ? 'animated' : ''} rarity-${category.rarity}`}
                        style={{ '--gradient': category.gradient }}
                    >
                        <div className="card-glow"></div>
                        <div className="card-header">
                            <div className="category-icon">{category.icon}</div>
                            <div className="rarity-badge" style={{ backgroundColor: getRarityColor(category.rarity) }}>
                                {category.rarity.toUpperCase()}
                            </div>
                        </div>
                        
                        <div className="card-content">
                            <h3 className="category-title">{category.title}</h3>
                            <p className="category-subtitle">{category.subtitle}</p>
                            
                            <div className="winner-section">
                                <div className="winner-avatar">
                                    <img 
                                        src={category.winner.photo} 
                                        alt={category.winner.name}
                                        onError={(e) => {
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(category.winner.name)}&background=random&size=100`;
                                        }}
                                    />
                                    <div className="badge-overlay">
                                        {getBadgeEmoji(category.winner.badge)}
                                    </div>
                                    {category.winner.streak > 1 && (
                                        <div className="streak-indicator">
                                            🔥 {category.winner.streak}x
                                        </div>
                                    )}
                                </div>
                                
                                <div className="winner-info">
                                    <h4 className="winner-name">{category.winner.name}</h4>
                                    <p className="winner-score">{category.winner.score}</p>
                                    <p className="winner-achievement">{category.winner.achievement}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="card-particles">
                            <div className="particle"></div>
                            <div className="particle"></div>
                            <div className="particle"></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="special-achievements">
                <h2 className="special-title">
                    <span className="special-icon">🌟</span>
                    Conquistas Especiais
                </h2>
                <div className="special-grid">
                    {specialAchievements.map((achievement) => (
                        <div 
                            key={achievement.id}
                            className={`special-card rarity-${achievement.rarity}`}
                        >
                            <div className="special-icon-large">{achievement.icon}</div>
                            <h4 className="special-achievement-title">{achievement.title}</h4>
                            <p className="special-description">{achievement.description}</p>
                            <div className="special-winner">
                                <strong>{achievement.winner}</strong>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="hall-footer">
                <div className="rotation-info">
                    <h3>🔄 Sistema de Rotação</h3>
                    <p>As categorias são atualizadas mensalmente baseadas na performance da comunidade</p>
                    <div className="next-update">
                        Próxima atualização: <strong>1 de Janeiro, 2025</strong>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HallOfFame;