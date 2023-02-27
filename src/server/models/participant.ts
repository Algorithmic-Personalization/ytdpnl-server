/* eslint-disable @typescript-eslint/no-inferrable-types */

import {Entity, Column, OneToMany} from 'typeorm';
import {IsNotEmpty, IsString} from 'class-validator';

import Model from '../../common/lib/model';
import {ExperimentArm} from '../../common/models/event';
import DailyActivityTime from './dailyActivityTime';

@Entity()
export class Participant extends Model {
	@IsNotEmpty()
	@Column()
	@IsString()
		email: string = '';

	@IsNotEmpty()
	@Column()
	@IsString()
		code: string = '';

	@Column()
		arm: ExperimentArm = ExperimentArm.TREATMENT;

	@OneToMany(() => DailyActivityTime, activityTime => activityTime.participant)
		activityTimes?: DailyActivityTime[];
}

export default Participant;
