const searchInput = document.getElementById('search');
const resultsContainer = document.getElementById('results');
const repoInput = document.getElementById('repo');
const selectedLabelContainer = document.getElementById('selectedLabels');
const suggestedLabelContainer = document.getElementById('suggestedLabels');
const downstreamDatalist = document.getElementById('downstreams');

let repoData = null;
let downstreams = null;
const labelFilters = {};

let labelNames = [];

let activeTab = document.querySelector('.tab.active');

document.querySelector('.tabs').addEventListener('click', e => {
	activeTab.classList.remove('active');
	activeTab = e.target;
	e.target.classList.add('active');
	refreshResults();
	searchInput.focus();
});

suggestedLabelContainer.addEventListener('click', e => {
	selectedLabelContainer.appendChild(e.target);
	labelFilters[e.target.textContent] = true;
	searchInput.value = '';
	refreshResults();
	searchInput.focus();
});

selectedLabelContainer.addEventListener('click', e => {
	e.target.remove();
	delete labelFilters[e.target.textContent];
	refreshResults();
	suggestLabels();
	searchInput.focus();
});

let pattern;

function suggestLabels(){
	suggestedLabelContainer.innerHTML = '';
	if (searchInput.value.length > 1){
		labelNames.filter(
			n =>
			n.toLowerCase().search(pattern) != -1
			&& !labelFilters[n]
		).forEach(label => {
			let div = document.createElement('div');
			div.className = 'label';
			div.textContent = label;
			suggestedLabelContainer.appendChild(div);
		});
	}
}

function refreshResults(){
	resultsContainer.innerHTML = '';
	pattern = '\\b' + searchInput.value.toLowerCase();

	(activeTab.textContent == 'Issues' ? repoData.issues : repoData.pulls)
	.filter(
		issue =>
		issue.title.toLowerCase().search(pattern) != -1
		&& Object.keys(labelFilters).filter(l => issue.labels.includes(l)).length == Object.keys(labelFilters).length
	).forEach(issue => {
		const a = document.createElement('a');
		a.href = `https://github.com/${repoData.repo}/issues/${issue.num}`;
		a.className = 'result';
		a.textContent = issue.title;
		a.target = '_blank';
		a.title = issue.labels.join(', ');
		resultsContainer.appendChild(a);
	});
}
searchInput.addEventListener('input', e => {
	refreshResults();
	suggestLabels();
});

async function loadIssues(data){
	repoData = data;
	refreshResults();
	labelNames = repoData.labels.map(label => label.name);
	document.body.classList.add('loaded');
	searchInput.focus();
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
			loadIssues(await res.json());
		} else {
			resultsContainer.innerHTML = "couldn't load URL";
		}
	} else if (urlParams.get('repo')){
		const repo = urlParams.get('repo');
		repoInput.value = repo;
		let res = await fetch(`https://raw.githubusercontent.com/${repo}/issues/${repo}.json`);
		if (res.ok){
			loadIssues(await res.json());
		} else if (repo in downstreams){
			res = await fetch(`https://raw.githubusercontent.com/${downstreams[repo]}/issues/${repo}.json`);
			if (res.ok){
				loadIssues(await res.json());
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
