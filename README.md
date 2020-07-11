# Instant Issues for GitHub

https://instant-issues.github.io/

A blazingly fast client-side search for GitHub issues. For enabled
repositories all open issues are regularily aggregated to a single JSON file,
which is downloaded by the client.

## How to enable it for a repository?

To enable Instant Issues for a repository you just need to create a YAML file
with the [upstream workflow](https://github.com/instant-issues/action#upstream-workflow).

If you want to use Instant Issues with repositories where you do not have write access,
you can create a new public repository and use the [downstream workflow](https://github.com/instant-issues/action#downstream-workflow).
You will need to tag your repository with the [instant-issues-downstream](https://github.com/topics/instant-issues-downstream) topic for it to be discovered by the frontend.

## Why is there no user script?

Because GitHub has a tight Content Security Policy we cannot patch the issue
search with a UserScript. A browser addon would have the necessary privileges
but it could also access your GitHub cookie, which is undesirable from a
security perspective.
