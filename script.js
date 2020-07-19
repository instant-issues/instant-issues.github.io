const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('results');
const tabs = {
	issues: {
		button: document.getElementById('issues-tab'),
		panel:  document.getElementById('issues'),
		results: [],
		search: searchIssuesAndPulls,
		searchDirty: true
	},
	pulls: {
		button: document.getElementById('pulls-tab'),
		panel:  document.getElementById('pulls'),
		results: [],
		search: searchIssuesAndPulls,
		searchDirty: true
	},
	triage: {
		button: document.getElementById('triage-tab'),
		panel:  document.getElementById('triage'),
		results: [],
		search: function(){
			this.results = {
				issues: repoData.issues.filter(x => x.num in priorities),
				pulls : repoData.pulls.filter( x => x.num in priorities)
			};
			this.renderDirty = true;
		},
		searchDirty: true
	}
};

let activeTab = null;
let repoData = null;

function labelDiv(label){
	let div = document.createElement('div');
	div.className = 'label';
	div.textContent = label.name;
	div.title = label.description;
	div.tabIndex = 0;
	div.setAttribute('role', 'button');
	return div;
}

const selectedLabelContainer = document.getElementById('selectedLabels');
const suggestedLabelElements = {/* label: element */};
const selectedLabelElements = {/* label: element */};

function labelIsSelected(label){
	return selectedLabelElements[label] !== undefined;
}

function selectLabel(label){
	if (labelIsSelected(label)){
		console.warn(`label "${label}" is already selected`);
		return;
	}

	let div;
	if (label in suggestedLabelElements){
		div = suggestedLabelElements[label];
		delete suggestedLabelElements[label];
	} else {
		const labelData = repoData.labels.filter(l => l.name == label);
		if (labelData.length == 0){
			console.warn(`couldn't find label "${label}"`);
			return;
		}
		div = labelDiv(labelData[0]);
	}

	selectedLabelContainer.appendChild(div);
	selectedLabelElements[label] = div;
	// TODO: add class in labelPopover
}

function deselectLabel(label){
	if (!labelIsSelected(label)){
		console.warn(`label "${label}" is not selected`);
		return;
	}
	selectedLabelElements[label].remove();
	delete selectedLabelElements[label];
	// TODO: remove class in labelPopover
}

const labelPopover = document.getElementById('labelPopover');
const toggleLabels = document.getElementById('toggle-labels');

function updateURL(){
	const url = new URL(document.location);
	url.search = '';
	url.searchParams.set('repo', repoData.name);
	url.searchParams.set('q', searchInput.value);
	Object.keys(selectedLabelElements).forEach(label => url.searchParams.append('label', label));
	url.searchParams.set('tab', activeTab);
	history.replaceState({}, document.title, '?' + url.searchParams.toString());
}

toggleLabels.addEventListener('click', (e) => {
	if (labelPopover.hasAttribute('hidden')){
		labelPopover.removeAttribute('hidden');
		resultsContainer.setAttribute('hidden', true);
		e.stopPropagation();
		toggleLabels.setAttribute('aria-checked', true);
	}
});

labelPopover.addEventListener('click', (e) => {
	const label = e.target.textContent;
	if (labelIsSelected(label)){
		deselectLabel(label);
	} else {
		selectLabel(label);
	}
	updateActiveTab(true);
	updateURL();
	searchInput.focus();
});

function hideLabels(){
	labelPopover.setAttribute('hidden', true);
	resultsContainer.removeAttribute('hidden');
	toggleLabels.setAttribute('aria-checked', false);
}

document.body.addEventListener('click', () => {
	hideLabels();
});

searchInput.addEventListener('focus', () => {
	hideLabels();
});

let priorities = {/* id: <1,2,3> */};

function savePriorities(){
	localStorage.setItem('priorities', JSON.stringify(priorities));
	tabs.issues.renderDirty = true;
	tabs.pulls.renderDirty = true;
	tabs.triage.searchDirty = true;
}

function loadPriorities(){
	let saved = localStorage.getItem('priorities');
	if (saved == null){
		priorites = {};
	} else {
		priorities = JSON.parse(saved);
	}
}

resultsContainer.addEventListener('keydown', (e) => {
	if (e.target.classList.contains('result')){
		e.stopPropagation();
		if (e.key > 0 && e.key < 4){
			priorities[e.target.previousSibling.dataset.issue] = parseInt(e.key);
			e.target.previousSibling.dataset.priority = e.key;
			savePriorities();
		} else if (e.key == 'Delete'){
			delete priorities[e.target.previousSibling.dataset.issue];
			e.target.previousSibling.dataset.priority = '';
			savePriorities();
		}
	}
});

