class WindowManager {
constructor() {
	this.windows = [];
	this.draggedWindow = null;
	this.dragOffset = { x: 0, y: 0 };
	this.maximizedWindow = null;
	this.isDragging = false;
	this.dragStartPos = { x: 0, y: 0 };
	
	this.init();
}

init() {
	document.body.classList.add('js-enabled');
	
	// Hide loading message
	setTimeout(() => {
		const loadingMessage = document.querySelector('.loading-message');
		if (loadingMessage) {
			loadingMessage.style.display = 'none';
		}
	}, 500);

	this.createWindows();
	this.setupEventListeners();
	
	// Show windows with staggered bounce animation
	setTimeout(() => {
		this.windows.forEach((windowObj, index) => {
			setTimeout(() => {
				windowObj.element.style.opacity = '1';
				windowObj.element.classList.add('bounce-in');
			}, index * 150);
		});
	}, 600);
}

createWindows() {
	const links = document.querySelectorAll('.window-links a');
	
	links.forEach((link, index) => {
		const window = this.createWindow(link);
		this.resizeWindow(window);
		this.windows.push(window);
	});

	// Create welcome window
	const welcomeWindow = this.createTextWindow(document.querySelector('#welcome-content'));
	this.resizeWindow(welcomeWindow);
	welcomeWindow.resizeControl.style.display = 'block'; // Show resize control for welcome window
	welcomeWindow.element.style.width = 400 + 'px'
	welcomeWindow.element.style.height = 360 + 'px'
	this.windows.push(welcomeWindow);
}

createTextWindow(el) {
	const windowEl = document.createElement('div');
	windowEl.className = 'window maximized';
	
	const title = el.dataset.title;
	
	const header = document.createElement('div');
	header.className = 'window-header';
	windowEl.appendChild(header);
	header.innerHTML = `
		<div class="window-controls">
			<div class="window-control close"></div>
			<div class="window-control minimize"></div>
			<div class="window-control maximize"></div>
		</div>
		<div class="address-bar noselect" title="${title}">${title}</div>
	`;
	// this.setupEventListeners(header);
	this.dragAndDropControls(windowEl, header);
		
	const windowContent = document.createElement('div');
	windowContent.className = 'window-content';
	windowEl.appendChild(windowContent);

	const windowPreview = document.createElement('div');
	windowPreview.className = 'window-preview';
	windowPreview.classList.add('noselect');
	windowPreview.textContent = title;
	windowPreview.style.display = 'none'; // Hide preview for text windows
	windowContent.appendChild(windowPreview);
	this.dragAndDropControls(windowEl, windowPreview);
	
	windowContent.appendChild(el);

	// Random initial position
	const maxX = window.innerWidth * 0.5;
	const maxY = window.innerHeight * 0.5;
	const x = Math.random() * maxX;
	const y = Math.random() * maxY;
	
	windowEl.style.left = x + 'px';
	windowEl.style.top = y + 'px';
	windowEl.style.opacity = '0';
	
	document.body.appendChild(windowEl);

	return {
		element: windowEl,
		title: title,
		isMaximized: true,
		content: windowContent,
		preview: windowPreview
	};
}

createWindow(link) {
	const windowEl = document.createElement('div');
	windowEl.className = 'window minified';
	
	const title = link.dataset.title || link.textContent;
	const url = link.href;
	
	// windowEl.innerHTML = `
	//     <div class="window-header">
	//         <div class="window-controls">
	//             <div class="window-control close"></div>
	//             <div class="window-control minimize"></div>
	//             <div class="window-control maximize"></div>
	//         </div>
	//         <div class="address-bar noselect" title="${url}">${url}</div>
	//     </div>
	// `;
	const header = document.createElement('div');
	header.className = 'window-header';
	windowEl.appendChild(header);
	header.innerHTML = `
		<div class="window-controls">
			<div class="window-control close"></div>
			<div class="window-control minimize"></div>
			<div class="window-control maximize"></div>
		</div>
		<div class="address-bar noselect" title="${url}">${url}</div>
	`;
	// this.setupEventListeners(header);
	this.dragAndDropControls(windowEl, header);
		
		// <div class="window-content">
		//     <div class="window-preview">${title}</div>
		// </div>
	const windowContent = document.createElement('div');
	windowContent.className = 'window-content';
	windowEl.appendChild(windowContent);

	const windowPreview = document.createElement('div');
	windowPreview.className = 'window-preview';
	windowPreview.classList.add('noselect');
	windowPreview.textContent = title;
	windowContent.appendChild(windowPreview);
	this.dragAndDropControls(windowEl, windowPreview);
	
	windowPreview.style.backgroundImage = link.dataset.previewImg ? `url(${link.dataset.previewImg})` : 'url(img/links.png)';
	windowPreview.style.backgroundBlendMode = 'overlay';
	windowPreview.style.backgroundSize = 'cover';

	// Random initial position
	const maxX = window.innerWidth - 180;
	const maxY = window.innerHeight - 120;
	const x = Math.random() * maxX;
	const y = Math.random() * maxY;
	
	windowEl.style.left = x + 'px';
	windowEl.style.top = y + 'px';
	windowEl.style.opacity = '0';
	
	document.body.appendChild(windowEl);

	return {
		element: windowEl,
		url: url,
		title: title,
		isMaximized: false,
		content: windowContent,
		preview: windowPreview
	};
}

setupEventListeners() {
	// document.addEventListener('mousedown', this.handleMouseDown.bind(this));
	// document.addEventListener('mousemove', this.handleMouseMove.bind(this));
	// document.addEventListener('mouseup', this.handleMouseUp.bind(this));
	document.addEventListener('click', this.handleClick.bind(this));
}

handleMouseDown(e) {
	const windowEl = e.target.closest('.window');
	// if (!windowEl || windowEl.classList.contains('maximized')) return;
	
	this.draggedWindow = this.windows.find(w => w.element === windowEl);
	if (!this.draggedWindow) return;
	
	const rect = windowEl.getBoundingClientRect();
	this.dragOffset = {
		x: e.clientX - rect.left,
		y: e.clientY - rect.top
	};
	
	this.dragStartPos = {
		x: e.clientX,
		y: e.clientY
	};
	
	this.isDragging = false;
	this.setFrontWindow(this.draggedWindow);
	// this.draggedWindow.iframe.style.pointerEvents = 'none'; // Disable iframe pointer events while dragging
}

dragAndDropControls(windowEl, handle) {
	let newX = 0, newY = 0, startX = 0, startY = 0;
	let curX = 0, curY;

	const validatePosition = () => {
		if(curX < 10) {
			curX = 10;
		}
		else if(curX > window.innerWidth - windowEl.offsetWidth - 10) {
			curX = window.innerWidth - windowEl.offsetWidth - 10;
		}
		if(curY < 10) {
			curY = 10;
		}
		else if(curY > window.innerHeight - windowEl.offsetHeight - 10) {
			curY = window.innerHeight - windowEl.offsetHeight - 10;
		}

		windowEl.style.top = curY + 'px'
		windowEl.style.left = curX + 'px'
	};

	const mouseDown = (e) => {
		if (e.button != 0) return; // Only handle left mouse button
		
		// Handle address bar clicks
		const windowEl = e.target.closest('.window');

		if (e.target.classList.contains('address-bar')) {
			const windowObj = this.windows.find(w => w.element === windowEl);
			if (windowObj && windowObj.url) {
				return;
			}
		}
		this.clickInitiated = Date.now();
		this.draggedWindow = windowEl;
		e.preventDefault();

		startX = e.clientX
		startY = e.clientY

		document.addEventListener('mousemove', mouseMove)
		document.addEventListener('mouseup', mouseUp)
		// document.addEventListener('mouseleave', mouseLeave)
		this.mouseBlocker.style.display = 'block';
		this.setFrontWindow(windowEl);
	}

	const mouseMove = (e) => {
		newX = startX - e.clientX 
		newY = startY - e.clientY 
	
		startX = e.clientX
		startY = e.clientY

		curX = windowEl.offsetLeft - newX;
		curY = windowEl.offsetTop - newY;

		validatePosition();
	}

	const cleanUp = () => {
		document.removeEventListener('mousemove', mouseMove)
		document.removeEventListener('mouseup', cleanUp)
		document.removeEventListener('mouseleave', cleanUp)
		this.mouseBlocker.style.display = 'none';
	}

	const mouseUp = (e) => {
		cleanUp();
	}

	// document.addEventListener('mouseleave',
	const mouseLeave = () => {
		cleanUp();
	}

	handle.addEventListener('mousedown', mouseDown)
	handle.style.cursor = 'grab';
	window.addEventListener("resize", () => validatePosition());

	if(this.mouseBlocker == null) {
		this.mouseBlocker = document.createElement('div');
		this.mouseBlocker.className = 'mouse-blocker';
		this.mouseBlocker.style.position = 'fixed';
		this.mouseBlocker.style.zIndex = '9999';
		this.mouseBlocker.style.backgroundColor = 'rgba(100, 0, 50, 0.0)';
		this.mouseBlocker.style.display = 'none'; // Initially hidden
		this.mouseBlocker.style.top = '0';
		this.mouseBlocker.style.left = '0';
		this.mouseBlocker.style.width = '100%';
		this.mouseBlocker.style.height = '100%';
		document.body.appendChild(this.mouseBlocker);
	}
	
	
}

resizeWindow(windowObj) {
	const resizeControl = document.createElement('div');
	resizeControl.className = 'resize-control';
	// this.resizeWindow(windowObj.element, resizeControl);
	windowObj.element.appendChild(resizeControl);
	windowObj.resizeControl = resizeControl;
	resizeControl.style.display = 'none';

	const minWidth = 300; // Minimum width
	const minHeight = 200; // Minimum height
	let newX = 0, newY = 0, startX = 0, startY = 0;
	let curX = 0, curY;

	const validatePosition = () => {
		if(curX < minWidth) {
			curX = minWidth;
		}
		// // else if(curX > window.innerWidth - windowEl.offsetWidth - 10) {
		// // 	curX = window.innerWidth - windowEl.offsetWidth - 10;
		// // }
		if(curY < minHeight) {
			curY = minHeight;
		}
		// else if(curY > window.innerHeight - windowEl.offsetHeight - 10) {
		// 	curY = window.innerHeight - windowEl.offsetHeight - 10;
		// }

		windowObj.width = curX 
		windowObj.height = curY
		windowObj.element.style.width = curX + 'px'
		windowObj.element.style.height = curY + 'px'
	};

	const mouseDown = (e) => {
		this.draggedWindow = null;
		e.preventDefault();

		startX = e.clientX
		startY = e.clientY

		document.addEventListener('mousemove', mouseMove)
		document.addEventListener('mouseup', mouseUp)
		// document.addEventListener('mouseleave', mouseLeave)
		this.mouseBlocker.style.display = 'block';
	}

	const mouseMove = (e) => {
		newX = startX - e.clientX 
		newY = startY - e.clientY 
	
		startX = e.clientX
		startY = e.clientY

		newX = e.clientX;
		newY = e.clientY;

		curX = newX - windowObj.element.offsetLeft;
		curY = newY - windowObj.element.offsetTop;

		validatePosition();
	}

	const cleanUp = () => {
		document.removeEventListener('mousemove', mouseMove)
		document.removeEventListener('mouseup', cleanUp)
		document.removeEventListener('mouseleave', cleanUp)
		this.mouseBlocker.style.display = 'none';
	}

	const mouseUp = (e) => {
		cleanUp();
	}

	const mouseLeave = () => {
		cleanUp();
	}

	resizeControl.addEventListener('mousedown', mouseDown)
	resizeControl.style.cursor = 'nwse-resize';
	// window.addEventListener("resize", () => validatePosition());
	
}

setFrontWindow(windowEl) {
	for( const win of this.windows) {
		if (win.element !== windowEl) {
			win.element.style.zIndex = '';
		}
	}
	windowEl.style.zIndex = this.windows.length + 1; // Bring to front
}

handleMouseMove(e) {
	if (!this.draggedWindow) return;

	const dragDistance = Math.sqrt(
		Math.pow(e.clientX - this.dragStartPos.x, 2) + 
		Math.pow(e.clientY - this.dragStartPos.y, 2)
	);

	if (dragDistance > 5) {
		this.isDragging = true;
	}

	if (this.isDragging) {
		e.preventDefault();
		e.stopPropagation();
		
		const x = e.clientX - this.dragOffset.x;
		const y = e.clientY - this.dragOffset.y;
		
		// // Keep window within bounds
		// const maxX = window.innerWidth - this.draggedWindow.element.offsetWidth;
		// const maxY = window.innerHeight - this.draggedWindow.element.offsetHeight;
		
		// const boundedX = Math.max(0, Math.min(x, maxX));
		// const boundedY = Math.max(0, Math.min(y, maxY));
		
		// this.draggedWindow.element.style.left = boundedX + 'px';
		// this.draggedWindow.element.style.top = boundedY + 'px';
		this.keepWindowInBounds(this.draggedWindow, x, y);
	}
}

keepWindowInBounds(windowObj, x, y) {
	// Keep window within bounds
	const maxX = window.innerWidth - windowObj.element.offsetWidth;
	const maxY = window.innerHeight - windowObj.element.offsetHeight;
	
	const boundedX = Math.max(0, Math.min(x, maxX));
	const boundedY = Math.max(0, Math.min(y, maxY));
	
	windowObj.element.style.left = boundedX + 'px';
	windowObj.element.style.top = boundedY + 'px';
}

handleMouseUp(e) {
	if (this.draggedWindow) {
		// this.draggedWindow.iframe.style.pointerEvents = 'auto'; // Re-enable iframe pointer events
		this.draggedWindow = null;
		

		// Reset isDragging after a short delay to prevent click from firing
		setTimeout(() => {
			this.isDragging = false;
		}, 50);
	}
}

handleClick(e) {
	// Handle address bar clicks
	if (e.target.classList.contains('address-bar')) {
		const windowEl = e.target.closest('.window');
		const windowObj = this.windows.find(w => w.element === windowEl);
		if (windowObj) {
			window.open(windowObj.url, '_blank');
		}
		return;
	}

	// // Handle window maximize/minimize - only if we just finished dragging or never started
	// const windowEl = e.target.closest('.window');
	// if (windowEl && !e.target.closest('.address-bar') && !this.isDragging) {
	//     const windowObj = this.windows.find(w => w.element === windowEl);
	//     if (windowObj) {
	//         if (windowObj.isMaximized) {
	//             this.minimizeWindow(windowObj);
	//         } else {
	//             this.maximizeWindow(windowObj);
	//         }
	//     }
	//     return;
	// }

	const TAP_THRESHOLD = 300; // Maximum time in ms 
	const touchDuration = Date.now() - this.clickInitiated;

	// Handle window maximize/minimize - only if we just finished dragging or never started
	// const windowEl = e.target.closest('.window');
	const windowEl = this.draggedWindow;
	this.draggedWindow = null;
	if (windowEl && !e.target.closest('.address-bar') && touchDuration < TAP_THRESHOLD) {
		const windowObj = this.windows.find(w => w.element === windowEl);
		if (windowObj) {
			if (windowObj.isMaximized) {
				this.minimizeWindow(windowObj);
			} else {
				this.maximizeWindow(windowObj);
			}
		}
		return;
	}

	// // Click on empty space - minimize all
	// if (!windowEl) {
	//     this.minimizeAllWindows();
	// }
}

maximizeWindow(windowObj) {
	// // Minimize currently maximized window
	// if (this.maximizedWindow && this.maximizedWindow !== windowObj) {
	//     this.minimizeWindow(this.maximizedWindow);
	// }

	if( windowObj.element.classList.contains('bounce-in')) {
		windowObj.element.classList.remove('bounce-in');
	}

	// Store current position to maintain continuity
	const currentLeft = parseInt(windowObj.element.style.left, 10);
	const currentTop = parseInt(windowObj.element.style.top, 10);
	
	windowObj.isMaximized = true;
	this.maximizedWindow = windowObj;
	
	// Add bounce animation
	windowObj.element.classList.add('bounce-scale');
	setTimeout(() => {
		windowObj.element.classList.remove('bounce-scale');
	}, 400);

	windowObj.element.classList.remove('minified');
	windowObj.element.classList.add('maximized');

	// const loadingIndicator = document.createElement('div');
	// loadingIndicator.className = 'loading-bar';
	// loadingIndicator.style.position = 'absolute';
	// loadingIndicator.style.top = '50%';
	// loadingIndicator.style.left = '50%';
	// loadingIndicator.style.width = '120px';
	// loadingIndicator.style.height = '40px';
	// windowObj.content.appendChild(loadingIndicator);
	// windowObj.loadingIndicator = loadingIndicator;
	
	this.keepWindowInBounds(windowObj, currentLeft, currentTop); // Reset position to top-left

	if (windowObj.iframe == null) {
		// Load iframe
		// const content = windowObj.element.querySelector('.window-content');
		// content.innerHTML = ''; // Clear previous content
		// content.innerHTML = `<iframe src="${windowObj.url}" title="${windowObj.title}"></iframe>`;
		var ifrm = document.createElement("iframe");
		ifrm.setAttribute("src", windowObj.url);
		ifrm.title = windowObj.title;
		windowObj.content.appendChild(ifrm);
		windowObj.iframe = ifrm;
		ifrm.addEventListener('click', (e) => {
			print("Clicked on iframe");
			this.setFrontWindow(windowObj.element);
		});

		// ifrm.addEventListener('load', () => {
		// 	windowObj.loadingIndicator.style.display = 'none';
		// });
	}
	windowObj.iframe.style.display = 'block';
	windowObj.preview.style.display = 'none';
	if (windowObj.resizeControl != null) {
		windowObj.resizeControl.style.display = 'block'; 
	}
	if (windowObj.width != null || windowObj.height != null) {
		windowObj.element.style.width = windowObj.width + 'px';
		windowObj.element.style.height = windowObj.height + 'px';
	} 
	this.setFrontWindow(windowObj.element);

}

minimizeWindow(windowObj) {
	windowObj.isMaximized = false;
	if (this.maximizedWindow === windowObj) {
		this.maximizedWindow = null;
	}

	// Add bounce animation
	windowObj.element.classList.add('bounce-scale');
	setTimeout(() => {
		windowObj.element.classList.remove('bounce-scale');
	}, 400);

	windowObj.element.classList.remove('maximized');
	windowObj.element.classList.add('minified');

	// Restore preview content
	// const content = windowObj.element.querySelector('.window-content');
	// content.innerHTML = `<div class="window-preview">${windowObj.title}</div>`;

	if (windowObj.iframe != null) {
		windowObj.iframe.style.display = 'none';
	}
	windowObj.preview.style.display = 'block';

	windowObj.resizeControl.style.display = 'none'; 
	windowObj.element.style.width = '';
	windowObj.element.style.height = '';
	
}

minimizeAllWindows() {
	this.windows.forEach(windowObj => {
		if (windowObj.isMaximized) {
			this.minimizeWindow(windowObj);
		}
	});
}
}

function ToggleBoringMode() {
	// history.pushState({}, "", window.location.href);
	if (window.location.hash == '#boring') {
		// window.location.hash = '';
		// window.open(window.location.origin.split('#')[0], '_self');
		history.pushState({}, "title", "index.html");
	} else {
		// window.location.hash = 'boring';
		// window.open(window.location.origin + '#boring', '_self');
		history.pushState({}, "title", "index.html#boring");
	}
	// console.log(window.location);
	// console.log(window.location.href);
	window.location.reload();
}

console.log(window.location.hash);
if(window.location.hash == '#boring') {
document.querySelectorAll('style, link[rel="stylesheet"]').forEach(e => e.remove());
}
else {
// Initialize when DOM is loaded
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => {
		new WindowManager();
	});
} else {
	new WindowManager();
}
}

