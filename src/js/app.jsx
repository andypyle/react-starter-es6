/// Import react + react-dom
import React from 'react';
import ReactDOM from 'react-dom';

/// Import main Application component
import Application from './components/application';

/// Render main Application component on load
window.onload = function(){
	ReactDOM.render(
		<Application />,
		document.getElementById('main')
	);
};