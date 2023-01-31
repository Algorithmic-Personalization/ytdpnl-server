import type Participant from '../../common/models/participant';

import type SessionOverview from './SessionOverview';

export type ParticipantOverview = Participant & {
	sessionCount: number;
	firstSessionDate: Date;
	latestSessionDate: Date;
	sessions: SessionOverview[];
};

export default ParticipantOverview;
