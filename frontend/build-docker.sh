#!/bin/bash

# Set variables
IMAGE_NAME=drogaconsulting/pms
TAG="latest"

# Build the Docker image
echo "Building Docker image: $IMAGE_NAME:$TAG"
docker build -t $IMAGE_NAME:$TAG .

# Check if the build was successful
if [ $? -eq 0 ]; then
    echo "Docker image built successfully: $IMAGE_NAME:$TAG"
else
    echo "Docker build failed!" >&2
    exit 1
fi
