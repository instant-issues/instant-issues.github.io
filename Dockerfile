FROM python:3.7

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN pip install --upgrade --no-cache-dir requests

COPY aggregate_github_issues.py /aggregate_github_issues.py
RUN chmod +x /aggregate_github_issues.py

ENTRYPOINT /aggregate_github_issues.py
