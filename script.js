const searchInput = document.getElementById('search');
const resultsContainer = document.getElementById('results');
const repoSelect = document.getElementById('repos');

let repoData = null;
let repos = null;

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

async function loadIssues(url){
	const res = await fetch(url);
	repoData = await res.json();
	displayIssues(repoData.issues, repoData.pulls);

	searchInput.addEventListener('input', (e) => {
		const pattern = '\\b' + e.target.value.toLowerCase();
		displayIssues(
			repoData.issues.filter(i => i.title.toLowerCase().search(pattern) != -1),
			repoData.pulls.filter(i => i.title.toLowerCase().search(pattern) != -1)
		);
	});
}

async function loadSelectedRepo(){
	await loadIssues(`https://gist.githubusercontent.com/${repos[repoSelect.value]}/raw/${repoSelect.value.replace('/', '-')}.json`);
}

repoSelect.addEventListener('change', loadSelectedRepo);

(async function load(){
	repos = await (await fetch('downstream.json')).json();

	Object.keys(repos).forEach((name) => {
		const option = document.createElement('option');
		option.textContent = name;
		repoSelect.appendChild(option);
	});

	repoSelect.selectedIndex = 1;
	loadSelectedRepo();

	const urlParams = new URL(document.location).searchParams;
	if (urlParams.has('url'))
		loadIssues(urlParams.get('url'));
})();
