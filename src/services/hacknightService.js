import nodeApi from './nodeApi';

export const getHacknightStatus = async (eventDate) => {
    const response = await nodeApi.get('/hacknight/status', {
        params: eventDate ? { eventDate } : undefined,
    });
    return response.data;
};

export const submitCheckIn = async ({ teamId, memberId, eventDate }) => {
    const response = await nodeApi.post('/hacknight/check-in', {
        teamId,
        memberId,
        eventDate,
    });
    return response.data;
};

export const submitPitchVotes = async ({ voterId, votes, eventDate }) => {
    const response = await nodeApi.post('/hacknight/vote/pitch', {
        voterId,
        votes,
        eventDate,
    });
    return response.data;
};

export const submitChallengeVotes = async ({ voterId, orderings, eventDate }) => {
    const response = await nodeApi.post('/hacknight/vote/challenge', {
        voterId,
        orderings,
        eventDate,
    });
    return response.data;
};

export const submitXadowDecisionVote = async ({ voterId, participate, eventDate }) => {
    const response = await nodeApi.post('/hacknight/vote/xadow/decision', {
        voterId,
        participate,
        eventDate,
    });
    return response.data;
};

export const submitXadowGuessVote = async ({ voterId, teamId, eventDate }) => {
    const response = await nodeApi.post('/hacknight/vote/xadow/guess', {
        voterId,
        teamId,
        eventDate,
    });
    return response.data;
};

export const triggerXadowStage = async ({ stage, durationMinutes, eventDate, resetVotes }) => {
    const response = await nodeApi.post('/hacknight/xadow/trigger', {
        stage,
        durationMinutes,
        eventDate,
        resetVotes,
    });
    return response.data;
};

export const setXadowTargetTeam = async ({ teamId }) => {
    const response = await nodeApi.post('/hacknight/xadow/set-target', {
        teamId,
    });
    return response.data;
};

export const updateHacknightState = async (patch) => {
    const response = await nodeApi.post('/hacknight/state', patch);
    return response.data;
};

export const resetHacknightEvent = async (eventDate) => {
    const response = await nodeApi.post('/hacknight/reset', {
        eventDate,
    });
    return response.data;
};

export const exportHacknightVotes = async (eventDate) => {
    const response = await nodeApi.post(
        '/hacknight/export',
        { eventDate },
        { responseType: 'blob' }
    );
    return response.data;
};

