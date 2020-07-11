const searchInput = document.getElementById('search');
const resultsContainer = document.getElementById('results');
const repoInput = document.getElementById('repo');

let repoData = null;
let downstreams = null;

function displayIssues(issues, pulls){
	resultsContainer.innerHTML = '';
	issues.forEach(issue => {
		const a = document.createElement('a');
		a.href = `https://github.com/${repoData.repo}/issues/${issue.num}`;
		a.className = 'result';
		a.textContent = issue.title;
		resultsContainer.appendChild(a);
	});
}

async function loadIssues(data){
	repoData = data;
	displayIssues(repoData.issues, repoData.pulls);

	searchInput.addEventListener('input', (e) => {
		const pattern = '\\b' + e.target.value.toLowerCase();
		displayIssues(
			repoData.issues.filter(i => i.title.toLowerCase().search(pattern) != -1),
			repoData.pulls.filter(i => i.title.toLowerCase().search(pattern) != -1)
		);
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