resultsContainer.addEventListener('click', (e) => {
	if (e.target.classList.contains('priority')){
		e.stopPropagation();
		const num = parseInt(e.target.dataset.issue);
		let priority;
		if (num in priorities){
			if (priorities[num] == 3)
				delete priorities[num];
			else
				priorities[num] += 1;
		} else {
			priorities[num] = 1;
		}
		e.target.dataset.priority = priorities[num] || '';
		savePriorities();
	}
});

resultsContainer.addEventListener('contextmenu', (e) => {
	if (e.target.classList.contains('priority')){
		e.preventDefault();
		e.stopPropagation();
		const num = parseInt(e.target.dataset.issue);
		let priority;
		if (num in priorities){
			if (priorities[num] == 1)
				delete priorities[num];
			else
				priorities[num] -= 1;
		} else {
			priorities[num] = 3;
		}
		e.target.dataset.priority = priorities[num] || '';
		savePriorities();
	}
});

const labelBar = document.getElementById('labelBar');

function openTab(tabname){
	if (activeTab){
		tabs[activeTab].button.setAttribute('aria-selected', 'false');
		tabs[activeTab].button.tabIndex = 0;
		tabs[activeTab].panel.setAttribute('hidden', true);
	}

	const tab = tabs[tabname];
	tab.button.setAttribute('aria-selected', 'true');
	tab.button.tabIndex = -1;
	tab.panel.removeAttribute('hidden');
	activeTab = tabname;

	updateActiveTab();

	if (tabname == 'triage'){
		labelBar.setAttribute('hidden', true);
		searchInput.setAttribute('hidden', true);
	} else {
		labelBar.removeAttribute('hidden');
		searchInput.removeAttribute('hidden');
	}
	searchInput.focus();
	updateURL();
}

Object.values(tabs).forEach(tab => tab.button.addEventListener('click', e => {
	openTab(e.target.getAttribute('aria-controls'));
}));

document.body.addEventListener('keydown', e => {
	const role = e.target.getAttribute('role');
	if (['button', 'tab'].includes(role) && e.key === 'Enter') {
		e.target.click();
	} else if (role == 'checkbox' && ['Enter', ' '].includes(e.key)){
		e.target.click();
	}
});

const suggestedLabelContainer = document.getElementById('suggestedLabels');
suggestedLabelContainer.addEventListener('click', e => {
	selectLabel(e.target.textContent);
	searchInput.value = '';
	searchInput.focus();
	updateActiveTab(true);
	suggestLabels();
	updateURL();
	resultsContainer.scrollTo(0, 0);
});

selectedLabelContainer.addEventListener('click', e => {
	deselectLabel(e.target.textContent);
	updateActiveTab(true);
	suggestLabels();
	searchInput.focus();
	updateURL();
	resultsContainer.scrollTo(0, 0);
});

let pattern;

function suggestLabels(){
	suggestedLabelContainer.innerHTML = '';
	if (searchInput.value.length > 1){
		repoData.labels.filter(
			label =>
			(
				label.name.toLowerCase().search(pattern) != -1 ||
				(label.description || '').toLowerCase().search(pattern) != -1
			) && !labelIsSelected(label.name)
		).forEach(label => {
			const div = labelDiv(label);
			suggestedLabelElements[label.name] = div;
			suggestedLabelContainer.appendChild(div);
		});
	}
}

function updateActiveTab(dirty){
	if (dirty || tabs[activeTab].searchDirty){
		tabs[activeTab].search();
		tabs[activeTab].searchDirty = false;
	}
	if (dirty || tabs[activeTab].renderDirty){
		renderTab(tabs[activeTab]);
		tabs[activeTab].renderDirty = false;
	}
}

function renderTab(tab){
	tab.panel.innerHTML = '';
	Object.keys(tab.results).forEach(group => {
		const groupContainer = document.createElement('div');
		if (tab.results[group].length == 0)
			return;
		const h2 = document.createElement('h2');
		h2.textContent = group;
		groupContainer.appendChild(h2);
		const resultsGroup = document.createElement('div');
		resultsGroup.className = 'results-group';

		tab.results[group].sort((a,b) => (priorities[a.num] || 4) - (priorities[b.num] || 4)).forEach(issue => {
			const priority = document.createElement('div');
			priority.className = 'priority';
			priority.dataset.issue = issue.num;
			priority.dataset.priority = priorities[issue.num] || '';
			priority.title = 'Change priority';
			resultsGroup.appendChild(priority);

			const a = document.createElement('a');
			a.href = `https://github.com/${repoData.repo}/issues/${issue.num}`;
			a.className = 'result';
			a.textContent = issue.title;
			a.target = '_blank';
			a.title = issue.labels.join(', ');
			resultsGroup.appendChild(a);
		});
		groupContainer.appendChild(resultsGroup);
		tab.panel.appendChild(groupContainer);
	});
}

