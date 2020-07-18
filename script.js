const searchInput = document.getElementById('search');
const resultsContainer = document.getElementById('results');
const panels = {
	issues: document.getElementById('issues'),
	pulls:  document.getElementById('pulls')
};
const results = {
	issues: [],
	pulls: []
};
const countBadges = {
	issues: document.getElementById('issueCount'),
	pulls: document.getElementById('pullCount')
};
const tabs = {
	issues: document.getElementById('issues-tab'),
	pulls: document.getElementById('pulls-tab')
};

const repoInput = document.getElementById('repo');
const selectedLabelContainer = document.getElementById('selectedLabels');
const suggestedLabelContainer = document.getElementById('suggestedLabels');
const downstreamDatalist = document.getElementById('downstreams');
const repoLink = document.getElementById('repoLink');
const showLabels = document.getElementById('showLabels');
const labelContainer = document.getElementById('labels');
const toggleLabels = document.getElementById('toggle-labels');
const tabList = document.getElementById('tablist');
const labelBar = document.getElementById('labelBar');
const prioritizedCheckbox = document.getElementById('only-prioritized');

let repoData = null;
let downstreams = null;
const labelFilters = {};

let activeTab = 'issues';

toggleLabels.addEventListener('click', (e) => {
	if (labelContainer.hasAttribute('hidden')){
		labelContainer.removeAttribute('hidden');
		resultsContainer.setAttribute('hidden', true);
		e.stopPropagation();
		toggleLabels.setAttribute('aria-checked', true);
	}
});

labelContainer.addEventListener('click', (e) => {
	const label = e.target.textContent;
	if (labelFilters[label]){
		e.stopPropagation();
		return;
	}
	labelFilters[label] = true;
	selectedLabelContainer.appendChild(labelDiv(repoData.labels.filter(l => l.name == label)[0]));
	refreshResults();
	searchInput.focus();
});

function hideLabels(){
	labelContainer.setAttribute('hidden', true);
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
			e.target.previousSibling.children[0].textContent = e.key;
			savePriorities();
		} else if (e.key == 'Delete'){
			delete priorities[e.target.previousSibling.dataset.issue];
			e.target.previousSibling.children[0].textContent = '';
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
		e.target.children[0].textContent = priorities[num] || '';
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
		e.target.children[0].textContent = priorities[num] || '';
		savePriorities();
	}
});

let onlyPrioritized = false;
prioritizedCheckbox.addEventListener('click', () => {
	onlyPrioritized = !onlyPrioritized;
	prioritizedCheckbox.setAttribute('aria-checked', onlyPrioritized);
	refreshResults();
});

function updateURL(){
	const params = new URL(document.location).searchParams;
	params.set('q', searchInput.value);
	params.delete('label');
	Object.keys(labelFilters).forEach(label => params.append('label', label));
	params.set('tab', activeTab);
	history.replaceState({}, document.title, '?' + params.toString());
}

function openTab(tabname){
	tabs[activeTab].setAttribute('aria-selected', 'false');
	tabs[activeTab].tabIndex = 0;
	panels[activeTab].setAttribute('hidden', true);

	tabs[tabname].setAttribute('aria-selected', 'true');
	tabs[tabname].tabIndex = -1;
	panels[tabname].removeAttribute('hidden');
	activeTab = tabname;
	refreshResults();
	searchInput.focus();
	updateURL();
}

