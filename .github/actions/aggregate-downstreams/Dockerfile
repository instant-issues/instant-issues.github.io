FROM python:3.7-alpine

RUN apk --update --no-cache add git && pip install requests

COPY aggregate_downstreams.py /aggregate_downstreams.py
COPY entrypoint.sh /entrypoint.sh
