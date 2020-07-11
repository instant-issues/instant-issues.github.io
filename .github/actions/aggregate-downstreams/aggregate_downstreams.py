#!/usr/bin/env python3
import os
import requests
import json

token = os.environ['INPUT_TOKEN']

session = requests.Session()

res = session.get('https://api.github.com/search/repositories?q=topic:instant-issues-downstream')

downstream = {}

for repo in res.json()['items']:
    res = session.get(repo['trees_url'].replace('{/sha}', '/issues?recursive=1'))
    for tree in res.json()['tree']:
        if tree['type'] == 'blob':
            other = tree['path'].replace('.json', '')
            downstream[other] = repo['full_name']

print(json.dumps(downstream))
