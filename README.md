# Instant Issues for GitHub

https://instant-issues.github.io/

A blazingly fast search for GitHub issues.

## How to enable it for a repository?

If you have write access you can copy [this scheduled GitHub action](.github/workflows/aggregate-issues.yml) into your Repository.

If you do not have write access you can set up a cron job running the `contribute.py` script.
This requires you to [create a personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token). The script checks for each public repository you have starred if it uses the action or is already supported by another user. If neither is the case the script aggregates the issues to a single JSON file and force pushes it as a Gist file. The first time this happens the script submits your Gist file as an issue in this repository.

## How does it work?

The search is entirely client-side. All open issues are regularily aggregated
to a single JSON file, which is downloaded by the client.

## Planned features

* UserScript to replace GitHub search with Instant Issues if available
