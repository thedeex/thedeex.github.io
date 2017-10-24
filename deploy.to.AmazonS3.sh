#!/usr/bin/env bash

# using aws-shell
# https://aws.amazon.com/cli/
# https://github.com/awslabs/aws-shell
# http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html
# to install:
# sudo pip install aws-shell
# to upgrade:
# pip install --upgrade aws-shell

aws s3 sync . s3://aws-website-deexdapp-6ovtc/ --delete

# published on:
# https://d1cmo8x25rg26g.cloudfront.net
# also available via:
# http://aws-website-deexdapp-6ovtc.s3-website-us-east-1.amazonaws.com (no SSL)