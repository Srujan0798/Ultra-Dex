import React from 'react';
import { Text } from 'ink';
import Spinner from 'ink-spinner';

const LoadingSpinner = ({ text = 'Loading...', isActive = true }) => {
	if (!isActive) {
		return null;
	}

	return (
		<Text>
			<Spinner type="clock" /> {text}
		</Text>
	);
};

export default LoadingSpinner;