import {type TestDb} from '../server/tests-util/db';
import resetDb from '../server/tests-util/db';

import {createSaveParticipantTransition} from '../server/lib/participant';
import {createMockParticipantActivityNotifier} from '../server/tests-util/createMockParticipantActivityNotifier';

import TransitionEvent from '../server/models/transitionEvent';

describe('updateParticipantPhase', () => {
	let db: TestDb;

	beforeAll(async () => {
		db = await resetDb();
	});

	afterAll(async () => {
		await db.tearDown();
	});

	it('should make a participant transition phases', async () => {
		const notifier = createMockParticipantActivityNotifier();

		const saveTransition = createSaveParticipantTransition({
			dataSource: db.dataSource,
			notifier,
		});

		const participant = await db.createParticipant();

		const transition = db.createTransitionEvent(participant);

		await saveTransition(
			participant,
			transition,
			undefined,
		);

		expect(notifier.onPhaseChange).toHaveBeenCalledTimes(1);
	});

	it('should not save the transition more than once for the same participant and the same transition', async () => {
		const transitionRepo = db.dataSource.getRepository(TransitionEvent);
		const flaky = async () => {
			const notifier = createMockParticipantActivityNotifier();

			const saveTransition = createSaveParticipantTransition({
				dataSource: db.dataSource,
				notifier,
			});

			const participant = await db.createParticipant();

			const preExistingTransition = db.createTransitionEvent(participant);
			preExistingTransition.createdAt = new Date(Date.now() - (1000 * 60 * 10));

			await transitionRepo.save(
				preExistingTransition,
			);

			const [t1, t2] = [
				db.createTransitionEvent(participant),
				db.createTransitionEvent(participant),
			];

			await Promise.all([
				saveTransition(participant, t1, undefined),
				saveTransition(participant, t2, undefined),
			]);

			expect(notifier.onPhaseChange).toHaveBeenCalledTimes(1);
		};

		for (let i = 0; i < 10; ++i) {
			// eslint-disable-next-line no-await-in-loop
			await flaky();
		}

		await flaky();
	});
});
