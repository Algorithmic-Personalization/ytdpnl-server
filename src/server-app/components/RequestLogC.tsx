import React, {useRef, useState, useEffect} from 'react';
import Box from '@mui/material/Box';

import * as d3 from 'd3';

import {type RequestLog} from '../../server/models/requestLog';

export const RequestLogC: React.FC<{
	entries: RequestLog[];
}> = ({entries}) => {
	const container = useRef<HTMLDivElement>(null);

	const [width, setWidth] = useState(800);
	const [height, setHeight] = useState(400);
	const m = 20;

	const x = d3.scaleLinear([0, entries.length - 1], [m, width - m]);
	const y = d3.scaleLinear((d3.extent(entries, rl => rl.latencyMs) ?? [0, 0]) as [number, number], [height - m, m]);
	const line = d3.line<RequestLog>(rl => rl.latencyMs);

	useEffect(() => {
		window.addEventListener('resize', () => {
			if (container.current) {
				setWidth(container.current.clientWidth);
				setHeight(container.current.clientHeight);
			}
		});
	}, []);

	const ui = (
		<Box
			ref={container}
			sx={{
				width: '100%',
			}}
		>
			<svg {...{width, height}}>
				<path fill='none' stroke='currentColor' strokeWidth={1.5} d={line(entries) ?? ''} />
				<g fill='white' stroke='currentColor' strokeWidth={1.5}>
					{entries.map((rl, i) => (
						<circle key={i} cx={x(i)} cy={y(rl.latencyMs)} r={Math.log(rl.latencyMs)} />
					))}
				</g>
			</svg>
		</Box>
	);

	return ui;
};

export default RequestLogC;