Object.values(tabs).forEach(tab => tab.addEventListener('click', e => {
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

suggestedLabelContainer.addEventListener('click', e => {
	selectedLabelContainer.appendChild(e.target);
	labelFilters[e.target.textContent] = true;
	searchInput.value = '';
	refreshResults();
	suggestLabels();
	searchInput.focus();
	updateURL();
	resultsContainer.scrollTo(0, 0);
});

selectedLabelContainer.addEventListener('click', e => {
	e.target.remove();
	delete labelFilters[e.target.textContent];
	refreshResults();
	suggestLabels();
	searchInput.focus();
	updateURL();
	resultsContainer.scrollTo(0, 0);
});

let pattern;

function labelDiv(label){
	let div = document.createElement('div');
	div.className = 'label';
	div.textContent = label.name;
	div.title = label.description;
	div.tabIndex = 0;
	div.setAttribute('role', 'button');
	return div;
}

function suggestLabels(){
	suggestedLabelContainer.innerHTML = '';
	if (searchInput.value.length > 1){
		repoData.labels.filter(
			label =>
			(
				label.name.toLowerCase().search(pattern) != -1
				||
				(label.description || '').toLowerCase().search(pattern) != -1
			)
			&& !labelFilters[label.name]
		).forEach(label => {
			suggestedLabelContainer.appendChild(labelDiv(label));
		});
	}
}

function renderIfNecessary(){
	if (panels[activeTab].innerHTML != '')
		return;
	const groups = results[activeTab];

	Object.keys(groups).forEach(group => {
		const groupContainer = document.createElement('div');
		if (groups[group].length == 0)
			return;
		const h2 = document.createElement('h2');
		h2.textContent = group;
		groupContainer.appendChild(h2);
		const resultsGroup = document.createElement('div');
		resultsGroup.className = 'results-group';

		groups[group].sort((a,b) => (priorities[a.num] || 4) - (priorities[b.num] || 4)).forEach(issue => {
			const priority = document.createElement('div');
			priority.className = 'priority';
			priority.dataset.issue = issue.num;
			priority.title = 'Change priority';

			const prioritySpan = document.createElement('span');
			prioritySpan.textContent = priorities[issue.num];
			priority.appendChild(prioritySpan);
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
		panels[activeTab].appendChild(groupContainer);
	});
}

function search(tab, pattern){
	panels[tab].innerHTML = '';

	const groups = {};
	repoData.disjointLabels.forEach(l => groups[l] = []);
	groups.other = [];
	let count = 0;

	repoData[tab].filter(
		issue =>
		issue.title.toLowerCase().search(pattern) != -1
		&& Object.keys(labelFilters).filter(l => issue.labels.includes(l)).length == Object.keys(labelFilters).length
		&& (!onlyPrioritized || issue.num in priorities)
	).forEach(issue => {
		count += 1;
		const labels = issue.labels.filter(l => repoData.disjointLabels.includes(l));
		if (labels.length == 0){
			groups.other.push(issue);
		} else {
			labels.forEach(label => groups[label].push(issue));
		}
	});

	results[tab] = groups;
	countBadges[tab].textContent = count;
}

function refreshResults(){
	pattern = '(^| |\\b)' + searchInput.value.toLowerCase();
	search('issues', pattern);
	search('pulls', pattern);
	renderIfNecessary();
}

let historyTimeout = null;

searchInput.addEventListener('input', e => {
	refreshResults();
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

	repoLink.removeAttribute('hidden');
	searchInput.removeAttribute('hidden');
	tabList.removeAttribute('hidden');
	labelBar.removeAttribute('hidden');

	if (urlParams.has('q')){
		searchInput.value = urlParams.get('q');
	}
	if (urlParams.has('tab')){
		openTab(urlParams.get('tab'));
	}

	urlParams.getAll('label').forEach(label => {
		labelFilters[label] = true;
		selectedLabelContainer.appendChild(labelDiv(repoData.labels.filter(l => l.name == label)[0]));
	});

	repoData.labels.forEach(label => {
		labelContainer.appendChild(labelDiv(label));
	});

	refreshResults();
	suggestLabels();
	searchInput.focus();
	repoLink.href = 'https://github.com/' + repoData.name;
}

(async function load(){
	downstreams = await (await fetch('https://raw.githubusercontent.com/instant-issues/instant-issues.github.io/downstreams/downstreams.json')).json();
	Object.keys(downstreams).forEach(downstream => {
		const opt = document.createElement('option');
		opt.value = downstream;
		downstreamDatalist.appendChild(opt);
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
		repoInput.value = repo;
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
