import {type DataSource} from 'typeorm';

import {type RouteDefinition} from '../lib/routeCreation';
import {type LogFunction} from '../lib/logger';

import Participant, {isValidPhase} from '../models/participant';
import {isValidExperimentArm} from '../../common/models/event';
import TransitionEvent, {TransitionReason} from '../models/transitionEvent';

import {daysElapsed} from '../../util';

import {type ExternalNotifier} from '../lib/externalNotifier';

const updateParticipantPhase = (
	dataSource: DataSource,
	notifier: ExternalNotifier,
	log: LogFunction,
) =>
	(fromPhase: number, toPhase: number) =>
		async (participant: Participant): Promise<Participant> => {
			if (fromPhase === toPhase) {
				return participant;
			}

			const latestTransition = await dataSource
				.getRepository(TransitionEvent)
				.findOne({
					where: {
						participantId: participant.id,
					},
					order: {
						createdAt: 'DESC',
					},
				});

			const startOfLatestPhase = latestTransition?.createdAt ?? participant.createdAt;

			if (latestTransition) {
				log('latest transition for participant', latestTransition);
			} else {
				log(
					'no previous transition for participant, using is creation date as entry into previous phase',
					startOfLatestPhase,
				);
			}

			const transition = new TransitionEvent();
			transition.fromPhase = fromPhase;
			transition.toPhase = toPhase;
			transition.participantId = participant.id;
			transition.reason = TransitionReason.FORCED;
			transition.numDays = daysElapsed(startOfLatestPhase, new Date());

			try {
				const resultParticipant = await dataSource.transaction(async manager => {
					log('info', 'saving transition', transition);
					await manager.save(transition);
					participant = await manager.findOneOrFail(Participant, {where: {id: participant.id}});
					participant.phase = toPhase;
					await manager.save(participant);
					return participant;
				});

				log('success', 'saving transition', transition.id);

				const n = notifier.makeParticipantNotifier({participantCode: participant.code});
				void n.notifyPhaseChange(transition.createdAt, fromPhase, toPhase);

				return resultParticipant;
			} catch (e) {
				log('error saving transition', e);
				throw e;
			}
		};

export const updateParticipantDefinition: RouteDefinition<Participant> = {
	verb: 'put',
	path: '/api/participant/:code',
	makeHandler: ({createLogger, dataSource, notifier}) => async (req): Promise<Participant> => {
		const log = createLogger(req.requestId);
		log('Received update participant request');

		const {id: _unused, phase, arm} = req.body as Record<string, string | number>;
		const {code} = req.params;

		if (!code || typeof code !== 'string') {
			throw new Error('Invalid participant email');
		}

		const participantRepo = dataSource.getRepository(Participant);

		const participantEntity = await participantRepo.findOneBy({code});

		if (!participantEntity) {
			throw new Error('Participant with that email does not exist');
		}

		const {phase: previousPhase} = participantEntity;

		if (isValidExperimentArm(arm)) {
			participantEntity.arm = arm;
		}

		if (phase && !isValidPhase(phase)) {
			throw new Error('Invalid phase, must be one of: 0, 1, 2');
		}

		if (isValidPhase(phase)) {
			return updateParticipantPhase(dataSource, notifier, log)(
				previousPhase, phase,
			)(
				participantEntity,
			);
		}

		return participantRepo.save(participantEntity);
	},
};

export default updateParticipantDefinition;
