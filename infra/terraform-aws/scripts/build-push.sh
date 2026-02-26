#!/bin/bash
set -e

ENVIRONMENT=${1:-dev}
IMAGE_TAG=${2:-latest}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "=== Building and Pushing Docker Images ==="
echo "Environment: $ENVIRONMENT"
echo "Image Tag: $IMAGE_TAG"
echo ""

AWS_REGION=$(terraform -chdir="$SCRIPT_DIR/.." output -raw aws_region 2>/dev/null || echo "us-east-1")
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

echo "Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

WEB_REPO="$ECR_REGISTRY/pgmonitor-$ENVIRONMENT-web"
API_REPO="$ECR_REGISTRY/pgmonitor-$ENVIRONMENT-api"

echo ""
echo "Building web image..."
docker build -t $WEB_REPO:$IMAGE_TAG "$ROOT_DIR/apps/web"

echo ""
echo "Building API image..."
docker build -t $API_REPO:$IMAGE_TAG "$ROOT_DIR/apps/api"

echo ""
echo "Pushing web image..."
docker push $WEB_REPO:$IMAGE_TAG

echo ""
echo "Pushing API image..."
docker push $API_REPO:$IMAGE_TAG

echo ""
echo "=== Images pushed successfully ==="
echo "Web: $WEB_REPO:$IMAGE_TAG"
echo "API: $API_REPO:$IMAGE_TAG"

echo ""
echo "To deploy, run:"
echo "aws ecs update-service --cluster pgmonitor-$ENVIRONMENT --service pgmonitor-$ENVIRONMENT-web --force-new-deployment"
echo "aws ecs update-service --cluster pgmonitor-$ENVIRONMENT --service pgmonitor-$ENVIRONMENT-api --force-new-deployment"
