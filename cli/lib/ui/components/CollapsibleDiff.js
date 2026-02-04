import React, { useState } from 'react';
import { Box, Text, Static } from 'ink';
import { ChevronRight, ChevronDown } from './icons.js';

const CollapsibleDiff = ({ title, diffContent, initiallyExpanded = false }) => {
	const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

	const toggleExpand = () => {
		setIsExpanded(!isExpanded);
	};

	return (
		<Box flexDirection="column">
			<Box onClick={toggleExpand} flexDirection="row" alignItems="center">
				{isExpanded ? <ChevronDown /> : <ChevronRight />}
				<Text bold onClick={toggleExpand}>
					{title}
				</Text>
			</Box>

			{isExpanded && (
				<Box marginLeft={2} flexDirection="column">
					<Box borderStyle="round" borderColor="blue" padding={1}>
						<Static items={diffContent.split('\n')}>
							{(line, index) => (
								<Box key={index}>
									{line.startsWith('+') ? (
										<Text color="green">{line}</Text>
									) : line.startsWith('-') ? (
										<Text color="red">{line}</Text>
									) : (
										<Text>{line}</Text>
									)}
								</Box>
							)}
						</Static>
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default CollapsibleDiff;