const countBadges = {
	issues: document.getElementById('issueCount'),
	pulls: document.getElementById('pullCount')
};

function searchIssuesAndPulls(){
	pattern = '(^| |\\b)' + searchInput.value.toLowerCase();

	['issues', 'pulls'].forEach(tab => {
		const groups = {};
		repoData.disjointLabels.forEach(l => groups[l] = []);
		groups.other = [];
		let count = 0;

		repoData[tab].filter(
			issue =>
			issue.title.toLowerCase().search(pattern) != -1 &&
			Object.keys(selectedLabelElements).filter(l => issue.labels.includes(l)).length == Object.keys(selectedLabelElements).length
		).forEach(issue => {
			count += 1;
			const labels = issue.labels.filter(l => repoData.disjointLabels.includes(l));
			if (labels.length == 0){
				groups.other.push(issue);
			} else {
				labels.forEach(label => groups[label].push(issue));
			}
		});
		countBadges[tab].textContent = count;
		tabs[tab].results = groups;
		tabs[tab].renderDirty = true;
	});
}

let historyTimeout = null;

searchInput.addEventListener('input', e => {
	updateActiveTab(true);
	suggestLabels();
	if (historyTimeout)
		clearTimeout(historyTimeout);

	historyTimeout = setTimeout(() => updateURL(), 1000);
});

async function loadIssues(data, urlParams){
	loadPriorities();
	repoData = data;
	if (!('disjointLabels' in repoData))
		repoData.disjointLabels = [];

	searchInput.removeAttribute('hidden');
	document.getElementById('tablist').removeAttribute('hidden');
	labelBar.removeAttribute('hidden');

	if (urlParams.has('q')){
		searchInput.value = urlParams.get('q');
	}

	urlParams.getAll('label').forEach(label => selectLabel(label));

	repoData.labels.forEach(label => {
		labelPopover.appendChild(labelDiv(label));
	});

	searchIssuesAndPulls();
	openTab(urlParams.get('tab') || 'issues');

	suggestLabels();
	searchInput.focus();

	const repoLink = document.getElementById('repoLink');
	repoLink.href = 'https://github.com/' + repoData.name;
	repoLink.removeAttribute('hidden');
}

(async function load(){
	const downstreams = await (await fetch('https://raw.githubusercontent.com/instant-issues/instant-issues.github.io/downstreams/downstreams.json')).json();
	Object.keys(downstreams).forEach(downstream => {
		const opt = document.createElement('option');
		opt.value = downstream;
		document.getElementById('downstreamDatalist').appendChild(opt);
	});

	const urlParams = new URL(document.location).searchParams;

	if (urlParams.has('url')){
		const res = await fetch(urlParams.get('url'));
		if (res.ok){
			loadIssues(await res.json(), urlParams);
		} else {
			resultsContainer.innerHTML = "couldn't load URL";
		}
	} else if (urlParams.get('repo')){
		const repo = urlParams.get('repo');
		document.getElementById('repoInput').value = repo;
		let res = await fetch(`https://raw.githubusercontent.com/${repo}/issues/${repo}.json`);
		if (res.ok){
			loadIssues(await res.json(), urlParams);
		} else if (repo in downstreams){
			res = await fetch(`https://raw.githubusercontent.com/${downstreams[repo]}/issues/${repo}.json`);
			if (res.ok){
				loadIssues(await res.json(), urlParams);
			} else {
				resultsContainer.innerHTML = 'failed to load downstream';
			}
		} else if ((await fetch('https://api.github.com/repos/' + repo, {method: 'head'})).ok){
			resultsContainer.innerHTML = 'not yet aggregated, checkout the <a href="https://github.com/instant-issues/instant-issues.github.io#readme">the README</a> for instructions';
		} else {
			resultsContainer.innerHTML = 'repository not found';
		}
	} else {
		resultsContainer.innerHTML = 'Which repository\'s issues do you want to view?<p><a href="/?repo=zulip/zulip">Try out zulip/zulip.</a></p>';
	}
})();
