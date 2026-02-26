#!/bin/bash
set -e

ENVIRONMENT=${1:-dev}
ACTION=${2:-plan}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_DIR="$ROOT_DIR/environments/$ENVIRONMENT"

if [ ! -d "$ENV_DIR" ]; then
  echo "Error: Environment '$ENVIRONMENT' not found"
  echo "Available environments: dev, staging, production"
  exit 1
fi

echo "=== PGMonitor Terraform Deployment ==="
echo "Environment: $ENVIRONMENT"
echo "Action: $ACTION"
echo ""

cd "$ROOT_DIR"

case $ACTION in
  init)
    echo "Initializing Terraform..."
    terraform init -backend-config="$ENV_DIR/backend.tfvars" -reconfigure
    ;;
  plan)
    echo "Planning Terraform changes..."
    terraform plan -var-file="$ENV_DIR/terraform.tfvars"
    ;;
  apply)
    echo "Applying Terraform changes..."
    terraform apply -var-file="$ENV_DIR/terraform.tfvars" -auto-approve
    ;;
  destroy)
    echo "Destroying Terraform resources..."
    terraform destroy -var-file="$ENV_DIR/terraform.tfvars"
    ;;
  output)
    echo "Showing Terraform outputs..."
    terraform output
    ;;
  *)
    echo "Usage: $0 <environment> <action>"
    echo ""
    echo "Environments: dev, staging, production"
    echo "Actions: init, plan, apply, destroy, output"
    exit 1
    ;;
esac

echo ""
echo "=== Done ==="
