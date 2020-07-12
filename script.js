const searchInput = document.getElementById('search');
const resultsContainer = document.getElementById('results');
const repoInput = document.getElementById('repo');
const labelContainer = document.getElementById('labels');
const typeSelect = document.getElementById('type');

let repoData = null;
let downstreams = null;
let labelFilters = [];

let activeLabel = null;

typeSelect.addEventListener('change', e => {
	refreshResults();
});

labelContainer.addEventListener('click', e => {
	if (activeLabel)
		activeLabel.classList.remove('active');

	if (activeLabel == e.target){
		activeLabel = null;
		labelFilters = [];
	} else {
		activeLabel = e.target;
		e.target.classList.add('active');
		labelFilters = [e.target.textContent];
	}
	refreshResults();
});

let pattern;

function filterIssue(issue){
	if (labelFilters.length > 0 && !issue.labels.includes(labelFilters[0]))
		return false;
	return issue.title.toLowerCase().search(pattern) != -1;
}

function refreshResults(){
	resultsContainer.innerHTML = '';
	pattern = '\\b' + searchInput.value.toLowerCase();

	(typeSelect.value == 'issues' ? repoData.issues : repoData.pulls)
	.filter(filterIssue).forEach(issue => {
		const a = document.createElement('a');
		a.href = `https://github.com/${repoData.repo}/issues/${issue.num}`;
		a.className = 'result';
		a.textContent = issue.title;
		resultsContainer.appendChild(a);
	});
}

async function loadIssues(data){
	repoData = data;
	refreshResults();

	searchInput.addEventListener('input', refreshResults);

	labelContainer.innerHTML = '';
	repoData.labels.forEach(label => {
		let div = document.createElement('div');
		div.className = 'label';
		div.textContent = label.name;
		labelContainer.appendChild(div);
	});
}

(async function load(){
	downstreams = await (await fetch('https://raw.githubusercontent.com/instant-issues/instant-issues.github.io/downstreams/downstreams.json')).json();

	const urlParams = new URL(document.location).searchParams;
	if (urlParams.has('url')){
		const res = await fetch(urlParams.get('url'));
		if (res.ok){
			loadIssues(await res.json());
		} else {
			alert("couldn't load URL");
		}
	} else if (urlParams.has('repo')){
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
				alert('failed to load downstream');
			}
		} else {
			alert('not yet aggregated');
		}
	} else {
		location.href = '?repo=zulip/zulip';
	}
})();
